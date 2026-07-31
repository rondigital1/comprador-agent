import { ConsentPurpose, JobType } from "@comprador/database/generated";
import { prisma } from "@comprador/database";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createGmailOAuthClient, createTokenCipher } from "@/lib/gmail-oauth";
import { GMAIL_OAUTH_STATE_COOKIE } from "@/lib/gmail-state";
import { serverEnv } from "@/lib/server-env";

export const runtime = "nodejs";

const settingsUrl = (request: Request, result: string) =>
  new URL(`/settings/integrations?gmail=${result}`, request.url);

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GMAIL_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(GMAIL_OAUTH_STATE_COOKIE);

  if (
    oauthError ||
    !code ||
    !returnedState ||
    returnedState !== expectedState
  ) {
    return NextResponse.redirect(settingsUrl(request, "denied"));
  }

  try {
    const oauth = createGmailOAuthClient();
    const tokens = await oauth.exchangeCode(code);
    const profile = await oauth.getProfile(tokens);
    const cipher = createTokenCipher();
    const existing = await prisma.gmailConnection.findUnique({
      where: { userId },
    });
    const refreshTokenCiphertext = tokens.refreshToken
      ? cipher.encrypt(tokens.refreshToken)
      : existing?.refreshTokenCiphertext;

    if (!refreshTokenCiphertext) {
      throw new Error("Google did not return an offline refresh token");
    }

    const connection = await prisma.gmailConnection.upsert({
      where: { userId },
      create: {
        userId,
        emailAddress: profile.emailAddress,
        accessTokenCiphertext: cipher.encrypt(tokens.accessToken),
        refreshTokenCiphertext,
        tokenExpiresAt: tokens.expiresAt,
        scopes: tokens.scopes,
        backfillQuery: serverEnv.gmailBackfillQuery,
        historyId: profile.historyId,
      },
      update: {
        status: "ACTIVE",
        emailAddress: profile.emailAddress,
        accessTokenCiphertext: cipher.encrypt(tokens.accessToken),
        refreshTokenCiphertext,
        tokenExpiresAt: tokens.expiresAt,
        scopes: tokens.scopes,
        backfillQuery: serverEnv.gmailBackfillQuery,
        historyId: profile.historyId,
        lastError: null,
      },
    });

    await prisma.$transaction([
      prisma.consentGrant.create({
        data: {
          userId,
          purpose: ConsentPurpose.GMAIL_PROMOTION_ANALYSIS,
          policyVersion: "gmail-personal-v1",
          metadata: {
            scopes: tokens.scopes,
            backfillQuery: serverEnv.gmailBackfillQuery,
          },
        },
      }),
      prisma.outboxJob.upsert({
        where: {
          idempotencyKey: `gmail-initial:${connection.id}:${connection.updatedAt.toISOString()}`,
        },
        create: {
          userId,
          type: JobType.GMAIL_INITIAL_SYNC,
          payload: { connectionId: connection.id },
          idempotencyKey: `gmail-initial:${connection.id}:${connection.updatedAt.toISOString()}`,
        },
        update: {},
      }),
    ]);
  } catch (error) {
    console.error("Gmail OAuth callback failed", error);
    return NextResponse.redirect(settingsUrl(request, "error"));
  }

  return NextResponse.redirect(settingsUrl(request, "connected"));
}
