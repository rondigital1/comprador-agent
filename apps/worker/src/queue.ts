import { randomUUID } from "node:crypto";

import { prisma, type Prisma } from "@comprador/database";
import {
  JobStatus,
  JobType,
  type OutboxJob,
} from "@comprador/database/generated";

const CLAIMABLE_STATUSES: JobStatus[] = [JobStatus.PENDING, JobStatus.RETRY];

export async function enqueueJob(input: {
  userId: string;
  type: JobType;
  payload: Prisma.InputJsonValue;
  idempotencyKey: string;
  availableAt?: Date;
}) {
  return prisma.outboxJob.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      ...input,
      availableAt: input.availableAt ?? new Date(),
    },
    update: {},
  });
}

export async function claimNextJob(
  leaseOwner: string,
): Promise<OutboxJob | null> {
  const now = new Date();
  const candidate = await prisma.outboxJob.findFirst({
    where: {
      availableAt: { lte: now },
      OR: [
        { status: { in: CLAIMABLE_STATUSES } },
        {
          status: JobStatus.PROCESSING,
          leaseExpiresAt: { lt: now },
        },
      ],
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
  });

  if (!candidate) {
    return null;
  }

  const leaseToken = randomUUID();
  const claimed = await prisma.outboxJob.updateMany({
    where: {
      id: candidate.id,
      OR: [
        { status: { in: CLAIMABLE_STATUSES } },
        {
          status: JobStatus.PROCESSING,
          leaseExpiresAt: { lt: now },
        },
      ],
    },
    data: {
      status: JobStatus.PROCESSING,
      attempts: { increment: 1 },
      leaseOwner,
      leaseToken,
      leaseExpiresAt: new Date(now.getTime() + 60_000),
    },
  });

  if (claimed.count === 0) {
    return null;
  }

  return prisma.outboxJob.findUnique({ where: { id: candidate.id } });
}

export async function completeJob(job: OutboxJob): Promise<void> {
  const completed = await prisma.outboxJob.updateMany({
    where: {
      id: job.id,
      status: JobStatus.PROCESSING,
      leaseToken: job.leaseToken,
    },
    data: {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      leaseOwner: null,
      leaseToken: null,
      leaseExpiresAt: null,
      lastError: null,
    },
  });

  if (completed.count !== 1) {
    throw new Error(`Lost lease while completing job ${job.id}`);
  }
}

export async function failJob(job: OutboxJob, error: unknown): Promise<void> {
  const terminal = job.attempts >= job.maxAttempts;
  const backoffMs = Math.min(
    60_000,
    1_000 * 2 ** Math.max(0, job.attempts - 1),
  );
  const jitterMs = Math.floor(Math.random() * 500);

  await prisma.outboxJob.updateMany({
    where: {
      id: job.id,
      status: JobStatus.PROCESSING,
      leaseToken: job.leaseToken,
    },
    data: {
      status: terminal ? JobStatus.DEAD : JobStatus.RETRY,
      availableAt: new Date(Date.now() + backoffMs + jitterMs),
      leaseOwner: null,
      leaseToken: null,
      leaseExpiresAt: null,
      lastError:
        error instanceof Error ? error.message.slice(0, 1_000) : String(error),
    },
  });
}

export { JobStatus, JobType };
