import type {
  PromotionEvaluation,
  PromotionExtraction,
  ShoppingIntentInput,
} from "./promotion";

const STOP_WORDS = new Set([
  "and",
  "for",
  "from",
  "the",
  "this",
  "that",
  "with",
  "your",
]);

const normalizeToken = (token: string) => {
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
};

const tokens = (value: string) => {
  const matches = value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  return new Set(
    matches
      .filter((token) => !STOP_WORDS.has(token))
      .map((token) => normalizeToken(token)),
  );
};

function resolveIntentFit(
  extraction: PromotionExtraction,
  intents: ShoppingIntentInput[],
): Pick<PromotionEvaluation, "purchaseFit" | "matchedIntentId"> {
  if (intents.length === 0) {
    return { purchaseFit: "NO_ACTIVE_INTENT", matchedIntentId: null };
  }

  const offerTokens = tokens(
    `${extraction.merchantName} ${extraction.headline} ${extraction.summary}`,
  );
  let bestMatch: {
    id: string;
    nameOverlaps: number;
    queryOverlaps: number;
  } | null = null;

  for (const intent of intents) {
    const nameTokens = tokens(intent.name);
    const queryTokens = tokens(intent.query);
    const nameOverlaps = [...nameTokens].filter((token) =>
      offerTokens.has(token),
    ).length;
    const queryOverlaps = [...queryTokens].filter((token) =>
      offerTokens.has(token),
    ).length;

    const overlapWeight = nameOverlaps * 2 + queryOverlaps;
    const bestWeight = bestMatch
      ? bestMatch.nameOverlaps * 2 + bestMatch.queryOverlaps
      : -1;
    if (overlapWeight > bestWeight) {
      bestMatch = { id: intent.id, nameOverlaps, queryOverlaps };
    }
  }

  if (!bestMatch || bestMatch.nameOverlaps + bestMatch.queryOverlaps === 0) {
    return { purchaseFit: "LOW", matchedIntentId: null };
  }

  return {
    purchaseFit: bestMatch.nameOverlaps > 0 ? "HIGH" : "MEDIUM",
    matchedIntentId: bestMatch.id,
  };
}

function resolveStrength(
  currentDiscount: number | null,
  comparableDiscounts: number[],
): PromotionEvaluation["strength"] {
  if (currentDiscount === null || comparableDiscounts.length < 5) {
    return "INSUFFICIENT_HISTORY";
  }

  const atOrBelow = comparableDiscounts.filter(
    (value) => value <= currentDiscount,
  ).length;
  const percentile = atOrBelow / comparableDiscounts.length;

  if (currentDiscount >= Math.max(...comparableDiscounts)) {
    return "BEST_OBSERVED";
  }

  if (comparableDiscounts.length >= 20 && percentile >= 0.75) {
    return "STRONG";
  }

  return "ROUTINE";
}

export function evaluatePromotion(input: {
  extraction: PromotionExtraction;
  comparableDiscounts: number[];
  intents: ShoppingIntentInput[];
}): PromotionEvaluation {
  const { extraction, comparableDiscounts } = input;
  const strength = resolveStrength(
    extraction.discountPercent,
    comparableDiscounts,
  );
  const intent = resolveIntentFit(extraction, input.intents);

  const discountPoints = Math.min(extraction.discountPercent ?? 0, 50);
  const strengthPoints = {
    INSUFFICIENT_HISTORY: 0,
    ROUTINE: 5,
    STRONG: 20,
    BEST_OBSERVED: 30,
  }[strength];
  const fitPoints = {
    NO_ACTIVE_INTENT: 0,
    LOW: 0,
    MEDIUM: 10,
    HIGH: 20,
  }[intent.purchaseFit];
  const score = Math.round(
    Math.min(discountPoints + strengthPoints + fitPoints, 100),
  );
  const comparableCount = comparableDiscounts.length;

  const historyText =
    strength === "INSUFFICIENT_HISTORY"
      ? `Not enough comparable history (${comparableCount} observed).`
      : strength === "BEST_OBSERVED"
        ? `Best among ${comparableCount} comparable offers observed.`
        : strength === "STRONG"
          ? `Stronger than most of ${comparableCount} comparable offers observed.`
          : `Similar to the routine offers in ${comparableCount} observations.`;
  const fitText =
    intent.purchaseFit === "HIGH"
      ? "It closely matches an active shopping intent."
      : intent.purchaseFit === "MEDIUM"
        ? "It may match an active shopping intent."
        : "No strong match to an active shopping intent.";

  return {
    score,
    strength,
    purchaseFit: intent.purchaseFit,
    comparableCount,
    matchedIntentId: intent.matchedIntentId,
    explanation: `${historyText} ${fitText}`,
  };
}
