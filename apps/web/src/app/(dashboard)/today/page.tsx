import {
  ArrowRightIcon,
  InboxIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DealList } from "@/components/deal-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getDashboardSnapshot } from "@/data/dashboard";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Today",
};

export default async function TodayPage() {
  const userId = await requireUserId();
  const snapshot = await getDashboardSnapshot(userId);
  const topDeals = snapshot.offers.slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Buying desk
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Worth your attention
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Promotions ranked by observed history and your active shopping
            intent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {snapshot.connection ? (
            <Badge variant="outline">
              {snapshot.connection.status === "ACTIVE"
                ? "Gmail connected"
                : snapshot.connection.status.toLowerCase().replace("_", " ")}
            </Badge>
          ) : null}
          {snapshot.pendingJobs > 0 ? (
            <Badge variant="secondary">{snapshot.pendingJobs} processing</Badge>
          ) : null}
        </div>
      </header>

      {snapshot.connection?.lastError ? (
        <Alert variant="destructive">
          <RefreshCwIcon aria-hidden="true" />
          <AlertTitle>Gmail sync needs attention</AlertTitle>
          <AlertDescription>{snapshot.connection.lastError}</AlertDescription>
        </Alert>
      ) : null}

      {topDeals.length > 0 ? (
        <DealList deals={topDeals} />
      ) : (
        <Empty className="min-h-96 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {snapshot.connection ? <SparklesIcon /> : <InboxIcon />}
            </EmptyMedia>
            <EmptyTitle>
              {snapshot.connection
                ? "No worthwhile promotions yet"
                : "Connect Gmail to build your deal history"}
            </EmptyTitle>
            <EmptyDescription>
              {snapshot.connection
                ? "The worker will surface promotions after they pass the local safety filter and evidence checks."
                : "Casero requests read-only Gmail access and starts with the Promotions category."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              {snapshot.connection ? (
                <Link href="/settings/integrations">
                  Check sync status
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              ) : (
                <a href="/api/gmail/connect">
                  Connect Gmail
                  <ArrowRightIcon data-icon="inline-end" />
                </a>
              )}
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
