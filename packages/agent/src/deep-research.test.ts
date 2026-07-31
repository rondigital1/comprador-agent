import { DeepDealAnalysisSchema } from "@casero/core";
import { describe, expect, it } from "vitest";

import { groundAnalysisSources } from "./deep-research";

describe("groundAnalysisSources", () => {
  it("removes unsupported best options and downgrades ungrounded coupons", () => {
    const analysis = DeepDealAnalysisSchema.parse({
      verdict: "WORTH_ATTENTION",
      attentionTier: "HIGH",
      marketPosition: "BEST_VERIFIED_AMONG_CHECKED",
      summary: "A strong public promotion.",
      bestVerifiedOption: {
        merchant: "Example",
        title: "Annual plan",
        url: "https://invented.example/plan",
        totalPriceMinor: 5000,
        currency: "USD",
        couponCodes: [],
        qualification: "New customers",
        sourceUrls: ["https://invented.example/plan"],
      },
      discoveredCoupons: [
        {
          code: "PUBLIC20",
          description: "20% off",
          status: "OFFICIAL_PUBLISHED",
          sourceUrl: "https://invented.example/coupon",
        },
      ],
      materialReasons: ["Public promotion"],
      materialUnknowns: [],
      sources: [
        {
          title: "Invented",
          url: "https://invented.example/plan",
          sourceKind: "merchant",
        },
      ],
    });

    const grounded = groundAnalysisSources(analysis, [
      { title: "Official", url: "https://official.example/promo" },
    ]);

    expect(grounded.bestVerifiedOption).toBeNull();
    expect(grounded.sources).toEqual([]);
    expect(grounded.discoveredCoupons[0]).toMatchObject({
      sourceUrl: null,
      status: "CHECKOUT_VERIFICATION_REQUIRED",
    });
  });
});
