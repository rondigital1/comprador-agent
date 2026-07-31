"use client";

import { LoaderCircleIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import {
  archiveShoppingItem,
  refreshShoppingItem,
  setShoppingWatch,
} from "@/app/(dashboard)/watchlist/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

export function WatchControl({
  intentId,
  enabled,
}: {
  intentId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [pending, startTransition] = useTransition();
  const id = `watch-${intentId}`;

  return (
    <Field orientation="horizontal" className="max-w-sm">
      <FieldContent>
        <FieldLabel htmlFor={id}>Watch daily</FieldLabel>
        <FieldDescription>
          {checked ? "Checking again every 24 hours" : "One-time research only"}
        </FieldDescription>
      </FieldContent>
      <Switch
        id={id}
        checked={checked}
        disabled={pending}
        onCheckedChange={(next) => {
          setChecked(next);
          startTransition(async () => {
            try {
              await setShoppingWatch(intentId, next);
              router.refresh();
            } catch {
              setChecked(!next);
            }
          });
        }}
        aria-label="Watch this item daily"
      />
    </Field>
  );
}

export function ItemButtons({
  intentId,
  researchActive,
}: {
  intentId: string;
  researchActive: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={refreshShoppingItem.bind(null, intentId)}>
        <RefreshButton disabled={researchActive} />
      </form>
      <form action={archiveShoppingItem.bind(null, intentId)}>
        <ArchiveButton />
      </form>
    </div>
  );
}

function RefreshButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={disabled || pending}
    >
      {pending ? (
        <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
      ) : (
        <RefreshCwIcon data-icon="inline-start" />
      )}
      {pending ? "Queuing…" : "Check again"}
    </Button>
  );
}

function ArchiveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      <Trash2Icon data-icon="inline-start" />
      Remove
    </Button>
  );
}
