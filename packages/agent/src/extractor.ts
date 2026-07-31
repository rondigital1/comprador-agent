import type { PromotionExtraction } from "@comprador/core";

export type PromotionMessageInput = {
  sender: string;
  subject: string;
  snippet: string;
  bodyText: string;
};

export type ExtractionResult = {
  extraction: PromotionExtraction;
  model: string;
};

export interface PromotionExtractor {
  extract(message: PromotionMessageInput): Promise<ExtractionResult>;
}
