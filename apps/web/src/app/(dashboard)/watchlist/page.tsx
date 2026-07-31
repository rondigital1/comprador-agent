import { BookmarkIcon } from "lucide-react";
import type { Metadata } from "next";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default function WatchlistPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Active intent
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Watchlist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Shopping intents will raise the purchase-fit score of relevant
          promotions.
        </p>
      </header>
      <Empty className="min-h-80 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookmarkIcon />
          </EmptyMedia>
          <EmptyTitle>Intent editor is the next slice</EmptyTitle>
          <EmptyDescription>
            The database and matching boundary are scaffolded; the create/edit
            flow comes after Gmail ingestion is running.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
