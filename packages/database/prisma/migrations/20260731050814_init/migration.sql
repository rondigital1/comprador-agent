-- CreateEnum
CREATE TYPE "GmailConnectionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'REAUTH_REQUIRED', 'DISCONNECTING');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('GMAIL_PROMOTION_ANALYSIS', 'DEAL_NOTIFICATION');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('GMAIL_INITIAL_SYNC', 'GMAIL_INCREMENTAL_SYNC', 'GMAIL_PROCESS_MESSAGE', 'GMAIL_RENEW_WATCH', 'GMAIL_DISCONNECT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'RETRY', 'DEAD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'DISCARDED', 'FAILED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DISMISSED', 'SAVED');

-- CreateEnum
CREATE TYPE "PromotionStrength" AS ENUM ('INSUFFICIENT_HISTORY', 'ROUTINE', 'STRONG', 'BEST_OBSERVED');

-- CreateEnum
CREATE TYPE "PurchaseFit" AS ENUM ('NO_ACTIVE_INTENT', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "GmailConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "status" "GmailConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "accessTokenCiphertext" TEXT NOT NULL,
    "refreshTokenCiphertext" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "labelIds" TEXT[] DEFAULT ARRAY['CATEGORY_PROMOTIONS']::TEXT[],
    "backfillQuery" TEXT NOT NULL,
    "historyId" TEXT,
    "watchExpiration" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "ConsentGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GmailMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "threadId" TEXT,
    "historyId" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "sender" TEXT,
    "subject" TEXT,
    "snippet" TEXT,
    "receivedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "discardReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "promoCode" TEXT,
    "currency" TEXT,
    "discountPercent" DECIMAL(5,2),
    "discountAmountMinor" INTEGER,
    "minimumSpendMinor" INTEGER,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "strength" "PromotionStrength" NOT NULL DEFAULT 'INSUFFICIENT_HISTORY',
    "purchaseFit" "PurchaseFit" NOT NULL DEFAULT 'NO_ACTIVE_INTENT',
    "comparableCount" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "claimPath" TEXT NOT NULL,
    "redactedExcerpt" TEXT NOT NULL,
    "excerptHash" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "category" TEXT,
    "maxPriceMinor" INTEGER,
    "currency" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferMatch" (
    "offerId" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "fit" "PurchaseFit" NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferMatch_pkey" PRIMARY KEY ("offerId","intentId")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT,
    "schemaVersion" TEXT NOT NULL,
    "inputReference" TEXT NOT NULL,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GmailConnection_userId_key" ON "GmailConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GmailConnection_emailAddress_key" ON "GmailConnection"("emailAddress");

-- CreateIndex
CREATE INDEX "ConsentGrant_userId_purpose_revokedAt_idx" ON "ConsentGrant"("userId", "purpose", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxJob_idempotencyKey_key" ON "OutboxJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OutboxJob_status_availableAt_idx" ON "OutboxJob"("status", "availableAt");

-- CreateIndex
CREATE INDEX "OutboxJob_userId_type_idx" ON "OutboxJob"("userId", "type");

-- CreateIndex
CREATE INDEX "GmailMessage_userId_status_receivedAt_idx" ON "GmailMessage"("userId", "status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GmailMessage_connectionId_gmailMessageId_key" ON "GmailMessage"("connectionId", "gmailMessageId");

-- CreateIndex
CREATE INDEX "Offer_userId_status_score_idx" ON "Offer"("userId", "status", "score");

-- CreateIndex
CREATE INDEX "Offer_userId_merchantName_createdAt_idx" ON "Offer"("userId", "merchantName", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_gmailMessageId_fingerprint_schemaVersion_key" ON "Offer"("gmailMessageId", "fingerprint", "schemaVersion");

-- CreateIndex
CREATE INDEX "Evidence_offerId_claimPath_idx" ON "Evidence"("offerId", "claimPath");

-- CreateIndex
CREATE INDEX "ShoppingIntent_userId_active_idx" ON "ShoppingIntent"("userId", "active");

-- CreateIndex
CREATE INDEX "AgentRun_userId_status_createdAt_idx" ON "AgentRun"("userId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentGrant" ADD CONSTRAINT "ConsentGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxJob" ADD CONSTRAINT "OutboxJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailMessage" ADD CONSTRAINT "GmailMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailMessage" ADD CONSTRAINT "GmailMessage_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GmailConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_gmailMessageId_fkey" FOREIGN KEY ("gmailMessageId") REFERENCES "GmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingIntent" ADD CONSTRAINT "ShoppingIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferMatch" ADD CONSTRAINT "OfferMatch_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferMatch" ADD CONSTRAINT "OfferMatch_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "ShoppingIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
