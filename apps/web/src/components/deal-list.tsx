import { ITEM_CATEGORY_LABELS, STORE_CATEGORY_LABELS } from "@casero/core";
import {
  ArrowUpRightIcon,
  ClockIcon,
  HistoryIcon,
  TagIcon,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DealListItem } from "@/data/deal-filters";

const strengthLabel: Record<string, string> = {
  INSUFFICIENT_HISTORY: "Building history",
  ROUTINE: "Routine promo",
  STRONG: "Stronger than usual",
  BEST_OBSERVED: "Best observed",
};

const formatDiscount = (deal: DealListItem) => {
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

const merchantInitials = (merchantName: string) =>
  merchantName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("");

const categoryLabel = (value: string, labels: Record<string, string>) =>
  labels[value] ?? value.toLocaleLowerCase().replaceAll("_", " ");

export function DealList({ deals }: { deals: DealListItem[] }) {
  return (
    <div className="rounded-2xl border bg-card">
      {deals.map((deal, index) => (
        <div key={deal.id}>
          <Link
            href={`/deals/${deal.id}`}
            className="group block transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Open ${deal.merchantName} deal: ${deal.headline}`}
          >
            <article className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-6">
              <Avatar className="size-11 border bg-background">
                {deal.gmailMessage.images[0] ? (
                  <AvatarImage
                    src={`/api/deal-images/${deal.gmailMessage.images[0].id}`}
                    alt={`${deal.merchantName} mark`}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback>
                  {merchantInitials(deal.merchantName)}
                </AvatarFallback>
              </Avatar>
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
                {deal.storeCategories.length || deal.itemCategories.length ? (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {deal.storeCategories.slice(0, 1).map((category) => (
                      <Badge key={category} variant="secondary">
                        {categoryLabel(category, STORE_CATEGORY_LABELS)}
                      </Badge>
                    ))}
                    {deal.itemCategories.slice(0, 3).map((category) => (
                      <Badge key={category} variant="ghost">
                        {categoryLabel(category, ITEM_CATEGORY_LABELS)}
                      </Badge>
                    ))}
                    {deal.storeCategories.length + deal.itemCategories.length >
                    4 ? (
                      <Badge variant="ghost">
                        +
                        {deal.storeCategories.length +
                          deal.itemCategories.length -
                          4}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
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
                  {deal.coupons.length > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <TagIcon aria-hidden="true" className="size-3.5" />
                      {deal.coupons.length}{" "}
                      {deal.coupons.length === 1 ? "code" : "codes"}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-start gap-2 sm:justify-self-end">
                <p className="font-heading text-xl font-semibold">
                  {formatDiscount(deal)}
                </p>
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </div>
            </article>
          </Link>
          {index < deals.length - 1 ? <Separator /> : null}
        </div>
      ))}
    </div>
  );
}
