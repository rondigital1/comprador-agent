import { prisma } from "@comprador/database";
import { GmailConnectionStatus, JobType } from "@comprador/database/generated";
import { GmailHistoryExpiredError } from "@comprador/gmail";

import { createMailboxClient } from "./gmail-runtime";
import { enqueueJob } from "./queue";

async function requireActiveConnection(connectionId: string) {
  const connection = await prisma.gmailConnection.findFirst({
    where: { id: connectionId, status: GmailConnectionStatus.ACTIVE },
  });
  if (!connection) {
    throw new Error(`Active Gmail connection ${connectionId} was not found`);
  }
  return connection;
}

async function enqueueMessages(input: {
  userId: string;
  connectionId: string;
  messageIds: string[];
}) {
  for (const gmailMessageId of input.messageIds) {
    await prisma.gmailMessage.upsert({
      where: {
        connectionId_gmailMessageId: {
          connectionId: input.connectionId,
          gmailMessageId,
        },
      },
      create: {
        userId: input.userId,
        connectionId: input.connectionId,
        gmailMessageId,
      },
      update: {},
    });
    await enqueueJob({
      userId: input.userId,
      type: JobType.GMAIL_PROCESS_MESSAGE,
      payload: { connectionId: input.connectionId, gmailMessageId },
      idempotencyKey: `gmail-message:${input.connectionId}:${gmailMessageId}`,
    });
  }
}

export async function runInitialSync(connectionId: string) {
  const connection = await requireActiveConnection(connectionId);
  const gmail = createMailboxClient(connection);
  const profile = await gmail.getProfile();
  const messageIds = await gmail.listMessageIds(connection.backfillQuery);

  await enqueueMessages({
    userId: connection.userId,
    connectionId,
    messageIds,
  });

  await prisma.gmailConnection.update({
    where: { id: connection.id },
    data: {
      historyId: profile.historyId,
      lastSyncAt: new Date(),
      lastError: null,
    },
  });

  if (profile.historyId) {
    await enqueueJob({
      userId: connection.userId,
      type: JobType.GMAIL_INCREMENTAL_SYNC,
      payload: { connectionId },
      idempotencyKey: `gmail-incremental:${connectionId}:${profile.historyId}`,
    });
  }
}

export async function runIncrementalSync(connectionId: string) {
  const connection = await requireActiveConnection(connectionId);
  if (!connection.historyId) {
    return runInitialSync(connectionId);
  }

  const gmail = createMailboxClient(connection);
  try {
    const changes = await gmail.listAddedMessageIds({
      startHistoryId: connection.historyId,
      labelId: connection.labelIds[0],
    });
    await enqueueMessages({
      userId: connection.userId,
      connectionId,
      messageIds: changes.messageIds,
    });
    await prisma.gmailConnection.update({
      where: { id: connectionId },
      data: {
        historyId: changes.latestHistoryId,
        lastSyncAt: new Date(),
        lastError: null,
      },
    });
  } catch (error) {
    if (error instanceof GmailHistoryExpiredError) {
      return runInitialSync(connectionId);
    }
    throw error;
  }
}

export async function renewWatch(connectionId: string, topicName: string) {
  const connection = await requireActiveConnection(connectionId);
  const result = await createMailboxClient(connection).startWatch(
    topicName,
    connection.labelIds,
  );
  await prisma.gmailConnection.update({
    where: { id: connectionId },
    data: {
      historyId: result.historyId ?? connection.historyId,
      watchExpiration: result.expiration,
      lastError: null,
    },
  });
}
