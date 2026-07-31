import { classifyMerchant } from "@casero/agent";
import {
  CategoryConfidenceSchema,
  removeOtherWhenSpecific,
  type CategoryConfidence,
  type ItemCategory,
  type PromotionExtraction,
  type StoreCategory,
} from "@casero/core";
import { prisma } from "@casero/database";

import { workerEnv } from "./env";

const CONFIDENCE_RANK: Record<CategoryConfidence, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

const strongerConfidence = (
  first: CategoryConfidence,
  second: CategoryConfidence,
) => (CONFIDENCE_RANK[first] >= CONFIDENCE_RANK[second] ? first : second);

const senderDomain = (sender: string) => {
  const match = sender.match(/@([^>\s]+)>?\s*$/);
  return match?.[1]?.toLocaleLowerCase().replace(/[.,;]+$/, "") ?? null;
};

const cleanStores = (values: StoreCategory[]) =>
  removeOtherWhenSpecific(values, "OTHER");

const cleanItems = (values: ItemCategory[]) =>
  removeOtherWhenSpecific(values, "OTHER");

export type ResolvedOfferCategories = {
  storeCategories: StoreCategory[];
  itemCategories: ItemCategory[];
  categoryConfidence: CategoryConfidence;
  categorySourceKind: "EMAIL" | "MERCHANT_SEARCH" | "MERCHANT_HISTORY";
  categorySourceUrl: string | null;
  categoryRationale: string | null;
  categoryModel: string | null;
};

export async function resolveOfferCategories(input: {
  userId: string;
  sender: string;
  extraction: PromotionExtraction;
}): Promise<ResolvedOfferCategories> {
  const emailStores = cleanStores(input.extraction.storeCategories);
  const itemCategories = cleanItems(input.extraction.itemCategories);
  const previous = await prisma.offer.findFirst({
    where: {
      userId: input.userId,
      merchantName: {
        equals: input.extraction.merchantName,
        mode: "insensitive",
      },
      storeCategories: { isEmpty: false },
      categorySourceUrl: { not: null },
    },
    select: {
      storeCategories: true,
      categoryConfidence: true,
      categorySourceUrl: true,
      categoryRationale: true,
      categoryModel: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (previous?.categorySourceUrl) {
    const confidence = CategoryConfidenceSchema.catch("MEDIUM").parse(
      previous.categoryConfidence,
    );
    return {
      storeCategories: cleanStores([
        ...emailStores,
        ...(previous.storeCategories as StoreCategory[]),
      ]),
      itemCategories,
      categoryConfidence: strongerConfidence(
        input.extraction.categoryConfidence,
        confidence,
      ),
      categorySourceKind: "MERCHANT_HISTORY",
      categorySourceUrl: previous.categorySourceUrl,
      categoryRationale: previous.categoryRationale,
      categoryModel: previous.categoryModel,
    };
  }

  try {
    const researched = await classifyMerchant({
      apiKey: workerEnv.openAiApiKey,
      merchantName: input.extraction.merchantName,
      senderDomain: senderDomain(input.sender),
    });
    if (researched.classification) {
      return {
        storeCategories: cleanStores([
          ...emailStores,
          ...researched.classification.storeCategories,
        ]),
        itemCategories,
        categoryConfidence: strongerConfidence(
          input.extraction.categoryConfidence,
          researched.classification.confidence,
        ),
        categorySourceKind: "MERCHANT_SEARCH",
        categorySourceUrl: researched.classification.sourceUrl,
        categoryRationale: researched.classification.rationale,
        categoryModel: researched.model,
      };
    }
  } catch (error) {
    console.warn("Merchant category lookup failed", {
      merchantName: input.extraction.merchantName,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    storeCategories: emailStores,
    itemCategories,
    categoryConfidence: input.extraction.categoryConfidence,
    categorySourceKind: "EMAIL",
    categorySourceUrl: null,
    categoryRationale: null,
    categoryModel: null,
  };
}
