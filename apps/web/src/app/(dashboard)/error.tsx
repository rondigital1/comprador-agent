"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-80 flex-col items-start justify-center gap-4">
      <h2 className="font-heading text-xl font-semibold">
        The buying desk could not load
      </h2>
      <p className="text-sm text-muted-foreground">
        Check the database and worker, then try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
