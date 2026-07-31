import { GmailOAuthClient, TokenCipher } from "@comprador/gmail";

import { serverEnv } from "./server-env";

export const createGmailOAuthClient = () =>
  new GmailOAuthClient({
    clientId: serverEnv.googleClientId,
    clientSecret: serverEnv.googleClientSecret,
    redirectUri: serverEnv.gmailRedirectUri,
  });

export const createTokenCipher = () =>
  new TokenCipher(serverEnv.tokenEncryptionKey);
