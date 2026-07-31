import { describe, expect, it } from "vitest";

import { activeDealFilterCount, parseDealFilters } from "./deal-filters";

describe("deal filter parsing", () => {
  it("keeps multiple valid categories and independent offer factors", () => {
    const filters = parseDealFilters({
      store: ["HOME_AND_FURNISHINGS", "DEPARTMENT_STORE"],
      item: ["FURNITURE", "HOME_DECOR"],
      strength: ["BEST_OBSERVED", "STRONG"],
      kind: "percent",
      timing: "ENDING_SOON",
      coupon: "WITH_CODE",
      score: "70",
    });

    expect(filters.stores).toEqual([
      "HOME_AND_FURNISHINGS",
      "DEPARTMENT_STORE",
    ]);
    expect(filters.items).toEqual(["FURNITURE", "HOME_DECOR"]);
    expect(activeDealFilterCount(filters)).toBe(10);
  });

  it("drops unknown URL values instead of forwarding them to Prisma", () => {
    expect(
      parseDealFilters({
        store: "NOT_A_CATEGORY",
        timing: "someday",
        score: "999",
      }),
    ).toMatchObject({ stores: [], timing: null, minScore: 0 });
  });
});
