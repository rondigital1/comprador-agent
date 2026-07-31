import { researchShoppingIntent } from "@casero/agent";
import { prisma } from "@casero/database";
import { ShoppingResearchStatus } from "@casero/database/generated";

import { workerEnv } from "./env";

const nextDailyCheck = () => new Date(Date.now() + 24 * 60 * 60 * 1_000);

export async function runShoppingResearch(intentId: string) {
  const intent = await prisma.shoppingIntent.findUnique({
    where: { id: intentId },
  });
  if (!intent || !intent.active) return;

  await prisma.shoppingIntent.update({
    where: { id: intentId },
    data: {
      researchStatus: ShoppingResearchStatus.RUNNING,
      lastError: null,
    },
  });

  try {
    const research = await researchShoppingIntent({
      apiKey: workerEnv.openAiApiKey,
      item: {
        name: intent.name,
        query: intent.query,
        category: intent.category,
        maxPriceMinor: intent.maxPriceMinor,
        currency: intent.currency,
      },
    });
    const observedAt = new Date();

    await prisma.$transaction(async (tx) => {
      const currentIntent = await tx.shoppingIntent.findUnique({
        where: { id: intentId },
        select: { watchEnabled: true },
      });
      await tx.shoppingDeal.updateMany({
        where: { intentId },
        data: { active: false },
      });
      for (const deal of research.result.deals) {
        await tx.shoppingDeal.upsert({
          where: { intentId_url: { intentId, url: deal.url } },
          create: { ...deal, intentId, observedAt },
          update: { ...deal, active: true, observedAt },
        });
      }
      await tx.shoppingIntent.update({
        where: { id: intentId },
        data: {
          researchStatus: ShoppingResearchStatus.COMPLETED,
          researchSummary: research.result.summary,
          lastResearchedAt: observedAt,
          nextCheckAt: currentIntent?.watchEnabled ? nextDailyCheck() : null,
          lastError: null,
        },
      });
    });
  } catch (error) {
    const currentIntent = await prisma.shoppingIntent.findUnique({
      where: { id: intentId },
      select: { watchEnabled: true },
    });
    await prisma.shoppingIntent.update({
      where: { id: intentId },
      data: {
        researchStatus: ShoppingResearchStatus.FAILED,
        nextCheckAt: currentIntent?.watchEnabled ? nextDailyCheck() : null,
        lastError:
          error instanceof Error
            ? error.message.slice(0, 1_000)
            : String(error).slice(0, 1_000),
      },
    });
    throw error;
  }
}
