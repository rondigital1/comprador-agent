import { CreditCardIcon, ListChecksIcon } from "lucide-react";
import type { Metadata } from "next";

import { AddItemForm } from "@/components/shopping-list/add-item-form";
import { ShoppingResearchRefresh } from "@/components/shopping-list/auto-refresh";
import { ShoppingItemRow } from "@/components/shopping-list/item-row";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getShoppingList } from "@/data/shopping-list";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Shopping List",
};

export default async function ShoppingListPage() {
  const userId = await requireUserId();
  const items = await getShoppingList(userId);
  const activeResearch = items.some((item) =>
    ["PENDING", "RUNNING"].includes(item.researchStatus),
  );
  const watched = items.filter((item) => item.watchEnabled).length;
  const withDeals = items.filter((item) => item.deals.length > 0).length;

  return (
    <div className="flex flex-col gap-8">
      <ShoppingResearchRefresh active={activeResearch} />
      <header>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Shopping list
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Things you plan to buy
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Add anything you need. Casero checks the market once now, then keeps
          looking daily for the items you choose to watch.
        </p>
      </header>

      <AddItemForm />

      {items.length > 0 ? (
        <section aria-labelledby="ranked-items-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Priority queue
              </p>
              <h2
                id="ranked-items-heading"
                className="mt-1 font-heading text-2xl font-semibold"
              >
                Best opportunities first
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"} · {watched}{" "}
              watched · {withDeals} with deals
            </p>
          </div>
          <ol className="mt-5 border-t">
            {items.map((item, index) => (
              <ShoppingItemRow key={item.id} item={item} rank={index + 1} />
            ))}
          </ol>
        </section>
      ) : (
        <Empty className="min-h-72 border-y">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecksIcon />
            </EmptyMedia>
            <EmptyTitle>Your buying queue is empty</EmptyTitle>
            <EmptyDescription>
              Start with a specific product or a practical need. The first
              market check begins as soon as you add it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Alert>
        <CreditCardIcon aria-hidden="true" />
        <AlertTitle>Membership prices are never assumed</AlertTitle>
        <AlertDescription>
          Casero labels membership-only offers and ranks usable public prices
          first. Store membership preferences will later make this personal.
        </AlertDescription>
      </Alert>
    </div>
  );
}
