-- Add normalized, multi-valued deal taxonomy with explicit provenance.
ALTER TABLE "Offer" ADD COLUMN "storeCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Offer" ADD COLUMN "itemCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Offer" ADD COLUMN "categoryConfidence" TEXT NOT NULL DEFAULT 'LOW';
ALTER TABLE "Offer" ADD COLUMN "categorySourceKind" TEXT NOT NULL DEFAULT 'EMAIL';
ALTER TABLE "Offer" ADD COLUMN "categorySourceUrl" TEXT;
ALTER TABLE "Offer" ADD COLUMN "categoryRationale" TEXT;
ALTER TABLE "Offer" ADD COLUMN "categoryModel" TEXT;

CREATE INDEX "Offer_storeCategories_idx" ON "Offer" USING GIN ("storeCategories");
CREATE INDEX "Offer_itemCategories_idx" ON "Offer" USING GIN ("itemCategories");

-- The extraction shape changed, but the deal fingerprint did not. Advancing
-- existing rows lets a reprocess update them instead of creating duplicates.
UPDATE "Offer"
SET "schemaVersion" = 'promotion-v4'
WHERE "schemaVersion" = 'promotion-v3';

-- Reprocess existing surfaced deals in the background so category filters do
-- not apply only to newly received mail. The worker refetches the original
-- Gmail message through the already-authorized read-only connection.
INSERT INTO "OutboxJob" (
  "id",
  "userId",
  "type",
  "status",
  "payload",
  "idempotencyKey",
  "attempts",
  "maxAttempts",
  "availableAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'category_' || md5(message."id"),
  message."userId",
  'GMAIL_PROCESS_MESSAGE',
  'PENDING',
  jsonb_build_object(
    'connectionId', message."connectionId",
    'gmailMessageId', message."gmailMessageId"
  ),
  'deal-category-v4:' || message."id",
  0,
  3,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "GmailMessage" AS message
INNER JOIN "GmailConnection" AS connection
  ON connection."id" = message."connectionId"
WHERE connection."status" = 'ACTIVE'
  AND EXISTS (
    SELECT 1 FROM "Offer" AS offer
    WHERE offer."gmailMessageId" = message."id"
  )
ON CONFLICT ("idempotencyKey") DO NOTHING;
