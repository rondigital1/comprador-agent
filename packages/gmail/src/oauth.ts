import { google, type Auth } from "googleapis";

import { GMAIL_READONLY_SCOPE } from "./config";

export type GmailOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GmailTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
};

export class GmailOAuthClient {
  readonly #client: Auth.OAuth2Client;

  constructor(config: GmailOAuthConfig) {
    this.#client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );
  }

  createAuthorizationUrl(input: { state: string; loginHint?: string }): string {
    return this.#client.generateAuthUrl({
      access_type: "offline",
      include_granted_scopes: true,
      login_hint: input.loginHint,
      prompt: "consent",
      scope: [GMAIL_READONLY_SCOPE],
      state: input.state,
    });
  }

  async exchangeCode(code: string): Promise<GmailTokenSet> {
    const { tokens } = await this.#client.getToken(code);
    if (!tokens.access_token) {
      throw new Error("Google did not return a Gmail access token");
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: tokens.scope?.split(" ").filter(Boolean) ?? [
        GMAIL_READONLY_SCOPE,
      ],
    };
  }

  async getProfile(tokens: GmailTokenSet) {
    this.#client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken ?? undefined,
      expiry_date: tokens.expiresAt?.getTime(),
      scope: tokens.scopes.join(" "),
    });
    const gmail = google.gmail({ version: "v1", auth: this.#client });
    const response = await gmail.users.getProfile({ userId: "me" });

    if (!response.data.emailAddress) {
      throw new Error("Google did not return the connected Gmail address");
    }

    return {
      emailAddress: response.data.emailAddress,
      historyId: response.data.historyId ?? null,
    };
  }

  async revoke(token: string): Promise<void> {
    await this.#client.revokeToken(token);
  }
}
