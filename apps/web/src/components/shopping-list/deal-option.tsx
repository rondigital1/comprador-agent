import { ArrowUpRightIcon, LockKeyholeIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ShoppingListItem } from "@/data/shopping-list";

type Deal = ShoppingListItem["deals"][number];

const formatMoney = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);

export function DealOption({ deal, best }: { deal: Deal; best: boolean }) {
  const saving =
    deal.listPriceMinor && deal.listPriceMinor > deal.priceMinor
      ? deal.listPriceMinor - deal.priceMinor
      : null;
  return (
    <div className="group/deal grid gap-3 py-4 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {best ? <Badge>Best verified</Badge> : null}
          <Badge variant="outline">
            {deal.matchQuality.toLowerCase()} match
          </Badge>
          {deal.membershipRequired ? (
            <Badge variant="secondary">
              <LockKeyholeIcon aria-hidden="true" />
              {deal.membershipProgram ?? "Membership required"}
            </Badge>
          ) : null}
        </div>
        <h3 className="mt-2 truncate text-sm font-medium">{deal.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {deal.merchantName} · {deal.rationale}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="font-heading text-lg font-semibold tabular-nums">
            {formatMoney(deal.priceMinor, deal.currency)}
          </p>
          {saving ? (
            <p className="text-xs text-muted-foreground">
              {formatMoney(saving, deal.currency)} below listed price
            </p>
          ) : null}
          {deal.shippingCostMinor !== null ? (
            <p className="text-xs text-muted-foreground">
              {deal.shippingCostMinor === 0
                ? "Free shipping"
                : `+ ${formatMoney(deal.shippingCostMinor, deal.currency)} shipping`}
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={deal.url} target="_blank" rel="noreferrer">
            View <ArrowUpRightIcon data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </div>
  );
}
