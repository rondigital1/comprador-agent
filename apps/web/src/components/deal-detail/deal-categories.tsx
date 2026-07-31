import { ITEM_CATEGORY_LABELS, STORE_CATEGORY_LABELS } from "@casero/core";
import {
  ArrowUpRightIcon,
  Building2Icon,
  PackageSearchIcon,
  ScanSearchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

type CategoryOffer = {
  storeCategories: string[];
  itemCategories: string[];
  categoryConfidence: string;
  categorySourceKind: string;
  categorySourceUrl: string | null;
  categoryRationale: string | null;
};

const sourceLabels: Record<string, string> = {
  EMAIL: "Classified from this email",
  MERCHANT_SEARCH: "Merchant profile checked on the public web",
  MERCHANT_HISTORY: "Researched merchant profile reused",
};

const labelFor = (value: string, labels: Record<string, string>) =>
  labels[value] ?? value.toLocaleLowerCase().replaceAll("_", " ");

export function DealCategories({ offer }: { offer: CategoryOffer }) {
  const classified =
    offer.storeCategories.length > 0 || offer.itemCategories.length > 0;

  return (
    <section aria-labelledby="category-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Classification
          </p>
          <h2
            id="category-title"
            className="mt-2 font-heading text-3xl font-semibold tracking-tight"
          >
            What kind of deal is this?
          </h2>
        </div>
        <Badge variant="outline">
          <ScanSearchIcon data-icon="inline-start" />
          {offer.categoryConfidence.toLocaleLowerCase()} confidence
        </Badge>
      </div>

      <div className="mt-7 grid border-y sm:grid-cols-2">
        <CategoryColumn
          title="Store type"
          description="What the merchant primarily sells or provides."
          values={offer.storeCategories}
          labels={STORE_CATEGORY_LABELS}
          icon="store"
        />
        <CategoryColumn
          title="Items in this email"
          description="Only product or service types clearly promoted here."
          values={offer.itemCategories}
          labels={ITEM_CATEGORY_LABELS}
          icon="items"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4 text-xs text-muted-foreground">
        <div className="max-w-2xl">
          <p className="font-medium text-foreground">
            {sourceLabels[offer.categorySourceKind] ?? "Category source"}
          </p>
          <p className="mt-1 leading-5">
            {offer.categoryRationale ??
              (classified
                ? "Categories are limited to signals supported by the email."
                : "This older deal is waiting for background classification.")}
          </p>
        </div>
        {offer.categorySourceUrl ? (
          <a
            href={offer.categorySourceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            Merchant source
            <ArrowUpRightIcon aria-hidden="true" className="size-3" />
          </a>
        ) : null}
      </div>
    </section>
  );
}

function CategoryColumn({
  title,
  description,
  values,
  labels,
  icon,
}: {
  title: string;
  description: string;
  values: string[];
  labels: Record<string, string>;
  icon: "store" | "items";
}) {
  const Icon = icon === "store" ? Building2Icon : PackageSearchIcon;
  return (
    <div className="px-1 py-6 sm:px-6 sm:first:border-r">
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <Badge key={value} variant="secondary">
              {labelFor(value, labels)}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">Not classified</span>
        )}
      </div>
    </div>
  );
}
