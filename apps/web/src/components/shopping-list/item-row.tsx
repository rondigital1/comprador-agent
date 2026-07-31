import { CircleAlertIcon, LoaderCircleIcon, SearchXIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ShoppingListItem } from "@/data/shopping-list";

import { DealOption } from "./deal-option";
import { ItemButtons, WatchControl } from "./item-controls";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

export function ShoppingItemRow({
  item,
  rank,
}: {
  item: ShoppingListItem;
  rank: number;
}) {
  const researchActive = ["PENDING", "RUNNING"].includes(item.researchStatus);
  return (
    <li className="group/item py-7 first:pt-5 last:pb-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold text-muted-foreground transition-colors group-hover/item:border-primary/40 group-hover/item:text-primary">
              {rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  {item.name}
                </h2>
                {researchActive ? (
                  <Badge variant="secondary">
                    <LoaderCircleIcon
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    {item.researchStatus === "PENDING"
                      ? "Queued"
                      : "Researching"}
                  </Badge>
                ) : null}
                {item.watchEnabled ? (
                  <Badge variant="outline">Watching daily</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.maxPriceMinor
                  ? `Budget up to $${(item.maxPriceMinor / 100).toLocaleString()}`
                  : "No price cap"}
                {item.lastResearchedAt
                  ? ` · Last checked ${formatDate(item.lastResearchedAt)}`
                  : " · First search in progress"}
              </p>
            </div>
          </div>

          {item.researchSummary ? (
            <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground">
              {item.researchSummary}
            </p>
          ) : null}

          {item.lastError ? (
            <Alert variant="destructive" className="mt-5">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Research did not finish</AlertTitle>
              <AlertDescription>{item.lastError}</AlertDescription>
            </Alert>
          ) : null}

          {item.deals.length > 0 ? (
            <div className="mt-4 divide-y">
              {item.deals.map((deal, index) => (
                <DealOption key={deal.id} deal={deal} best={index === 0} />
              ))}
            </div>
          ) : !researchActive && !item.lastError ? (
            <div className="mt-5 flex items-start gap-3 text-sm text-muted-foreground">
              <SearchXIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <p>
                No current offer cleared the match, price, and source checks.
                Turn on daily watching to keep looking.
              </p>
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-5 lg:border-l lg:pl-6">
          <WatchControl intentId={item.id} enabled={item.watchEnabled} />
          {item.watchEnabled && item.nextCheckAt ? (
            <p className="text-xs text-muted-foreground">
              Next check around {formatDate(item.nextCheckAt)}
            </p>
          ) : null}
          <ItemButtons intentId={item.id} researchActive={researchActive} />
        </aside>
      </div>
      <Separator className="mt-7" />
    </li>
  );
}
