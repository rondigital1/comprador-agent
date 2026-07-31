import { describe, expect, it } from "vitest";

import type { PromotionExtraction } from "./promotion";
import { evaluatePromotion } from "./scoring";
import { classifyMessageLocally } from "./sensitive-filter";

const promotion: PromotionExtraction = {
  isPromotion: true,
  sensitivity: "promotional",
  merchantName: "Example Home",
  headline: "30% off dining tables",
  summary: "Save on dining room furniture.",
  promoCode: "TABLE30",
  discountKind: "percent",
  discountPercent: 30,
  discountAmountMinor: null,
  currency: "USD",
  minimumSpendMinor: null,
  startsAt: null,
  expiresAt: null,
  exclusions: [],
  evidence: [],
};

describe("evaluatePromotion", () => {
  it("uses bounded wording when history is too small", () => {
    const result = evaluatePromotion({
      extraction: promotion,
      comparableDiscounts: [10, 15, 20, 25],
      intents: [],
    });

    expect(result.strength).toBe("INSUFFICIENT_HISTORY");
    expect(result.explanation).toContain("Not enough comparable history");
  });

  it("matches a relevant active intent", () => {
    const result = evaluatePromotion({
      extraction: promotion,
      comparableDiscounts: [10, 15, 20, 25, 25],
      intents: [{ id: "intent-1", name: "Dining table", query: "oak table" }],
    });

    expect(result.strength).toBe("BEST_OBSERVED");
    expect(result.purchaseFit).toBe("HIGH");
    expect(result.matchedIntentId).toBe("intent-1");
  });
});

describe("classifyMessageLocally", () => {
  it("blocks transactional mail before a model call", () => {
    const result = classifyMessageLocally({
      sender: "store@example.com",
      subject: "Your order confirmation",
      snippet: "Thanks for your order",
      bodyText: "Order number 123",
    });

    expect(result).toEqual({
      allowModel: false,
      category: "transactional",
    });
  });
});
