import { SearchXIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";

import { DealFilters } from "@/components/deal-filters";
import { DealList } from "@/components/deal-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  activeDealFilterCount,
  getDealResults,
  parseDealFilters,
  type DealSearchParams,
} from "@/data/deal-filters";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Deals",
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<DealSearchParams>;
}) {
  const userId = await requireUserId();
  const filters = parseDealFilters(await searchParams);
  const { offers, matchingCount, totalCount, facets } = await getDealResults(
    userId,
    filters,
  );
  const filterCount = activeDealFilterCount(filters);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Promotion history
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Deals
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {filterCount
            ? `${matchingCount} of ${totalCount} deals match the current view.`
            : `${totalCount} evaluated deals, classified by store and promoted items.`}
        </p>
      </header>
      {totalCount ? <DealFilters filters={filters} facets={facets} /> : null}
      {offers.length ? (
        <DealList deals={offers} />
      ) : totalCount ? (
        <Empty className="min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>No matching deals</EmptyTitle>
            <EmptyDescription>
              Clear or broaden the selected categories and offer factors.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SparklesIcon />
            </EmptyMedia>
            <EmptyTitle>No evaluated deals</EmptyTitle>
            <EmptyDescription>
              Connected promotional messages will appear here after processing.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
