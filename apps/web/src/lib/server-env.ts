const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const serverEnv = {
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
  get pubSubAudience() {
    return requireEnv("GMAIL_PUBSUB_AUDIENCE");
  },
  get pubSubServiceAccount() {
    return requireEnv("GMAIL_PUBSUB_SERVICE_ACCOUNT");
  },
  gmailBackfillQuery:
    process.env.GMAIL_BACKFILL_QUERY ?? "category:promotions newer_than:1y",
};
