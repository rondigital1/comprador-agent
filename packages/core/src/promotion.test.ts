import { describe, expect, it } from "vitest";

import {
  PromotionExtractionSchema,
  type PromotionExtraction,
} from "./promotion";
import { validatePromotionEvidence } from "./evidence";

const extraction = (overrides?: Partial<PromotionExtraction>) =>
  PromotionExtractionSchema.parse({
    isPromotion: true,
    sensitivity: "promotional",
    merchantName: "Home Store",
    headline: "Save 25% on sofas",
    summary: "A furniture promotion.",
    storeCategories: ["HOME_AND_FURNISHINGS"],
    itemCategories: ["FURNITURE"],
    categoryConfidence: "HIGH",
    couponCodes: [
      { code: "SOFA25", description: "25% off sofas" },
      { code: "SHIPFREE", description: "Free shipping" },
    ],
    discountKind: "percent",
    discountPercent: 25,
    discountAmountMinor: null,
    currency: null,
    minimumSpendMinor: null,
    startsAt: null,
    expiresAt: "2026-08-15",
    exclusions: [],
    evidence: [
      { claimPath: "merchantName", excerpt: "Home Store" },
      { claimPath: "headline", excerpt: "Save 25% on sofas" },
      { claimPath: "storeCategories", excerpt: "Home Store" },
      { claimPath: "itemCategories", excerpt: "sofas" },
      {
        claimPath: "couponCodes",
        excerpt: "Use code SOFA25 or SHIPFREE",
      },
      { claimPath: "discountPercent", excerpt: "Save 25% on sofas" },
      { claimPath: "expiresAt", excerpt: "Ends August 15, 2026" },
    ],
    ...overrides,
  });

describe("promotion extraction schema", () => {
  it("accepts ISO dates and ISO date-times with timezone", () => {
    expect(
      extraction({
        startsAt: "2026-08-01",
        expiresAt: "2026-08-15T23:59:00-04:00",
      }),
    ).toBeDefined();
  });

  it("rejects malformed dates and overlong text", () => {
    expect(() => extraction({ expiresAt: "August 15" })).toThrow();
    expect(() => extraction({ merchantName: "x".repeat(161) })).toThrow();
    expect(() =>
      extraction({
        couponCodes: [{ code: "x".repeat(81), description: null }],
      }),
    ).toThrow();
  });
});

describe("promotion evidence validation", () => {
  const source = [
    "From: Home Store <offers@example.com>",
    "Subject: Save 25% on sofas",
    "Snippet: Use code SOFA25 or SHIPFREE",
    "",
    "Save 25% on sofas. Use code SOFA25 or SHIPFREE. Ends August 15, 2026.",
  ].join("\n");

  it("keeps claims backed by exact excerpts from the model payload", () => {
    const result = validatePromotionEvidence(extraction(), source);

    expect(result.issues).toEqual([]);
    expect(result.extraction.isPromotion).toBe(true);
    expect(result.extraction.discountPercent).toBe(25);
    expect(result.extraction.couponCodes.map(({ code }) => code)).toEqual([
      "SOFA25",
      "SHIPFREE",
    ]);
  });

  it("rejects invented excerpts and clears their unsupported deal fields", () => {
    const result = validatePromotionEvidence(
      extraction({
        evidence: [
          { claimPath: "merchantName", excerpt: "Home Store" },
          { claimPath: "headline", excerpt: "Save 25% on sofas" },
          { claimPath: "storeCategories", excerpt: "Home Store" },
          { claimPath: "itemCategories", excerpt: "sofas" },
          { claimPath: "couponCodes", excerpt: "Invented code SAVE99" },
          { claimPath: "discountPercent", excerpt: "Save 25% on sofas" },
        ],
      }),
      source,
    );

    expect(result.extraction.evidence).toHaveLength(5);
    expect(result.extraction.couponCodes).toEqual([]);
    expect(result.issues).toContainEqual({
      type: "excerpt-not-found",
      claimPath: "couponCodes",
    });
    expect(result.issues).toContainEqual({
      type: "missing-claim-evidence",
      claimPath: "couponCodes",
    });
  });

  it("downgrades a promotion missing merchant or headline evidence", () => {
    const result = validatePromotionEvidence(
      extraction({
        evidence: [
          { claimPath: "headline", excerpt: "Save 25% on sofas" },
          { claimPath: "storeCategories", excerpt: "Home Store" },
          { claimPath: "itemCategories", excerpt: "sofas" },
          { claimPath: "discountPercent", excerpt: "Save 25% on sofas" },
        ],
      }),
      source,
    );

    expect(result.extraction.isPromotion).toBe(false);
    expect(result.extraction.sensitivity).toBe("unknown");
    expect(result.issues).toContainEqual({
      type: "missing-claim-evidence",
      claimPath: "merchantName",
    });
  });
});
