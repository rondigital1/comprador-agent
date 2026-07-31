import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold">
          Page not found
        </h1>
        <Button asChild className="mt-6">
          <Link href="/today">Return to Today</Link>
        </Button>
      </div>
    </main>
  );
}
