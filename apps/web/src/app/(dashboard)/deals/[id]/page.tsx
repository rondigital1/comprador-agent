import { DeepDealAnalysisSchema } from "@casero/core";
import { ArrowLeftIcon, CalendarClockIcon, GaugeIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DealHero } from "@/components/deal-detail/deal-hero";
import { DealCategories } from "@/components/deal-detail/deal-categories";
import { DealHistory } from "@/components/deal-detail/deal-history";
import { DealTerms } from "@/components/deal-detail/deal-terms";
import { DeepAnalysisPanel } from "@/components/deal-detail/deep-analysis-panel";
import { EmailEvidence } from "@/components/deal-detail/email-evidence";
import { getExpiryState } from "@/components/deal-detail/deal-format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getDealDetail } from "@/data/deals";
import { requireUserId } from "@/lib/session";

type DealPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: DealPageProps): Promise<Metadata> {
  const userId = await requireUserId();
  const { id } = await params;
  const detail = await getDealDetail(userId, id);
  return detail
    ? { title: `${detail.offer.merchantName}: ${detail.offer.headline}` }
    : { title: "Deal not found" };
}

export default async function DealPage({ params }: DealPageProps) {
  const userId = await requireUserId();
  const { id } = await params;
  const detail = await getDealDetail(userId, id);
  if (!detail) notFound();

  const { offer, history, latestAnalysis } = detail;
  const heroImage =
    offer.gmailMessage.images.find((image) => !image.isLikelyLogo) ??
    offer.gmailMessage.images[0] ??
    null;
  const parsedAnalysis = latestAnalysis?.result
    ? DeepDealAnalysisSchema.safeParse(latestAnalysis.result)
    : null;
  const expiry = getExpiryState(offer.expiresAt);

  return (
    <div className="deal-detail-page -mx-4 -my-8 sm:-mx-8 lg:-mx-12">
      <nav aria-label="Breadcrumb" className="px-5 py-5 sm:px-8 lg:px-12">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/deals">
            <ArrowLeftIcon data-icon="inline-start" />
            All deals
          </Link>
        </Button>
      </nav>

      <DealHero offer={offer} heroImageId={heroImage?.id ?? null} />

      <div className="grid gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 lg:px-12 lg:py-16">
        <div className="min-w-0 flex flex-col gap-12">
          <section aria-labelledby="read-title">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Read first
            </p>
            <h2
              id="read-title"
              className="mt-2 font-heading text-3xl font-semibold tracking-tight"
            >
              What this signal means
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7">
              {offer.explanation}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Alert
                variant={
                  expiry.urgent || expiry.expired ? "destructive" : "default"
                }
              >
                <CalendarClockIcon aria-hidden="true" />
                <AlertTitle>{expiry.label}</AlertTitle>
                <AlertDescription>{expiry.detail}</AlertDescription>
              </Alert>
              <Alert>
                <GaugeIcon aria-hidden="true" />
                <AlertTitle>
                  {offer.purchaseFit.replaceAll("_", " ")}
                </AlertTitle>
                <AlertDescription>
                  Purchase fit reflects active saved intent, independently from
                  promotion strength.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          <DealCategories offer={offer} />
          <DealTerms offer={offer} />
          <DealHistory
            currentHeadline={offer.headline}
            currentObservedAt={offer.createdAt}
            strength={offer.strength}
            history={history}
          />
          <EmailEvidence
            merchantName={offer.merchantName}
            gmailMessageId={offer.gmailMessage.gmailMessageId}
            sender={offer.gmailMessage.sender}
            subject={offer.gmailMessage.subject}
            receivedAt={offer.gmailMessage.receivedAt}
            images={offer.gmailMessage.images}
            evidence={offer.evidence}
          />
        </div>

        <DeepAnalysisPanel
          offerId={offer.id}
          analysis={
            latestAnalysis
              ? {
                  status: latestAnalysis.status,
                  asOf: latestAnalysis.asOf,
                  error: latestAnalysis.error,
                  result:
                    parsedAnalysis?.success === true
                      ? parsedAnalysis.data
                      : null,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
