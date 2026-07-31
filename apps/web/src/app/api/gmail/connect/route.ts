import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createGmailOAuthClient } from "@/lib/gmail-oauth";
import { GMAIL_OAUTH_STATE_COOKIE } from "@/lib/gmail-state";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(GMAIL_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const authorizationUrl = createGmailOAuthClient().createAuthorizationUrl({
    state,
    loginHint: session.user.email ?? undefined,
  });
  return NextResponse.redirect(authorizationUrl);
}
