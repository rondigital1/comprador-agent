-- Add the durable deep-analysis job type and status.
ALTER TYPE "JobType" ADD VALUE 'DEAL_DEEP_ANALYSIS';

CREATE TYPE "DealAnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- Normalize coupons so every offer can retain multiple independently copyable codes.
CREATE TABLE "OfferCoupon" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "sourceKind" TEXT NOT NULL DEFAULT 'email',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferCoupon_pkey" PRIMARY KEY ("id")
);

INSERT INTO "OfferCoupon" ("id", "offerId", "code", "sourceKind")
SELECT 'legacy_' || "id", "id", "promoCode", 'email'
FROM "Offer"
WHERE "promoCode" IS NOT NULL;

ALTER TABLE "Offer" DROP COLUMN "promoCode";
ALTER TABLE "Offer" ADD COLUMN "discountKind" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "Offer" ADD COLUMN "exclusions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX "OfferCoupon_offerId_code_key" ON "OfferCoupon"("offerId", "code");
CREATE INDEX "OfferCoupon_offerId_idx" ON "OfferCoupon"("offerId");
ALTER TABLE "OfferCoupon" ADD CONSTRAINT "OfferCoupon_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Retain safe embedded email images; remote tracking images are intentionally excluded.
CREATE TABLE "EmailImage" (
    "id" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "contentId" TEXT,
    "filename" TEXT,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isLikelyLogo" BOOLEAN NOT NULL DEFAULT false,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailImage_gmailMessageId_sha256_key" ON "EmailImage"("gmailMessageId", "sha256");
CREATE INDEX "EmailImage_gmailMessageId_isLikelyLogo_position_idx" ON "EmailImage"("gmailMessageId", "isLikelyLogo", "position");
ALTER TABLE "EmailImage" ADD CONSTRAINT "EmailImage_gmailMessageId_fkey" FOREIGN KEY ("gmailMessageId") REFERENCES "GmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DealAnalysis" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" "DealAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT,
    "result" JSONB,
    "sources" JSONB,
    "error" TEXT,
    "asOf" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DealAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DealAnalysis_offerId_createdAt_idx" ON "DealAnalysis"("offerId", "createdAt");
CREATE INDEX "DealAnalysis_status_createdAt_idx" ON "DealAnalysis"("status", "createdAt");
ALTER TABLE "DealAnalysis" ADD CONSTRAINT "DealAnalysis_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
