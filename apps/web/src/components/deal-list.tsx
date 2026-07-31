import { ClockIcon, HistoryIcon, TagIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Deal = {
  id: string;
  merchantName: string;
  headline: string;
  summary: string;
  promoCode: string | null;
  discountPercent: { toNumber(): number } | null;
  discountAmountMinor: number | null;
  currency: string | null;
  expiresAt: Date | null;
  strength: string;
  purchaseFit: string;
  comparableCount: number;
  score: number;
  explanation: string;
};

const strengthLabel: Record<string, string> = {
  INSUFFICIENT_HISTORY: "Building history",
  ROUTINE: "Routine promo",
  STRONG: "Stronger than usual",
  BEST_OBSERVED: "Best observed",
};

const formatDiscount = (deal: Deal) => {
  if (deal.discountPercent) {
    return `${deal.discountPercent.toNumber()}% off`;
  }
  if (deal.discountAmountMinor && deal.currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: deal.currency,
    }).format(deal.discountAmountMinor / 100);
  }
  return "Promotion";
};

export function DealList({ deals }: { deals: Deal[] }) {
  return (
    <div className="rounded-2xl border bg-card">
      {deals.map((deal, index) => (
        <div key={deal.id}>
          <article className="grid gap-4 p-5 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {deal.merchantName}
                </p>
                <Badge variant={deal.score >= 70 ? "default" : "secondary"}>
                  {deal.score} / 100
                </Badge>
                <Badge variant="outline">
                  {strengthLabel[deal.strength] ?? deal.strength}
                </Badge>
              </div>
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                {deal.headline}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {deal.summary}
              </p>
              <p className="mt-3 text-sm">{deal.explanation}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <HistoryIcon aria-hidden="true" className="size-3.5" />
                  {deal.comparableCount} comparable offers
                </span>
                {deal.expiresAt ? (
                  <span className="flex items-center gap-1.5">
                    <ClockIcon aria-hidden="true" className="size-3.5" />
                    Ends {deal.expiresAt.toLocaleDateString()}
                  </span>
                ) : null}
                {deal.promoCode ? (
                  <span className="flex items-center gap-1.5">
                    <TagIcon aria-hidden="true" className="size-3.5" />
                    Code {deal.promoCode}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="font-heading text-xl font-semibold">
              {formatDiscount(deal)}
            </p>
          </article>
          {index < deals.length - 1 ? <Separator /> : null}
        </div>
      ))}
    </div>
  );
}
