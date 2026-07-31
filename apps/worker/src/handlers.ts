import { prisma } from "@casero/database";
import {
  ConsentPurpose,
  GmailConnectionStatus,
  JobStatus,
  JobType,
  type OutboxJob,
} from "@casero/database/generated";
import { GmailOAuthClient, TokenCipher } from "@casero/gmail";

import { workerEnv } from "./env";
import { createMailboxClient } from "./gmail-runtime";
import { runDealResearch } from "./deal-research";
import { renewWatch, runIncrementalSync, runInitialSync } from "./gmail-sync";
import {
  ConnectionJobPayload,
  DealResearchJobPayload,
  MessageJobPayload,
  ShoppingResearchJobPayload,
} from "./job-payloads";
import { processGmailMessage } from "./process-message";
import { runShoppingResearch } from "./shopping-research";

async function disconnectGmail(connectionId: string) {
  const connection = await prisma.gmailConnection.findUnique({
    where: { id: connectionId },
  });
  if (!connection) return;

  const cipher = new TokenCipher(workerEnv.tokenEncryptionKey);
  const accessToken = cipher.decrypt(connection.accessTokenCiphertext);
  try {
    await createMailboxClient(connection).stopWatch();
  } catch {
    // Revocation and local deletion must continue if a watch was never active.
  }
  await new GmailOAuthClient({
    clientId: workerEnv.googleClientId,
    clientSecret: workerEnv.googleClientSecret,
    redirectUri: workerEnv.gmailRedirectUri,
  }).revoke(accessToken);

  await prisma.$transaction([
    prisma.outboxJob.updateMany({
      where: {
        userId: connection.userId,
        status: { in: [JobStatus.PENDING, JobStatus.RETRY] },
      },
      data: { status: JobStatus.CANCELLED },
    }),
    prisma.consentGrant.updateMany({
      where: {
        userId: connection.userId,
        purpose: ConsentPurpose.GMAIL_PROMOTION_ANALYSIS,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    }),
    prisma.gmailConnection.delete({ where: { id: connectionId } }),
  ]);
}

export async function handleJob(job: OutboxJob): Promise<void> {
  if (job.type === JobType.GMAIL_PROCESS_MESSAGE) {
    return processGmailMessage(MessageJobPayload.parse(job.payload));
  }
  if (job.type === JobType.DEAL_DEEP_ANALYSIS) {
    return runDealResearch(
      DealResearchJobPayload.parse(job.payload).analysisId,
    );
  }
  if (job.type === JobType.SHOPPING_INTENT_RESEARCH) {
    return runShoppingResearch(
      ShoppingResearchJobPayload.parse(job.payload).intentId,
    );
  }

  const { connectionId } = ConnectionJobPayload.parse(job.payload);
  switch (job.type) {
    case JobType.GMAIL_INITIAL_SYNC:
      return runInitialSync(connectionId);
    case JobType.GMAIL_INCREMENTAL_SYNC:
      return runIncrementalSync(connectionId);
    case JobType.GMAIL_RENEW_WATCH:
      if (workerEnv.pubSubTopic) {
        return renewWatch(connectionId, workerEnv.pubSubTopic);
      }
      return;
    case JobType.GMAIL_DISCONNECT:
      return disconnectGmail(connectionId);
    default:
      throw new Error(`Unsupported job type: ${job.type}`);
  }
}

export async function scheduleGmailWork() {
  const now = new Date();
  const connections = await prisma.gmailConnection.findMany({
    where: { status: GmailConnectionStatus.ACTIVE },
    select: {
      id: true,
      userId: true,
      lastSyncAt: true,
      watchExpiration: true,
    },
  });
  const pollBucket = Math.floor(now.getTime() / workerEnv.gmailPollMs);
  const dayBucket = now.toISOString().slice(0, 10);

  for (const connection of connections) {
    if (
      !connection.lastSyncAt ||
      now.getTime() - connection.lastSyncAt.getTime() >= workerEnv.gmailPollMs
    ) {
      await prisma.outboxJob.upsert({
        where: {
          idempotencyKey: `gmail-poll:${connection.id}:${pollBucket}`,
        },
        create: {
          userId: connection.userId,
          type: JobType.GMAIL_INCREMENTAL_SYNC,
          payload: { connectionId: connection.id },
          idempotencyKey: `gmail-poll:${connection.id}:${pollBucket}`,
        },
        update: {},
      });
    }

    if (
      workerEnv.pubSubTopic &&
      (!connection.watchExpiration ||
        connection.watchExpiration.getTime() - now.getTime() < 86_400_000)
    ) {
      await prisma.outboxJob.upsert({
        where: {
          idempotencyKey: `gmail-watch:${connection.id}:${dayBucket}`,
        },
        create: {
          userId: connection.userId,
          type: JobType.GMAIL_RENEW_WATCH,
          payload: { connectionId: connection.id },
          idempotencyKey: `gmail-watch:${connection.id}:${dayBucket}`,
        },
        update: {},
      });
    }
  }
}

export async function scheduleShoppingResearch() {
  const now = new Date();
  const dueIntents = await prisma.shoppingIntent.findMany({
    where: {
      active: true,
      watchEnabled: true,
      nextCheckAt: { lte: now },
      researchStatus: { notIn: ["PENDING", "RUNNING"] },
    },
    select: { id: true, userId: true },
    take: 100,
  });
  const dayBucket = now.toISOString().slice(0, 10);

  for (const intent of dueIntents) {
    const idempotencyKey = `shopping-watch:${intent.id}:${dayBucket}`;
    await prisma.$transaction([
      prisma.shoppingIntent.update({
        where: { id: intent.id },
        data: { researchStatus: "PENDING" },
      }),
      prisma.outboxJob.upsert({
        where: { idempotencyKey },
        create: {
          userId: intent.userId,
          type: JobType.SHOPPING_INTENT_RESEARCH,
          payload: { intentId: intent.id },
          idempotencyKey,
          maxAttempts: 3,
        },
        update: {},
      }),
    ]);
  }
}
