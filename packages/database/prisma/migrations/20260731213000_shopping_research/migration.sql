-- Add the durable shopping-research job and item-level monitoring state.
ALTER TYPE "JobType" ADD VALUE 'SHOPPING_INTENT_RESEARCH';

CREATE TYPE "ShoppingResearchStatus" AS ENUM ('IDLE', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "ShoppingDealAvailability" AS ENUM ('IN_STOCK', 'LIMITED', 'UNKNOWN');
CREATE TYPE "ShoppingDealMatch" AS ENUM ('EXACT', 'CLOSE', 'ALTERNATIVE');

ALTER TABLE "ShoppingIntent" ADD COLUMN "watchEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ShoppingIntent" ADD COLUMN "researchStatus" "ShoppingResearchStatus" NOT NULL DEFAULT 'IDLE';
ALTER TABLE "ShoppingIntent" ADD COLUMN "lastResearchedAt" TIMESTAMP(3);
ALTER TABLE "ShoppingIntent" ADD COLUMN "nextCheckAt" TIMESTAMP(3);
ALTER TABLE "ShoppingIntent" ADD COLUMN "researchSummary" TEXT;
ALTER TABLE "ShoppingIntent" ADD COLUMN "lastError" TEXT;

CREATE TABLE "ShoppingDeal" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "listPriceMinor" INTEGER,
    "shippingCostMinor" INTEGER,
    "currency" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "membershipRequired" BOOLEAN NOT NULL DEFAULT false,
    "membershipProgram" TEXT,
    "availability" "ShoppingDealAvailability" NOT NULL DEFAULT 'UNKNOWN',
    "matchQuality" "ShoppingDealMatch" NOT NULL DEFAULT 'EXACT',
    "score" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingDeal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShoppingIntent_watchEnabled_nextCheckAt_idx" ON "ShoppingIntent"("watchEnabled", "nextCheckAt");
CREATE UNIQUE INDEX "ShoppingDeal_intentId_url_key" ON "ShoppingDeal"("intentId", "url");
CREATE INDEX "ShoppingDeal_intentId_active_score_idx" ON "ShoppingDeal"("intentId", "active", "score");

ALTER TABLE "ShoppingDeal" ADD CONSTRAINT "ShoppingDeal_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "ShoppingIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
