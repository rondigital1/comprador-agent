import {
  ITEM_CATEGORIES,
  ItemCategorySchema,
  STORE_CATEGORIES,
  StoreCategorySchema,
  type ItemCategory,
  type StoreCategory,
} from "@casero/core";
import { prisma, type Prisma } from "@casero/database";

export const DEAL_STRENGTHS = [
  "BEST_OBSERVED",
  "STRONG",
  "ROUTINE",
  "INSUFFICIENT_HISTORY",
] as const;

export const DEAL_KINDS = [
  "percent",
  "amount",
  "shipping",
  "points",
  "bundle",
  "other",
] as const;

type SearchValue = string | string[] | undefined;
export type DealSearchParams = Record<string, SearchValue>;
export type DealTiming = "ENDING_SOON" | "NO_DEADLINE" | "MORE_TIME" | null;
export type CouponFilter = "WITH_CODE" | "WITHOUT_CODE" | null;

export type DealFilters = {
  stores: StoreCategory[];
  items: ItemCategory[];
  strengths: (typeof DEAL_STRENGTHS)[number][];
  kinds: (typeof DEAL_KINDS)[number][];
  timing: DealTiming;
  coupon: CouponFilter;
  minScore: 0 | 50 | 70 | 85;
};

const asArray = (value: SearchValue) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const parsedList = <T extends string>(
  value: SearchValue,
  allowed: readonly T[],
) => [
  ...new Set(
    asArray(value).filter((item): item is T => allowed.includes(item as T)),
  ),
];

const first = (value: SearchValue) => asArray(value)[0];

export function parseDealFilters(params: DealSearchParams): DealFilters {
  const score = Number(first(params.score));
  const timing = first(params.timing);
  const coupon = first(params.coupon);
  return {
    stores: parsedList(params.store, STORE_CATEGORIES),
    items: parsedList(params.item, ITEM_CATEGORIES),
    strengths: parsedList(params.strength, DEAL_STRENGTHS),
    kinds: parsedList(params.kind, DEAL_KINDS),
    timing:
      timing === "ENDING_SOON" ||
      timing === "NO_DEADLINE" ||
      timing === "MORE_TIME"
        ? timing
        : null,
    coupon: coupon === "WITH_CODE" || coupon === "WITHOUT_CODE" ? coupon : null,
    minScore: score === 50 || score === 70 || score === 85 ? score : 0,
  };
}

export const activeDealFilterCount = (filters: DealFilters) =>
  filters.stores.length +
  filters.items.length +
  filters.strengths.length +
  filters.kinds.length +
  Number(filters.timing !== null) +
  Number(filters.coupon !== null) +
  Number(filters.minScore > 0);

const dealCardSelect = {
  id: true,
  merchantName: true,
  headline: true,
  summary: true,
  storeCategories: true,
  itemCategories: true,
  categoryConfidence: true,
  coupons: {
    select: { code: true, description: true },
    orderBy: { createdAt: "asc" },
  },
  discountKind: true,
  discountPercent: true,
  discountAmountMinor: true,
  currency: true,
  expiresAt: true,
  strength: true,
  purchaseFit: true,
  comparableCount: true,
  score: true,
  explanation: true,
  gmailMessage: {
    select: {
      images: {
        select: { id: true },
        orderBy: [{ isLikelyLogo: "desc" }, { position: "asc" }],
        take: 1,
      },
    },
  },
} satisfies Prisma.OfferSelect;

export type DealListItem = Prisma.OfferGetPayload<{
  select: typeof dealCardSelect;
}>;

export async function getDealResults(userId: string, filters: DealFilters) {
  const baseWhere: Prisma.OfferWhereInput = {
    userId,
    status: { in: ["ACTIVE", "SAVED"] },
  };
  const constraints: Prisma.OfferWhereInput[] = [];
  if (filters.stores.length) {
    constraints.push({ storeCategories: { hasSome: filters.stores } });
  }
  if (filters.items.length) {
    constraints.push({ itemCategories: { hasSome: filters.items } });
  }
  if (filters.strengths.length) {
    constraints.push({ strength: { in: filters.strengths } });
  }
  if (filters.kinds.length) {
    constraints.push({ discountKind: { in: filters.kinds } });
  }
  if (filters.minScore) constraints.push({ score: { gte: filters.minScore } });
  if (filters.coupon === "WITH_CODE") {
    constraints.push({ coupons: { some: {} } });
  } else if (filters.coupon === "WITHOUT_CODE") {
    constraints.push({ coupons: { none: {} } });
  }

  const now = new Date();
  const soon = new Date(now.getTime() + 72 * 60 * 60 * 1_000);
  if (filters.timing === "ENDING_SOON") {
    constraints.push({ expiresAt: { gt: now, lte: soon } });
  } else if (filters.timing === "NO_DEADLINE") {
    constraints.push({ expiresAt: null });
  } else if (filters.timing === "MORE_TIME") {
    constraints.push({ expiresAt: { gt: soon } });
  }

  const filteredWhere: Prisma.OfferWhereInput = {
    ...baseWhere,
    AND: constraints,
  };
  const [offers, matchingCount, totalCount, facetRows] = await Promise.all([
    prisma.offer.findMany({
      where: filteredWhere,
      select: dealCardSelect,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.offer.count({ where: filteredWhere }),
    prisma.offer.count({ where: baseWhere }),
    prisma.offer.findMany({
      where: baseWhere,
      select: {
        storeCategories: true,
        itemCategories: true,
        strength: true,
        discountKind: true,
      },
    }),
  ]);

  const availableStores = new Set<StoreCategory>();
  const availableItems = new Set<ItemCategory>();
  const strengths = new Set<string>();
  const kinds = new Set<string>();
  for (const row of facetRows) {
    row.storeCategories.forEach((value) => {
      const parsed = StoreCategorySchema.safeParse(value);
      if (parsed.success) availableStores.add(parsed.data);
    });
    row.itemCategories.forEach((value) => {
      const parsed = ItemCategorySchema.safeParse(value);
      if (parsed.success) availableItems.add(parsed.data);
    });
    strengths.add(row.strength);
    kinds.add(row.discountKind);
  }

  return {
    offers,
    matchingCount,
    totalCount,
    facets: {
      stores: STORE_CATEGORIES.filter((value) => availableStores.has(value)),
      items: ITEM_CATEGORIES.filter((value) => availableItems.has(value)),
      strengths: DEAL_STRENGTHS.filter((value) => strengths.has(value)),
      kinds: DEAL_KINDS.filter((value) => kinds.has(value)),
    },
  };
}
