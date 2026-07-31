import { AlertTriangleIcon, CalendarClockIcon } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";

import { formatDiscount, getExpiryState, strengthLabels } from "./deal-format";

type HeroOffer = {
  merchantName: string;
  headline: string;
  summary: string;
  score: number;
  strength: string;
  discountPercent: { toNumber(): number } | null;
  discountAmountMinor: number | null;
  currency: string | null;
  discountKind: string;
  expiresAt: Date | null;
};

export function DealHero({
  offer,
  heroImageId,
}: {
  offer: HeroOffer;
  heroImageId: string | null;
}) {
  const expiry = getExpiryState(offer.expiresAt);

  return (
    <section className="overflow-hidden border-y lg:grid lg:min-h-[31rem] lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
      <div className="flex min-h-[26rem] flex-col justify-between px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={expiry.urgent ? "destructive" : "outline"}>
            {expiry.urgent ? (
              <AlertTriangleIcon data-icon="inline-start" />
            ) : (
              <CalendarClockIcon data-icon="inline-start" />
            )}
            {expiry.label}
          </Badge>
          <Badge variant="secondary">
            {strengthLabels[offer.strength] ?? offer.strength}
          </Badge>
        </div>
        <div className="my-10 max-w-3xl">
          <p className="mb-5 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            {offer.merchantName}
          </p>
          <h1 className="font-heading text-4xl leading-[0.98] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
            {offer.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {offer.summary}
          </p>
        </div>
        <div className="flex items-end justify-between gap-6 border-t pt-5">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Offer
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold tracking-tight">
              {formatDiscount(offer)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Attention
            </p>
            <p className="mt-1 font-heading text-2xl font-semibold">
              {offer.score}
              <span className="text-sm text-muted-foreground">/100</span>
            </p>
          </div>
        </div>
      </div>
      <div className="relative min-h-[22rem] overflow-hidden border-t bg-muted lg:min-h-full lg:border-t-0 lg:border-l">
        {heroImageId ? (
          <Image
            src={`/api/deal-images/${heroImageId}`}
            alt={`Image included in the ${offer.merchantName} email`}
            fill
            unoptimized
            preload
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.015]"
          />
        ) : (
          <div className="deal-blueprint flex h-full min-h-[22rem] items-end p-8 lg:p-10">
            <p className="max-w-sm font-heading text-5xl leading-none font-semibold tracking-[-0.05em] text-muted-foreground/35 uppercase sm:text-6xl">
              {offer.merchantName}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
