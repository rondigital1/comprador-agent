import {
  PromotionExtractionSchema,
  type PromotionExtraction,
} from "./promotion";

export type EvidenceValidationIssue = {
  type: "excerpt-not-found" | "missing-claim-evidence";
  claimPath: string;
};

export type EvidenceValidationResult = {
  extraction: PromotionExtraction;
  issues: EvidenceValidationIssue[];
};

const hasClaim = (claimPaths: Set<string>, claimPath: string) =>
  claimPaths.has(claimPath);

const normalizedIncludes = (value: string, search: string) =>
  value.toLocaleLowerCase().includes(search.toLocaleLowerCase());

export function validatePromotionEvidence(
  extraction: PromotionExtraction,
  modelPayload: string,
): EvidenceValidationResult {
  const issues: EvidenceValidationIssue[] = [];
  const evidence = extraction.evidence.filter((claim) => {
    const found = modelPayload.includes(claim.excerpt);
    if (!found) {
      issues.push({
        type: "excerpt-not-found",
        claimPath: claim.claimPath,
      });
    }
    return found;
  });
  const claimPaths = new Set(evidence.map((claim) => claim.claimPath));
  const requireClaim = (claimPath: string, populated: boolean) => {
    if (populated && !hasClaim(claimPaths, claimPath)) {
      issues.push({ type: "missing-claim-evidence", claimPath });
      return false;
    }
    return populated;
  };

  const merchantGrounded = requireClaim("merchantName", extraction.isPromotion);
  const headlineGrounded = requireClaim("headline", extraction.isPromotion);
  const storeCategoriesGrounded = requireClaim(
    "storeCategories",
    extraction.storeCategories.length > 0,
  );
  const itemCategoriesGrounded = requireClaim(
    "itemCategories",
    extraction.itemCategories.length > 0,
  );
  const couponEvidence = evidence.filter(
    (claim) => claim.claimPath === "couponCodes",
  );
  const groundedCouponCodes = extraction.couponCodes.filter((coupon) =>
    couponEvidence.some((claim) =>
      normalizedIncludes(claim.excerpt, coupon.code),
    ),
  );
  if (groundedCouponCodes.length !== extraction.couponCodes.length) {
    issues.push({ type: "missing-claim-evidence", claimPath: "couponCodes" });
  }
  const percentGrounded = requireClaim(
    "discountPercent",
    extraction.discountPercent !== null,
  );
  const amountGrounded = requireClaim(
    "discountAmountMinor",
    extraction.discountAmountMinor !== null,
  );
  const currencyGrounded = requireClaim(
    "currency",
    extraction.currency !== null,
  );
  const minimumGrounded = requireClaim(
    "minimumSpendMinor",
    extraction.minimumSpendMinor !== null,
  );
  const startsGrounded = requireClaim("startsAt", extraction.startsAt !== null);
  const expiresGrounded = requireClaim(
    "expiresAt",
    extraction.expiresAt !== null,
  );
  const exclusionsGrounded = requireClaim(
    "exclusions",
    extraction.exclusions.length > 0,
  );
  const kindNeedsDirectEvidence = ["shipping", "points", "bundle"].includes(
    extraction.discountKind,
  );
  const kindGrounded = requireClaim("discountKind", kindNeedsDirectEvidence);
  const promotionGrounded =
    !extraction.isPromotion || (merchantGrounded && headlineGrounded);

  const grounded = {
    ...extraction,
    isPromotion: promotionGrounded ? extraction.isPromotion : false,
    sensitivity: promotionGrounded ? extraction.sensitivity : "unknown",
    storeCategories: storeCategoriesGrounded ? extraction.storeCategories : [],
    itemCategories: itemCategoriesGrounded ? extraction.itemCategories : [],
    categoryConfidence:
      storeCategoriesGrounded || itemCategoriesGrounded
        ? extraction.categoryConfidence
        : "LOW",
    couponCodes: groundedCouponCodes,
    discountKind:
      (extraction.discountKind === "percent" && percentGrounded) ||
      (extraction.discountKind === "amount" && amountGrounded) ||
      (kindNeedsDirectEvidence && kindGrounded) ||
      extraction.discountKind === "other"
        ? extraction.discountKind
        : "other",
    discountPercent: percentGrounded ? extraction.discountPercent : null,
    discountAmountMinor: amountGrounded ? extraction.discountAmountMinor : null,
    currency: currencyGrounded ? extraction.currency : null,
    minimumSpendMinor: minimumGrounded ? extraction.minimumSpendMinor : null,
    startsAt: startsGrounded ? extraction.startsAt : null,
    expiresAt: expiresGrounded ? extraction.expiresAt : null,
    exclusions: exclusionsGrounded ? extraction.exclusions : [],
    evidence,
  };

  return {
    extraction: PromotionExtractionSchema.parse(grounded),
    issues,
  };
}
