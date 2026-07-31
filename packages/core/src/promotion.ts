import { z } from "zod";

import {
  CategoryConfidenceSchema,
  ItemCategorySchema,
  StoreCategorySchema,
} from "./deal-taxonomy";

export const PROMOTION_SCHEMA_VERSION = "promotion-v4";

const boundedText = (maxLength: number) =>
  z.string().regex(new RegExp(`^[\\s\\S]{1,${maxLength}}$`));

const OptionalOfferDateSchema = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })])
  .nullable();

export const EvidenceClaimPathSchema = z.enum([
  "merchantName",
  "headline",
  "storeCategories",
  "itemCategories",
  "couponCodes",
  "discountKind",
  "discountPercent",
  "discountAmountMinor",
  "currency",
  "minimumSpendMinor",
  "startsAt",
  "expiresAt",
  "exclusions",
]);

export const CouponCodeSchema = z.object({
  code: boundedText(80),
  description: boundedText(240).nullable(),
});

export const EvidenceClaimSchema = z.object({
  claimPath: EvidenceClaimPathSchema,
  excerpt: boundedText(280),
});

export const PromotionExtractionSchema = z.object({
  isPromotion: z.boolean(),
  sensitivity: z.enum(["promotional", "transactional", "security", "unknown"]),
  merchantName: boundedText(160),
  headline: boundedText(240),
  summary: boundedText(600),
  storeCategories: z.array(StoreCategorySchema).max(4),
  itemCategories: z.array(ItemCategorySchema).max(8),
  categoryConfidence: CategoryConfidenceSchema,
  couponCodes: z.array(CouponCodeSchema).max(8),
  discountKind: z.enum([
    "percent",
    "amount",
    "shipping",
    "points",
    "bundle",
    "other",
  ]),
  discountPercent: z.number().min(0).max(100).nullable(),
  discountAmountMinor: z.number().int().min(0).max(1_000_000_000).nullable(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  minimumSpendMinor: z.number().int().min(0).max(1_000_000_000).nullable(),
  startsAt: OptionalOfferDateSchema,
  expiresAt: OptionalOfferDateSchema,
  exclusions: z.array(boundedText(240)).max(12),
  evidence: z.array(EvidenceClaimSchema).max(16),
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
