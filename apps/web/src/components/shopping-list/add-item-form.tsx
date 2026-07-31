"use client";

import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import {
  addShoppingItem,
  type AddItemState,
} from "@/app/(dashboard)/watchlist/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: AddItemState = { status: "idle", message: "" };

export function AddItemForm() {
  const [state, formAction, pending] = useActionState(
    addShoppingItem,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="border-y py-6">
      <FieldGroup className="gap-4 sm:grid sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-start">
        <Field data-invalid={Boolean(state.errors?.query)}>
          <FieldLabel htmlFor="shopping-query">What do you need?</FieldLabel>
          <Input
            id="shopping-query"
            name="query"
            placeholder="e.g. cordless vacuum for pet hair"
            autoComplete="off"
            aria-invalid={Boolean(state.errors?.query)}
            required
          />
          <FieldDescription>
            Add a product, household need, or specific model.
          </FieldDescription>
          <FieldError
            errors={state.errors?.query?.map((message) => ({ message }))}
          />
        </Field>
        <Field data-invalid={Boolean(state.errors?.maxPrice)}>
          <FieldLabel htmlFor="shopping-budget">Budget (optional)</FieldLabel>
          <Input
            id="shopping-budget"
            name="maxPrice"
            inputMode="decimal"
            placeholder="$300"
            aria-invalid={Boolean(state.errors?.maxPrice)}
          />
          <FieldDescription>USD maximum</FieldDescription>
          <FieldError
            errors={state.errors?.maxPrice?.map((message) => ({ message }))}
          />
        </Field>
        <Button type="submit" size="lg" className="sm:mt-6" disabled={pending}>
          {pending ? (
            <LoaderCircleIcon
              data-icon="inline-start"
              className="animate-spin"
            />
          ) : (
            <PlusIcon data-icon="inline-start" />
          )}
          {pending ? "Starting…" : "Add & research"}
        </Button>
      </FieldGroup>
      <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
        {state.message}
      </p>
    </form>
  );
}
