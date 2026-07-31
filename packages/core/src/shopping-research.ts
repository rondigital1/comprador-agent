import { z } from "zod";

const boundedText = (maxLength: number) =>
  z.string().regex(new RegExp(`^[\\s\\S]{1,${maxLength}}$`));

export const ShoppingDealCandidateSchema = z.object({
  merchantName: boundedText(160),
  title: boundedText(240),
  priceMinor: z.number().int().min(0).max(1_000_000_000),
  listPriceMinor: z.number().int().min(0).max(1_000_000_000).nullable(),
  shippingCostMinor: z.number().int().min(0).max(100_000_000).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  url: z.url(),
  sourceTitle: boundedText(240),
  membershipRequired: z.boolean(),
  membershipProgram: boundedText(120).nullable(),
  availability: z.enum(["IN_STOCK", "LIMITED", "UNKNOWN"]),
  matchQuality: z.enum(["EXACT", "CLOSE", "ALTERNATIVE"]),
  score: z.number().int().min(0).max(100),
  rationale: boundedText(320),
});

export const ShoppingResearchResultSchema = z.object({
  summary: boundedText(600),
  deals: z.array(ShoppingDealCandidateSchema).max(8),
});

export type ShoppingResearchResult = z.infer<
  typeof ShoppingResearchResultSchema
>;
