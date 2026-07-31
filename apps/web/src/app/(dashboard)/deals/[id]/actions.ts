"use server";

import { prisma } from "@casero/database";
import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";

export async function queueDeepAnalysis(offerId: string) {
  const userId = await requireUserId();
  const offer = await prisma.offer.findFirst({
    where: { id: offerId, userId },
    select: { id: true },
  });
  if (!offer) throw new Error("Deal not found");

  const active = await prisma.dealAnalysis.findFirst({
    where: { offerId, status: { in: ["PENDING", "RUNNING"] } },
    select: { id: true },
  });
  if (!active) {
    await prisma.$transaction(async (tx) => {
      const analysis = await tx.dealAnalysis.create({
        data: { offerId },
        select: { id: true },
      });
      await tx.outboxJob.create({
        data: {
          userId,
          type: "DEAL_DEEP_ANALYSIS",
          payload: { analysisId: analysis.id },
          idempotencyKey: `deal-analysis:${analysis.id}`,
          maxAttempts: 3,
        },
      });
    });
  }
  revalidatePath(`/deals/${offerId}`);
}
