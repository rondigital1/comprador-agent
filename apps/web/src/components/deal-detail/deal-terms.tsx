import { CircleAlertIcon, TagIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { CouponCopyButton } from "./coupon-copy-button";
import { formatDate, formatMoney, getExpiryState } from "./deal-format";

type TermsOffer = {
  coupons: Array<{ id: string; code: string; description: string | null }>;
  minimumSpendMinor: number | null;
  currency: string | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  exclusions: string[];
};

export function DealTerms({ offer }: { offer: TermsOffer }) {
  const expiry = getExpiryState(offer.expiresAt);

  return (
    <section aria-labelledby="terms-title" className="scroll-mt-24">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Redeem
      </p>
      <h2
        id="terms-title"
        className="mt-2 font-heading text-3xl font-semibold tracking-tight"
      >
        Codes and conditions
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        These terms were extracted from the source email. Unknowns stay unknown
        until a deeper check verifies them.
      </p>

      {offer.coupons.length > 0 ? (
        <div className="mt-7 border-y">
          {offer.coupons.map((coupon) => (
            <CouponCopyButton
              key={coupon.id}
              code={coupon.code}
              description={coupon.description}
            />
          ))}
        </div>
      ) : (
        <Alert className="mt-7">
          <TagIcon aria-hidden="true" />
          <AlertTitle>No coupon code required or confirmed</AlertTitle>
          <AlertDescription>
            The promotion may apply automatically, or the email did not include
            a grounded code.
          </AlertDescription>
        </Alert>
      )}

      <dl className="mt-8 grid gap-px overflow-hidden border bg-border sm:grid-cols-2">
        <Term
          label="Starts"
          value={offer.startsAt ? formatDate(offer.startsAt) : "Not stated"}
        />
        <Term label="Deadline" value={expiry.label} />
        <Term
          label="Minimum spend"
          value={
            offer.minimumSpendMinor !== null && offer.currency
              ? formatMoney(offer.minimumSpendMinor, offer.currency)
              : "Not stated"
          }
        />
        <Term label="Stacking" value="Not assumed" />
      </dl>

      {offer.exclusions.length > 0 ? (
        <div className="mt-8">
          <Separator className="mb-6" />
          <div className="flex gap-3">
            <CircleAlertIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div>
              <h3 className="text-sm font-medium">Known exclusions</h3>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-sm leading-6 text-muted-foreground">
                {offer.exclusions.map((exclusion) => (
                  <li key={exclusion}>{exclusion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <dt className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
