import { z } from "zod";

export const ConnectionJobPayload = z.object({
  connectionId: z.string().min(1),
});

export const MessageJobPayload = ConnectionJobPayload.extend({
  gmailMessageId: z.string().min(1),
});

export const DealResearchJobPayload = z.object({
  analysisId: z.string().min(1),
});

export const ShoppingResearchJobPayload = z.object({
  intentId: z.string().min(1),
});
