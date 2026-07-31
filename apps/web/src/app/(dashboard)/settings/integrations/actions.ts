"use server";

import { JobType } from "@comprador/database/generated";
import { prisma } from "@comprador/database";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function syncGmailNow() {
  const userId = await requireUserId();
  const connection = await prisma.gmailConnection.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (!connection) return;

  const minuteBucket = Math.floor(Date.now() / 60_000);
  const idempotencyKey = `gmail-manual:${connection.id}:${minuteBucket}`;
  await prisma.outboxJob.upsert({
    where: { idempotencyKey },
    create: {
      userId,
      type: JobType.GMAIL_INCREMENTAL_SYNC,
      payload: { connectionId: connection.id },
      idempotencyKey,
    },
    update: {},
  });
  revalidatePath("/settings/integrations");
}

export async function disconnectGmail() {
  const userId = await requireUserId();
  const connection = await prisma.gmailConnection.findFirst({
    where: { userId, status: { not: "DISCONNECTING" } },
  });
  if (!connection) return;

  await prisma.gmailConnection.update({
    where: { id: connection.id },
    data: { status: "DISCONNECTING" },
  });
  await prisma.outboxJob.upsert({
    where: { idempotencyKey: `gmail-disconnect:${connection.id}` },
    create: {
      userId,
      type: JobType.GMAIL_DISCONNECT,
      payload: { connectionId: connection.id },
      idempotencyKey: `gmail-disconnect:${connection.id}`,
    },
    update: {
      status: "PENDING",
      availableAt: new Date(),
    },
  });
  revalidatePath("/settings/integrations");
}
