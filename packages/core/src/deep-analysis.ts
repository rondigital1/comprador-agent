import { z } from "zod";

const boundedText = (maxLength: number) =>
  z.string().regex(new RegExp(`^[\\s\\S]{1,${maxLength}}$`));

const SourceSchema = z.object({
  title: boundedText(240),
  url: z.url(),
  sourceKind: z.enum([
    "merchant",
    "issuer",
    "publisher",
    "marketplace",
    "other",
  ]),
});

export const DiscoveredCouponSchema = z.object({
  code: boundedText(80),
  description: boundedText(240),
  status: z.enum([
    "OFFICIAL_PUBLISHED",
    "THIRD_PARTY_UNVERIFIED",
    "CONFLICTED",
    "EXPIRED",
    "CHECKOUT_VERIFICATION_REQUIRED",
  ]),
  sourceUrl: z.url().nullable(),
});

export const BestVerifiedOptionSchema = z.object({
  merchant: boundedText(160),
  title: boundedText(240),
  url: z.url(),
  totalPriceMinor: z.number().int().min(0).max(1_000_000_000).nullable(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  couponCodes: z.array(boundedText(80)).max(8),
  qualification: boundedText(320),
  sourceUrls: z.array(z.url()).max(8),
});

export const DeepDealAnalysisSchema = z.object({
  verdict: z.enum([
    "WORTH_ATTENTION",
    "CONSIDER_IF_NEEDED",
    "ROUTINE_PROMO",
    "SKIP",
    "NEEDS_VERIFICATION",
  ]),
  attentionTier: z.enum(["HIGH", "MEDIUM", "ROUTINE", "VERIFY"]),
  marketPosition: z.enum([
    "BEST_VERIFIED_AMONG_CHECKED",
    "COMPETITIVE",
    "INFERIOR",
    "INCOMPLETE",
  ]),
  summary: boundedText(800),
  bestVerifiedOption: BestVerifiedOptionSchema.nullable(),
  discoveredCoupons: z.array(DiscoveredCouponSchema).max(12),
  materialReasons: z.array(boundedText(320)).max(8),
  materialUnknowns: z.array(boundedText(320)).max(8),
  sources: z.array(SourceSchema).max(20),
});

export type DeepDealAnalysis = z.infer<typeof DeepDealAnalysisSchema>;
