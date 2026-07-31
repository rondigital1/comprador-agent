import { prisma } from "@casero/database";
import { cache } from "react";

export const getDealDetail = cache(async (userId: string, offerId: string) => {
  const offer = await prisma.offer.findFirst({
    where: { id: offerId, userId },
    include: {
      coupons: { orderBy: { createdAt: "asc" } },
      evidence: { orderBy: { createdAt: "asc" } },
      gmailMessage: {
        include: {
          images: { orderBy: { position: "asc" }, take: 8 },
        },
      },
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!offer) return null;

  const history = await prisma.offer.findMany({
    where: {
      userId,
      id: { not: offer.id },
      merchantName: { equals: offer.merchantName, mode: "insensitive" },
    },
    select: {
      id: true,
      headline: true,
      discountPercent: true,
      strength: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { offer, history, latestAnalysis: offer.analyses[0] ?? null };
});
