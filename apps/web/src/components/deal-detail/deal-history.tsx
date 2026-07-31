import { HistoryIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { formatDate, strengthLabels } from "./deal-format";

type HistoryOffer = {
  id: string;
  headline: string;
  discountPercent: { toNumber(): number } | null;
  strength: string;
  createdAt: Date;
};

export function DealHistory({
  currentHeadline,
  currentObservedAt,
  strength,
  history,
}: {
  currentHeadline: string;
  currentObservedAt: Date;
  strength: string;
  history: HistoryOffer[];
}) {
  const lastSimilar = history.find(
    (offer) =>
      offer.headline.toLocaleLowerCase() ===
      currentHeadline.toLocaleLowerCase(),
  );
  const monthsSinceSimilar = lastSimilar
    ? Math.floor(
        (currentObservedAt.getTime() - lastSimilar.createdAt.getTime()) /
          2_629_800_000,
      )
    : null;
  const context =
    strength === "ROUTINE"
      ? "This resembles the merchant's recurring promotion pattern. The deadline alone does not make it unusual."
      : lastSimilar
        ? `A closely matching headline last appeared ${monthsSinceSimilar ?? 0} month${monthsSinceSimilar === 1 ? "" : "s"} ago.`
        : history.length > 0
          ? "No matching headline appears in the retained merchant history."
          : "This is the first retained offer from this merchant, so uniqueness is not established yet.";

  return (
    <section
      aria-labelledby="history-title"
      className="scroll-mt-24 border-t pt-10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Observed history
          </p>
          <h2
            id="history-title"
            className="mt-2 font-heading text-3xl font-semibold tracking-tight"
          >
            Is this actually unusual?
          </h2>
        </div>
        <Badge variant={strength === "ROUTINE" ? "secondary" : "outline"}>
          <HistoryIcon data-icon="inline-start" />
          {strengthLabels[strength] ?? strength}
        </Badge>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
        {context}
      </p>

      {history.length > 0 ? (
        <ol className="mt-7 border-l">
          {history.slice(0, 5).map((offer) => (
            <li
              key={offer.id}
              className="relative grid gap-1 border-b py-4 pl-6 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
            >
              <span className="absolute top-6 -left-1 size-2 rounded-full bg-foreground" />
              <time className="text-xs text-muted-foreground">
                {formatDate(offer.createdAt)}
              </time>
              <span className="text-sm font-medium">{offer.headline}</span>
              <span className="text-xs text-muted-foreground">
                {offer.discountPercent
                  ? `${offer.discountPercent.toNumber()}% off`
                  : "Promotion"}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
