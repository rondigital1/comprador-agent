import { SparklesIcon } from "lucide-react";
import type { Metadata } from "next";

import { DealList } from "@/components/deal-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getDashboardSnapshot } from "@/data/dashboard";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Deals",
};

export default async function DealsPage() {
  const userId = await requireUserId();
  const { offers } = await getDashboardSnapshot(userId);

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
          Every surfaced offer includes bounded history language and source
          evidence.
        </p>
      </header>
      {offers.length ? (
        <DealList deals={offers} />
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
