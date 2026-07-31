"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CouponCopyButton({
  code,
  description,
  status,
}: {
  code: string;
  description?: string | null;
  status?: string;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1_800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <div className="group flex min-w-0 items-center gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="font-heading text-base font-semibold tracking-[0.08em]">
            {code}
          </code>
          {status ? (
            <Badge variant="outline">{status.replaceAll("_", " ")}</Badge>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
        }}
        aria-label={`Copy coupon code ${code}`}
      >
        {copied ? (
          <CheckIcon data-icon="inline-start" />
        ) : (
          <CopyIcon data-icon="inline-start" />
        )}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}
