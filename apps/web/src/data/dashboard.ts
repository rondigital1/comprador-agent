import { prisma } from "@casero/database";

export async function getDashboardSnapshot(userId: string) {
  const [connection, offers, pendingJobs] = await Promise.all([
    prisma.gmailConnection.findUnique({
      where: { userId },
      select: {
        emailAddress: true,
        status: true,
        lastSyncAt: true,
        lastError: true,
        backfillQuery: true,
        watchExpiration: true,
      },
    }),
    prisma.offer.findMany({
      where: { userId, status: { in: ["ACTIVE", "SAVED"] } },
      select: {
        id: true,
        merchantName: true,
        headline: true,
        summary: true,
        storeCategories: true,
        itemCategories: true,
        categoryConfidence: true,
        coupons: {
          select: { code: true, description: true },
          orderBy: { createdAt: "asc" },
        },
        discountKind: true,
        discountPercent: true,
        discountAmountMinor: true,
        currency: true,
        expiresAt: true,
        strength: true,
        purchaseFit: true,
        comparableCount: true,
        score: true,
        explanation: true,
        gmailMessage: {
          select: {
            images: {
              select: { id: true },
              orderBy: [{ isLikelyLogo: "desc" }, { position: "asc" }],
              take: 1,
            },
          },
        },
        evidence: {
          select: {
            claimPath: true,
            redactedExcerpt: true,
          },
          take: 3,
        },
      },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.outboxJob.count({
      where: {
        userId,
        status: { in: ["PENDING", "PROCESSING", "RETRY"] },
      },
    }),
  ]);

  return { connection, offers, pendingJobs };
}
