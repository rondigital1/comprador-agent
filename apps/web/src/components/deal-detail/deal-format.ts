export type ExpiryState = {
  label: string;
  detail: string;
  urgent: boolean;
  expired: boolean;
};

export function formatMoney(minor: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(minor / 100);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDiscount(input: {
  discountPercent: { toNumber(): number } | null;
  discountAmountMinor: number | null;
  currency: string | null;
  discountKind: string;
}) {
  if (input.discountPercent) return `${input.discountPercent.toNumber()}% off`;
  if (input.discountAmountMinor !== null && input.currency) {
    return `${formatMoney(input.discountAmountMinor, input.currency)} off`;
  }
  const labels: Record<string, string> = {
    shipping: "Shipping offer",
    points: "Points offer",
    bundle: "Bundle offer",
    other: "Special offer",
  };
  return labels[input.discountKind] ?? "Promotion";
}

export function getExpiryState(
  expiresAt: Date | null,
  now = new Date(),
): ExpiryState {
  if (!expiresAt) {
    return {
      label: "No confirmed deadline",
      detail: "The source email did not state a reliable expiration date.",
      urgent: false,
      expired: false,
    };
  }
  const remainingMs = expiresAt.getTime() - now.getTime();
  const remainingHours = Math.ceil(remainingMs / 3_600_000);
  if (remainingHours <= 0) {
    return {
      label: "Expired",
      detail: `The stated deadline was ${formatDate(expiresAt)}.`,
      urgent: false,
      expired: true,
    };
  }
  if (remainingHours <= 24) {
    return {
      label: "Ends today",
      detail: `Less than ${remainingHours} hours remain based on the email deadline.`,
      urgent: true,
      expired: false,
    };
  }
  if (remainingHours <= 72) {
    return {
      label: `Ends in ${Math.ceil(remainingHours / 24)} days`,
      detail: `Limited-time promotion ending ${formatDate(expiresAt)}.`,
      urgent: true,
      expired: false,
    };
  }
  return {
    label: `Ends ${formatDate(expiresAt)}`,
    detail: `${Math.ceil(remainingHours / 24)} days remain based on the stated deadline.`,
    urgent: false,
    expired: false,
  };
}

export const strengthLabels: Record<string, string> = {
  INSUFFICIENT_HISTORY: "Building history",
  ROUTINE: "Routine promotion",
  STRONG: "Stronger than usual",
  BEST_OBSERVED: "Best observed",
};
