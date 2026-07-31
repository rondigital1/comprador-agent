"use client";

import type { DeepDealAnalysis } from "@casero/core";
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  FlaskConicalIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldQuestionIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";

import { queueDeepAnalysis } from "@/app/(dashboard)/deals/[id]/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CouponCopyButton } from "./coupon-copy-button";
import { formatMoney } from "./deal-format";

type AnalysisState = {
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  asOf: Date | null;
  error: string | null;
  result: DeepDealAnalysis | null;
};

const verdictLabels: Record<DeepDealAnalysis["verdict"], string> = {
  WORTH_ATTENTION: "Worth attention",
  CONSIDER_IF_NEEDED: "Consider if needed",
  ROUTINE_PROMO: "Routine promotion",
  SKIP: "Probably skip",
  NEEDS_VERIFICATION: "Needs verification",
};

export function DeepAnalysisPanel({
  offerId,
  analysis,
}: {
  offerId: string;
  analysis: AnalysisState | null;
}) {
  const router = useRouter();
  const active =
    analysis?.status === "PENDING" || analysis?.status === "RUNNING";
  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => router.refresh(), 3_000);
    return () => window.clearInterval(interval);
  }, [active, router]);

  const action = queueDeepAnalysis.bind(null, offerId);
  const result = analysis?.result;

  return (
    <aside className="deal-analysis-shell lg:sticky lg:top-8 lg:self-start">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Live research
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
            Deep deal analysis
          </h2>
        </div>
        {result ? (
          <Badge>{verdictLabels[result.verdict]}</Badge>
        ) : (
          <FlaskConicalIcon
            aria-hidden="true"
            className="size-5 text-muted-foreground"
          />
        )}
      </div>

      {active ? (
        <Alert className="mt-6">
          <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
          <AlertTitle>
            {analysis.status === "PENDING"
              ? "Research queued"
              : "Checking the current market"}
          </AlertTitle>
          <AlertDescription>
            Terra is checking bounded public sources. This page refreshes
            automatically.
          </AlertDescription>
        </Alert>
      ) : result ? (
        <AnalysisResult result={result} asOf={analysis?.asOf ?? null} />
      ) : (
        <div className="mt-6">
          <p className="text-sm leading-6 text-muted-foreground">
            Check current merchant terms, public alternatives, and additional
            coupon evidence. No purchase or checkout action is taken.
          </p>
          {analysis?.status === "FAILED" ? (
            <Alert variant="destructive" className="mt-5">
              <ShieldQuestionIcon aria-hidden="true" />
              <AlertTitle>Research could not finish</AlertTitle>
              <AlertDescription>
                {analysis.error ?? "The worker will need another attempt."}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      )}

      {!active ? (
        <form action={action} className="mt-6">
          <SubmitAnalysisButton
            rerun={Boolean(result || analysis?.status === "FAILED")}
          />
        </form>
      ) : null}
    </aside>
  );
}

function SubmitAnalysisButton({ rerun }: { rerun: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
      ) : rerun ? (
        <RefreshCwIcon data-icon="inline-start" />
      ) : (
        <SearchIcon data-icon="inline-start" />
      )}
      {pending ? "Queuing…" : rerun ? "Refresh analysis" : "Analyze this deal"}
    </Button>
  );
}

function AnalysisResult({
  result,
  asOf,
}: {
  result: DeepDealAnalysis;
  asOf: Date | null;
}) {
  const option = result.bestVerifiedOption;
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {result.marketPosition.replaceAll("_", " ")}
          </Badge>
          <Badge variant="outline">{result.attentionTier} priority</Badge>
        </div>
        <p className="mt-4 text-sm leading-6">{result.summary}</p>
        {asOf ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Checked {asOf.toLocaleString()}
          </p>
        ) : null}
      </div>

      {option ? (
        <div className="border-y py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                Best verified among checked
              </p>
              <h3 className="mt-1 font-heading text-lg font-semibold">
                {option.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {option.merchant} · {option.qualification}
              </p>
            </div>
            {option.totalPriceMinor !== null && option.currency ? (
              <p className="font-heading text-lg font-semibold">
                {formatMoney(option.totalPriceMinor, option.currency)}
              </p>
            ) : null}
          </div>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <a href={option.url} target="_blank" rel="noreferrer">
              View source <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
      ) : null}

      {result.discoveredCoupons.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium">Additional public coupons</h3>
          <div className="mt-2 border-y">
            {result.discoveredCoupons.map((coupon) => (
              <CouponCopyButton
                key={`${coupon.code}-${coupon.sourceUrl ?? "unknown"}`}
                code={coupon.code}
                description={coupon.description}
                status={coupon.status}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <ReasonList title="Why" items={result.materialReasons} icon="check" />
        <ReasonList
          title="Still unknown"
          items={result.materialUnknowns}
          icon="unknown"
        />
      </div>

      {result.sources.length > 0 ? (
        <div>
          <h3 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Sources checked
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {result.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 text-xs hover:underline"
                >
                  <span className="truncate">{source.title}</span>
                  <ArrowUpRightIcon className="size-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ReasonList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: "check" | "unknown";
}) {
  if (items.length === 0) return null;
  const Icon = icon === "check" ? CheckCircle2Icon : ShieldQuestionIcon;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <Icon aria-hidden="true" className="size-4" />
        {title}
      </h3>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-xs leading-5 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
