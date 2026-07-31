import { createHash } from "node:crypto";

import { evaluateDeal, OpenAiPromotionExtractor } from "@comprador/agent";
import {
  classifyMessageLocally,
  PROMOTION_SCHEMA_VERSION,
  type PromotionExtraction,
} from "@comprador/core";
import { prisma } from "@comprador/database";
import { AgentRunStatus, MessageStatus } from "@comprador/database/generated";

import { workerEnv } from "./env";
import { createMailboxClient } from "./gmail-runtime";

const parseDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const fingerprint = (extraction: PromotionExtraction) =>
  createHash("sha256")
    .update(
      [
        extraction.merchantName.toLowerCase(),
        extraction.headline.toLowerCase(),
        extraction.promoCode?.toLowerCase() ?? "",
        extraction.expiresAt ?? "",
      ].join("|"),
    )
    .digest("hex");

export async function processGmailMessage(input: {
  connectionId: string;
  gmailMessageId: string;
}) {
  const connection = await prisma.gmailConnection.findFirst({
    where: { id: input.connectionId, status: "ACTIVE" },
  });
  if (!connection) {
    throw new Error("Gmail connection is not active");
  }

  const storedMessage = await prisma.gmailMessage.findUniqueOrThrow({
    where: {
      connectionId_gmailMessageId: {
        connectionId: input.connectionId,
        gmailMessageId: input.gmailMessageId,
      },
    },
  });
  const message = await createMailboxClient(connection).getMessage(
    input.gmailMessageId,
  );
  const localDecision = classifyMessageLocally(message);

  await prisma.gmailMessage.update({
    where: { id: storedMessage.id },
    data: {
      threadId: message.threadId,
      historyId: message.historyId,
      sender: message.sender,
      subject: message.subject,
      snippet: message.snippet,
      receivedAt: message.receivedAt,
      status: localDecision.allowModel
        ? MessageStatus.PROCESSING
        : MessageStatus.DISCARDED,
      discardReason: localDecision.allowModel ? null : localDecision.category,
      processedAt: localDecision.allowModel ? null : new Date(),
    },
  });

  if (!localDecision.allowModel) {
    return;
  }

  const agentRun = await prisma.agentRun.create({
    data: {
      userId: connection.userId,
      kind: "promotion-email",
      status: AgentRunStatus.RUNNING,
      schemaVersion: PROMOTION_SCHEMA_VERSION,
      inputReference: storedMessage.id,
      startedAt: new Date(),
    },
  });

  try {
    const result = await evaluateDeal(
      new OpenAiPromotionExtractor({ apiKey: workerEnv.openAiApiKey }),
      { message },
      async (extraction) => {
        const [offers, intents] = await Promise.all([
          prisma.offer.findMany({
            where: {
              userId: connection.userId,
              merchantName: {
                equals: extraction.merchantName,
                mode: "insensitive",
              },
              discountPercent: { not: null },
            },
            select: { discountPercent: true },
            orderBy: { createdAt: "desc" },
            take: 100,
          }),
          prisma.shoppingIntent.findMany({
            where: { userId: connection.userId, active: true },
            select: { id: true, name: true, query: true },
          }),
        ]);
        return {
          comparableDiscounts: offers.flatMap((offer) =>
            offer.discountPercent ? [offer.discountPercent.toNumber()] : [],
          ),
          intents,
        };
      },
    );

    if (!result.extraction.isPromotion || !result.evaluation) {
      await prisma.$transaction([
        prisma.gmailMessage.update({
          where: { id: storedMessage.id },
          data: {
            status: MessageStatus.DISCARDED,
            discardReason: result.extraction.sensitivity,
            processedAt: new Date(),
          },
        }),
        prisma.agentRun.update({
          where: { id: agentRun.id },
          data: {
            status: AgentRunStatus.COMPLETED,
            model: result.model,
            completedAt: new Date(),
          },
        }),
      ]);
      return;
    }

    const offer = await prisma.offer.upsert({
      where: {
        gmailMessageId_fingerprint_schemaVersion: {
          gmailMessageId: storedMessage.id,
          fingerprint: fingerprint(result.extraction),
          schemaVersion: PROMOTION_SCHEMA_VERSION,
        },
      },
      create: {
        userId: connection.userId,
        gmailMessageId: storedMessage.id,
        fingerprint: fingerprint(result.extraction),
        schemaVersion: PROMOTION_SCHEMA_VERSION,
        merchantName: result.extraction.merchantName,
        headline: result.extraction.headline,
        summary: result.extraction.summary,
        promoCode: result.extraction.promoCode,
        currency: result.extraction.currency,
        discountPercent: result.extraction.discountPercent,
        discountAmountMinor: result.extraction.discountAmountMinor,
        minimumSpendMinor: result.extraction.minimumSpendMinor,
        startsAt: parseDate(result.extraction.startsAt),
        expiresAt: parseDate(result.extraction.expiresAt),
        strength: result.evaluation.strength,
        purchaseFit: result.evaluation.purchaseFit,
        comparableCount: result.evaluation.comparableCount,
        score: result.evaluation.score,
        explanation: result.evaluation.explanation,
      },
      update: {
        score: result.evaluation.score,
        strength: result.evaluation.strength,
        purchaseFit: result.evaluation.purchaseFit,
        comparableCount: result.evaluation.comparableCount,
        explanation: result.evaluation.explanation,
      },
    });

    await prisma.$transaction([
      prisma.evidence.deleteMany({ where: { offerId: offer.id } }),
      prisma.evidence.createMany({
        data: result.extraction.evidence.map((claim) => ({
          offerId: offer.id,
          claimPath: claim.claimPath,
          redactedExcerpt: claim.excerpt,
          excerptHash: createHash("sha256").update(claim.excerpt).digest("hex"),
          sourceKind: "gmail",
          observedAt: message.receivedAt ?? new Date(),
        })),
      }),
      prisma.gmailMessage.update({
        where: { id: storedMessage.id },
        data: { status: MessageStatus.PROCESSED, processedAt: new Date() },
      }),
      prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: AgentRunStatus.COMPLETED,
          model: result.model,
          completedAt: new Date(),
        },
      }),
    ]);
  } catch (error) {
    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: AgentRunStatus.FAILED,
        error:
          error instanceof Error
            ? error.message.slice(0, 1_000)
            : String(error),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
