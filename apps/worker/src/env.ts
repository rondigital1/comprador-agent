import { fileURLToPath } from "node:url";

import { config } from "dotenv";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const workerEnv = {
  get googleClientId() {
    return requireEnv("AUTH_GOOGLE_ID");
  },
  get googleClientSecret() {
    return requireEnv("AUTH_GOOGLE_SECRET");
  },
  get gmailRedirectUri() {
    return requireEnv("GOOGLE_GMAIL_REDIRECT_URI");
  },
  get tokenEncryptionKey() {
    return requireEnv("TOKEN_ENCRYPTION_KEY");
  },
  get openAiApiKey() {
    return requireEnv("OPENAI_API_KEY");
  },
  get pubSubTopic() {
    return process.env.GMAIL_PUBSUB_TOPIC || null;
  },
  id: process.env.WORKER_ID ?? `worker-${process.pid}`,
  pollMs: Number(process.env.WORKER_POLL_MS ?? 2_000),
  gmailPollMs: Number(process.env.GMAIL_POLL_MS ?? 300_000),
};
