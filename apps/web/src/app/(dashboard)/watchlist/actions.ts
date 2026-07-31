"use server";

import { prisma, type Prisma } from "@casero/database";
import { JobType } from "@casero/database/generated";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/session";

export type AddItemState = {
  status: "idle" | "error" | "success";
  message: string;
  errors?: { query?: string[]; maxPrice?: string[] };
};

const itemSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Describe the item in a little more detail.")
    .max(240),
  maxPrice: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{1,7}(\.\d{1,2})?$/.test(value),
      "Enter a valid dollar amount.",
    ),
});

const enqueueResearch = async (
  tx: Prisma.TransactionClient,
  input: { intentId: string; userId: string; reason: string },
) => {
  await tx.outboxJob.create({
    data: {
      userId: input.userId,
      type: JobType.SHOPPING_INTENT_RESEARCH,
      payload: { intentId: input.intentId },
      idempotencyKey: `shopping-${input.reason}:${input.intentId}:${Date.now()}`,
      maxAttempts: 3,
    },
  });
};

export async function addShoppingItem(
  _previousState: AddItemState,
  formData: FormData,
): Promise<AddItemState> {
  const userId = await requireUserId();
  const parsed = itemSchema.safeParse({
    query: formData.get("query"),
    maxPrice: formData.get("maxPrice") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the item details and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.shoppingIntent.findFirst({
    where: {
      userId,
      active: true,
      query: { equals: parsed.data.query, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (existing) {
    return { status: "error", message: "That item is already on your list." };
  }

  await prisma.$transaction(async (tx) => {
    const intent = await tx.shoppingIntent.create({
      data: {
        userId,
        name: parsed.data.query,
        query: parsed.data.query,
        maxPriceMinor: parsed.data.maxPrice
          ? Math.round(Number(parsed.data.maxPrice) * 100)
          : null,
        currency: "USD",
        researchStatus: "PENDING",
      },
      select: { id: true },
    });
    await enqueueResearch(tx, {
      intentId: intent.id,
      userId,
      reason: "initial",
    });
  });
  revalidatePath("/watchlist");
  return {
    status: "success",
    message: `Research started for ${parsed.data.query}.`,
  };
}

export async function setShoppingWatch(intentId: string, enabled: boolean) {
  const userId = await requireUserId();
  const intent = await prisma.shoppingIntent.findFirst({
    where: { id: intentId, userId, active: true },
  });
  if (!intent) throw new Error("Shopping item not found");

  await prisma.$transaction(async (tx) => {
    const needsResearch =
      enabled && ["IDLE", "FAILED"].includes(intent.researchStatus);
    await tx.shoppingIntent.update({
      where: { id: intent.id },
      data: {
        watchEnabled: enabled,
        researchStatus: needsResearch ? "PENDING" : intent.researchStatus,
        nextCheckAt: enabled
          ? needsResearch
            ? null
            : new Date(
                (intent.lastResearchedAt?.getTime() ?? Date.now()) +
                  24 * 60 * 60 * 1_000,
              )
          : null,
      },
    });
    if (needsResearch) {
      await enqueueResearch(tx, { intentId, userId, reason: "watch" });
    }
  });
  revalidatePath("/watchlist");
}

export async function refreshShoppingItem(intentId: string) {
  const userId = await requireUserId();
  const intent = await prisma.shoppingIntent.findFirst({
    where: { id: intentId, userId, active: true },
  });
  if (!intent || ["PENDING", "RUNNING"].includes(intent.researchStatus)) return;

  await prisma.$transaction(async (tx) => {
    await tx.shoppingIntent.update({
      where: { id: intentId },
      data: { researchStatus: "PENDING", lastError: null },
    });
    await enqueueResearch(tx, { intentId, userId, reason: "manual" });
  });
  revalidatePath("/watchlist");
}

export async function archiveShoppingItem(intentId: string) {
  const userId = await requireUserId();
  await prisma.shoppingIntent.updateMany({
    where: { id: intentId, userId, active: true },
    data: { active: false, watchEnabled: false, nextCheckAt: null },
  });
  revalidatePath("/watchlist");
}
