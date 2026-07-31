import type { PromotionExtraction } from "@comprador/core";
import { describe, expect, it } from "vitest";

import { evaluateDeal } from "./deal-graph";
import type { PromotionExtractor } from "./extractor";

const extraction: PromotionExtraction = {
  isPromotion: true,
  sensitivity: "promotional",
  merchantName: "Home Store",
  headline: "25% off sofas",
  summary: "A furniture promotion.",
  promoCode: null,
  discountKind: "percent",
  discountPercent: 25,
  discountAmountMinor: null,
  currency: "USD",
  minimumSpendMinor: null,
  startsAt: null,
  expiresAt: null,
  exclusions: [],
  evidence: [],
};

describe("deal evaluation graph", () => {
  it("runs extraction before deterministic evaluation", async () => {
    const extractor: PromotionExtractor = {
      extract: async () => ({ extraction, model: "test-model" }),
    };

    const result = await evaluateDeal(extractor, {
      message: {
        sender: "deals@example.com",
        subject: "Sofa sale",
        snippet: "25% off",
        bodyText: "Save 25% on sofas.",
      },
      comparableDiscounts: [10, 15, 20, 20, 20],
      intents: [{ id: "sofa", name: "Sofa", query: "living room sofa" }],
    });

    expect(result.model).toBe("test-model");
    expect(result.evaluation?.strength).toBe("BEST_OBSERVED");
    expect(result.evaluation?.purchaseFit).toBe("HIGH");
  });
});
