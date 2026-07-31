import { google, type gmail_v1 } from "googleapis";

import { DEFAULT_GMAIL_LABELS } from "./config";
import { normalizeGmailMessage } from "./message";

export type StoredGmailCredentials = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
};

export class GmailHistoryExpiredError extends Error {
  constructor() {
    super("The Gmail history cursor expired; a full sync is required");
    this.name = "GmailHistoryExpiredError";
  }
}

const isHttp404 = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === 404;

export class GmailMailboxClient {
  readonly #gmail: gmail_v1.Gmail;

  constructor(
    credentials: StoredGmailCredentials,
    onTokens?: (tokens: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date;
    }) => Promise<void> | void,
  ) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken ?? undefined,
      expiry_date: credentials.expiresAt?.getTime(),
      scope: credentials.scopes.join(" "),
    });
    auth.on("tokens", (tokens) => {
      void onTokens?.({
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
      });
    });
    this.#gmail = google.gmail({ version: "v1", auth });
  }

  async getProfile() {
    const response = await this.#gmail.users.getProfile({ userId: "me" });
    return {
      emailAddress: response.data.emailAddress ?? null,
      historyId: response.data.historyId ?? null,
    };
  }

  async listMessageIds(query: string, limit = 250): Promise<string[]> {
    const ids: string[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.#gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: Math.min(100, limit - ids.length),
        pageToken,
      });
      ids.push(
        ...(response.data.messages ?? [])
          .map((message) => message.id)
          .filter((id): id is string => Boolean(id)),
      );
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken && ids.length < limit);

    return ids.slice(0, limit);
  }

  async getMessage(messageId: string) {
    const response = await this.#gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
    return normalizeGmailMessage(response.data);
  }

  async listAddedMessageIds(input: {
    startHistoryId: string;
    labelId?: string;
  }) {
    const ids = new Set<string>();
    let latestHistoryId = input.startHistoryId;
    let pageToken: string | undefined;

    try {
      do {
        const response = await this.#gmail.users.history.list({
          userId: "me",
          startHistoryId: input.startHistoryId,
          historyTypes: ["messageAdded"],
          labelId: input.labelId,
          maxResults: 500,
          pageToken,
        });
        for (const history of response.data.history ?? []) {
          latestHistoryId = history.id ?? latestHistoryId;
          for (const added of history.messagesAdded ?? []) {
            if (added.message?.id) {
              ids.add(added.message.id);
            }
          }
        }
        latestHistoryId = response.data.historyId ?? latestHistoryId;
        pageToken = response.data.nextPageToken ?? undefined;
      } while (pageToken);
    } catch (error) {
      if (isHttp404(error)) {
        throw new GmailHistoryExpiredError();
      }
      throw error;
    }

    return { messageIds: [...ids], latestHistoryId };
  }

  async startWatch(topicName: string, labelIds = DEFAULT_GMAIL_LABELS) {
    const response = await this.#gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName,
        labelIds,
        labelFilterBehavior: "INCLUDE",
      },
    });
    return {
      historyId: response.data.historyId ?? null,
      expiration: response.data.expiration
        ? new Date(Number(response.data.expiration))
        : null,
    };
  }

  async stopWatch(): Promise<void> {
    await this.#gmail.users.stop({ userId: "me" });
  }
}
