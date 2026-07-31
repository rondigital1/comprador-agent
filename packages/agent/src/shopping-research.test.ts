import { describe, expect, it } from "vitest";

import { groundShoppingResearch } from "./shopping-research";

const deal = {
  merchantName: "Example",
  title: "Example product",
  priceMinor: 10_000,
  listPriceMinor: null,
  shippingCostMinor: null,
  currency: "USD",
  url: "https://example.com/product",
  sourceTitle: "Example product",
  membershipRequired: false,
  membershipProgram: null,
  availability: "IN_STOCK" as const,
  matchQuality: "EXACT" as const,
  score: 80,
  rationale: "A current exact match.",
};

describe("groundShoppingResearch", () => {
  it("removes unobserved URLs and keeps public prices above member prices", () => {
    const result = groundShoppingResearch(
      {
        summary: "Two verified options were found.",
        deals: [
          {
            ...deal,
            url: "https://club.example.com/product",
            membershipRequired: true,
            membershipProgram: "Club Plus",
            score: 95,
          },
          deal,
          { ...deal, url: "https://unobserved.example/product", score: 99 },
        ],
      },
      [
        { url: "https://example.com/product" },
        { url: "https://club.example.com/product" },
      ],
    );

    expect(result.deals.map(({ url }) => url)).toEqual([
      "https://example.com/product",
      "https://club.example.com/product",
    ]);
  });
});
