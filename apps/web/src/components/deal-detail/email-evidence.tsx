import { ExternalLinkIcon, ImageIcon, MailIcon, QuoteIcon } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

export function EmailEvidence({
  merchantName,
  gmailMessageId,
  sender,
  subject,
  receivedAt,
  images,
  evidence,
}: {
  merchantName: string;
  gmailMessageId: string;
  sender: string | null;
  subject: string | null;
  receivedAt: Date | null;
  images: Array<{ id: string; filename: string | null }>;
  evidence: Array<{ id: string; claimPath: string; redactedExcerpt: string }>;
}) {
  return (
    <section
      aria-labelledby="source-title"
      className="scroll-mt-24 border-t pt-10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Source record
          </p>
          <h2
            id="source-title"
            className="mt-2 font-heading text-3xl font-semibold tracking-tight"
          >
            From the original email
          </h2>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://mail.google.com/mail/u/0/#all/${gmailMessageId}`}
            target="_blank"
            rel="noreferrer"
          >
            <MailIcon data-icon="inline-start" />
            Open in Gmail
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        </Button>
      </div>

      <dl className="mt-7 grid gap-5 border-y py-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">From</dt>
          <dd className="mt-1 truncate font-medium">
            {sender ?? merchantName}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Subject</dt>
          <dd className="mt-1 font-medium">{subject ?? "Promotion email"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Received</dt>
          <dd className="mt-1 font-medium">
            {receivedAt?.toLocaleString() ?? "Unknown"}
          </dd>
        </div>
      </dl>

      {images.length > 0 ? (
        <div className="mt-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ImageIcon aria-hidden="true" className="size-4" />
            Embedded email artwork
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-[16/10] overflow-hidden border bg-muted"
              >
                <Image
                  src={`/api/deal-images/${image.id}`}
                  alt={
                    image.filename ??
                    `Artwork included in the ${merchantName} email`
                  }
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 40vw"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {evidence.length > 0 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {evidence.map((claim) => (
            <blockquote key={claim.id} className="border-l-2 py-1 pl-4">
              <QuoteIcon
                aria-hidden="true"
                className="mb-2 size-4 text-muted-foreground"
              />
              <p className="text-sm leading-6">“{claim.redactedExcerpt}”</p>
              <cite className="mt-2 block text-xs not-italic text-muted-foreground">
                Supports {claim.claimPath}
              </cite>
            </blockquote>
          ))}
        </div>
      ) : null}
    </section>
  );
}
