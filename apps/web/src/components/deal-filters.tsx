import {
  ITEM_CATEGORY_LABELS,
  STORE_CATEGORY_LABELS,
  type ItemCategory,
  type StoreCategory,
} from "@casero/core";
import { SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  activeDealFilterCount,
  type DealFilters as DealFilterState,
} from "@/data/deal-filters";

type Facets = {
  stores: StoreCategory[];
  items: ItemCategory[];
  strengths: string[];
  kinds: string[];
};

const strengthLabels: Record<string, string> = {
  BEST_OBSERVED: "Best observed",
  STRONG: "Stronger than usual",
  ROUTINE: "Routine promotion",
  INSUFFICIENT_HISTORY: "Building history",
};

const kindLabels: Record<string, string> = {
  percent: "Percent off",
  amount: "Amount off",
  shipping: "Shipping",
  points: "Points",
  bundle: "Bundle",
  other: "Other offer",
};

export function DealFilters({
  filters,
  facets,
}: {
  filters: DealFilterState;
  facets: Facets;
}) {
  const activeCount = activeDealFilterCount(filters);
  const stores = mergeSelected(facets.stores, filters.stores);
  const items = mergeSelected(facets.items, filters.items);
  const strengths = mergeSelected(facets.strengths, filters.strengths);
  const kinds = mergeSelected(facets.kinds, filters.kinds);

  return (
    <section className="overflow-hidden rounded-2xl border bg-card/70">
      <form action="/deals" method="get">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SlidersHorizontalIcon
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <div>
              <h2 className="text-sm font-semibold">Refine the signal</h2>
              <p className="text-xs text-muted-foreground">
                Categories match any selected value within a group.
              </p>
            </div>
          </div>
          {activeCount ? (
            <Badge variant="secondary">
              {activeCount} active {activeCount === 1 ? "filter" : "filters"}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-8 px-5 py-6 sm:px-6 lg:grid-cols-[1fr_1.2fr_1fr]">
          <CheckboxFacet
            legend="Store type"
            emptyLabel="Store types appear after merchant classification."
            name="store"
            options={stores.map((value) => ({
              value,
              label: STORE_CATEGORY_LABELS[value],
            }))}
            selected={filters.stores}
          />
          <CheckboxFacet
            legend="Items promoted"
            emptyLabel="Item types appear when the email names them clearly."
            name="item"
            options={items.map((value) => ({
              value,
              label: ITEM_CATEGORY_LABELS[value],
            }))}
            selected={filters.items}
          />
          <div className="flex flex-col gap-6">
            <CheckboxFacet
              legend="Promotion strength"
              emptyLabel="Strength filters appear with evaluated deals."
              name="strength"
              options={strengths.map((value) => ({
                value,
                label: strengthLabels[value] ?? value,
              }))}
              selected={filters.strengths}
            />
            <CheckboxFacet
              legend="Offer type"
              emptyLabel="Offer types appear with evaluated deals."
              name="kind"
              options={kinds.map((value) => ({
                value,
                label: kindLabels[value] ?? value,
              }))}
              selected={filters.kinds}
            />
          </div>
        </div>

        <div className="grid gap-4 border-t px-5 py-5 sm:grid-cols-3 sm:px-6 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <SelectFilter
            id="score-filter"
            label="Attention score"
            name="score"
            defaultValue={String(filters.minScore)}
            options={[
              ["0", "Any score"],
              ["50", "50 and above"],
              ["70", "70 and above"],
              ["85", "85 and above"],
            ]}
          />
          <SelectFilter
            id="timing-filter"
            label="Timing"
            name="timing"
            defaultValue={filters.timing ?? ""}
            options={[
              ["", "Any timing"],
              ["ENDING_SOON", "Ending within 72 hours"],
              ["MORE_TIME", "More than 72 hours"],
              ["NO_DEADLINE", "No confirmed deadline"],
            ]}
          />
          <SelectFilter
            id="coupon-filter"
            label="Coupon codes"
            name="coupon"
            defaultValue={filters.coupon ?? ""}
            options={[
              ["", "With or without codes"],
              ["WITH_CODE", "Has a code"],
              ["WITHOUT_CODE", "No code"],
            ]}
          />
          <div className="flex gap-2 lg:justify-self-end">
            {activeCount ? (
              <Button variant="ghost" asChild>
                <Link href="/deals">Clear</Link>
              </Button>
            ) : null}
            <Button type="submit">Apply filters</Button>
          </div>
        </div>
      </form>
    </section>
  );
}

function CheckboxFacet<T extends string>({
  legend,
  emptyLabel,
  name,
  options,
  selected,
}: {
  legend: string;
  emptyLabel: string;
  name: string;
  options: Array<{ value: T; label: string }>;
  selected: T[];
}) {
  return (
    <FieldSet>
      <FieldLegend variant="label">{legend}</FieldLegend>
      {options.length ? (
        <FieldGroup className="gap-2.5" data-slot="checkbox-group">
          {options.map((option) => {
            const id = `${name}-${option.value.toLocaleLowerCase()}`;
            return (
              <Field key={option.value} orientation="horizontal">
                <Checkbox
                  id={id}
                  name={name}
                  value={option.value}
                  defaultChecked={selected.includes(option.value)}
                />
                <FieldLabel htmlFor={id} className="text-xs font-normal">
                  {option.label}
                </FieldLabel>
              </Field>
            );
          })}
        </FieldGroup>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">{emptyLabel}</p>
      )}
    </FieldSet>
  );
}

function SelectFilter({
  id,
  label,
  name,
  defaultValue,
  options,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id} className="text-xs">
        {label}
      </FieldLabel>
      <NativeSelect
        id={id}
        name={name}
        defaultValue={defaultValue}
        className="w-full"
      >
        {options.map(([value, optionLabel]) => (
          <NativeSelectOption key={value || "any"} value={value}>
            {optionLabel}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

function mergeSelected<T extends string>(available: T[], selected: T[]) {
  return [
    ...available,
    ...selected.filter((value) => !available.includes(value)),
  ];
}
