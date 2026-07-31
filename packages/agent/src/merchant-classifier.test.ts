import { describe, expect, it } from "vitest";

import {
  groundMerchantClassification,
  type MerchantClassification,
} from "./merchant-classifier";

const classification: MerchantClassification = {
  storeCategories: ["HOME_AND_FURNISHINGS", "OTHER"],
  confidence: "HIGH",
  rationale: "The official site sells furniture and home goods.",
  sourceUrl: "https://example.com/about",
};

describe("groundMerchantClassification", () => {
  it("keeps only classifications backed by an observed source", () => {
    expect(
      groundMerchantClassification(classification, [
        { title: "Example", url: "https://example.com/about" },
      ]),
    ).toMatchObject({ storeCategories: ["HOME_AND_FURNISHINGS"] });
  });

  it("rejects an invented source URL", () => {
    expect(
      groundMerchantClassification(classification, [
        { title: "Different", url: "https://different.example/store" },
      ]),
    ).toBeNull();
  });
});
