import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  MailIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardSnapshot } from "@/data/dashboard";
import { requireUserId } from "@/lib/session";
import { disconnectGmail, syncGmailNow } from "./actions";

export const metadata: Metadata = {
  title: "Integrations",
};

const feedback: Record<string, { title: string; description: string }> = {
  connected: {
    title: "Gmail connected",
    description: "The initial Promotions backfill is queued for the worker.",
  },
  denied: {
    title: "Gmail permission was not granted",
    description: "Nothing was connected. You can try again when ready.",
  },
  error: {
    title: "Gmail connection failed",
    description: "Check the local server log and Google OAuth configuration.",
  },
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const userId = await requireUserId();
  const [{ gmail }, snapshot] = await Promise.all([
    searchParams,
    getDashboardSnapshot(userId),
  ]);
  const message = gmail ? feedback[gmail] : null;
  const connection = snapshot.connection;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Data sources
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Integrations
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Identity login and mailbox access are deliberately separate.
        </p>
      </header>

      {message ? (
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>{message.title}</AlertTitle>
          <AlertDescription>{message.description}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon aria-hidden="true" className="size-4" />
            Gmail promotions
          </CardTitle>
          <CardDescription>
            Read-only access for promotion analysis. Casero cannot send, modify,
            archive, or delete your email.
          </CardDescription>
          <CardAction>
            <Badge
              variant={connection?.status === "ACTIVE" ? "default" : "outline"}
            >
              {connection?.status ?? "Not connected"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {connection ? (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Mailbox</dt>
                <dd className="mt-1 font-medium">{connection.emailAddress}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last sync</dt>
                <dd className="mt-1 font-medium">
                  {connection.lastSyncAt
                    ? connection.lastSyncAt.toLocaleString()
                    : "Initial sync queued"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Backfill filter</dt>
                <dd className="mt-1 font-mono text-xs">
                  {connection.backfillQuery}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="flex gap-3 rounded-lg bg-muted p-4 text-sm">
              <ShieldCheckIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <p className="text-muted-foreground">
                Google authorizes read access to the mailbox. Casero enforces
                the Promotions category and configured backfill query in
                application code.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {connection ? (
            <>
              <form action={syncGmailNow}>
                <Button type="submit" variant="outline">
                  <RefreshCwIcon data-icon="inline-start" />
                  Sync now
                </Button>
              </form>
              <form action={disconnectGmail}>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={connection.status === "DISCONNECTING"}
                >
                  Disconnect and delete Gmail data
                </Button>
              </form>
            </>
          ) : (
            <Button asChild>
              <a href="/api/gmail/connect">
                Connect Gmail
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
