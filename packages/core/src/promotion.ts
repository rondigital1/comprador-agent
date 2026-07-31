import { z } from "zod";

export const PROMOTION_SCHEMA_VERSION = "promotion-v1";

export const EvidenceClaimSchema = z.object({
  claimPath: z.string().min(1),
  excerpt: z.string().min(1).max(280),
});

export const PromotionExtractionSchema = z.object({
  isPromotion: z.boolean(),
  sensitivity: z.enum(["promotional", "transactional", "security", "unknown"]),
  merchantName: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  promoCode: z.string().nullable(),
  discountKind: z.enum([
    "percent",
    "amount",
    "shipping",
    "points",
    "bundle",
    "other",
  ]),
  discountPercent: z.number().min(0).max(100).nullable(),
  discountAmountMinor: z.number().int().nonnegative().nullable(),
  currency: z.string().length(3).nullable(),
  minimumSpendMinor: z.number().int().nonnegative().nullable(),
  startsAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  exclusions: z.array(z.string().max(240)).max(20),
  evidence: z.array(EvidenceClaimSchema).max(20),
});

export type PromotionExtraction = z.infer<typeof PromotionExtractionSchema>;

export type ShoppingIntentInput = {
  id: string;
  name: string;
  query: string;
};

export type PromotionEvaluation = {
  score: number;
  strength: "INSUFFICIENT_HISTORY" | "ROUTINE" | "STRONG" | "BEST_OBSERVED";
  purchaseFit: "NO_ACTIVE_INTENT" | "LOW" | "MEDIUM" | "HIGH";
  comparableCount: number;
  matchedIntentId: string | null;
  explanation: string;
};
