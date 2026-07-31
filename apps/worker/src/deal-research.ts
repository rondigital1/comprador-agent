import { researchDeal } from "@casero/agent";
import { prisma, type Prisma } from "@casero/database";
import { DealAnalysisStatus } from "@casero/database/generated";

import { workerEnv } from "./env";

export async function runDealResearch(analysisId: string) {
  const analysis = await prisma.dealAnalysis.findUnique({
    where: { id: analysisId },
    include: {
      offer: {
        include: { coupons: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!analysis) throw new Error(`Deal analysis ${analysisId} was not found`);

  await prisma.dealAnalysis.update({
    where: { id: analysisId },
    data: {
      status: DealAnalysisStatus.RUNNING,
      startedAt: new Date(),
      error: null,
    },
  });

  try {
    const history = await prisma.offer.findMany({
      where: {
        userId: analysis.offer.userId,
        merchantName: {
          equals: analysis.offer.merchantName,
          mode: "insensitive",
        },
        id: { not: analysis.offer.id },
      },
      select: {
        headline: true,
        discountPercent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const result = await researchDeal({
      apiKey: workerEnv.openAiApiKey,
      snapshot: {
        offer: {
          merchantName: analysis.offer.merchantName,
          headline: analysis.offer.headline,
          summary: analysis.offer.summary,
          storeCategories: analysis.offer.storeCategories,
          itemCategories: analysis.offer.itemCategories,
          couponCodes: analysis.offer.coupons.map(({ code }) => code),
          discountPercent: analysis.offer.discountPercent?.toNumber() ?? null,
          discountAmountMinor: analysis.offer.discountAmountMinor,
          currency: analysis.offer.currency,
          minimumSpendMinor: analysis.offer.minimumSpendMinor,
          startsAt: analysis.offer.startsAt?.toISOString() ?? null,
          expiresAt: analysis.offer.expiresAt?.toISOString() ?? null,
          exclusions: analysis.offer.exclusions,
        },
        emailHistory: history.map((offer) => ({
          headline: offer.headline,
          discountPercent: offer.discountPercent?.toNumber() ?? null,
          observedAt: offer.createdAt.toISOString(),
        })),
      },
    });

    await prisma.dealAnalysis.update({
      where: { id: analysisId },
      data: {
        status: DealAnalysisStatus.COMPLETED,
        model: result.model,
        result: result.analysis as unknown as Prisma.InputJsonValue,
        sources: result.webSources as unknown as Prisma.InputJsonValue,
        asOf: new Date(),
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.dealAnalysis.update({
      where: { id: analysisId },
      data: {
        status: DealAnalysisStatus.FAILED,
        error:
          error instanceof Error
            ? error.message.slice(0, 1_000)
            : String(error).slice(0, 1_000),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
