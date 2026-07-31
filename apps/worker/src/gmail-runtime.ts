import { prisma } from "@comprador/database";
import type { GmailConnection } from "@comprador/database/generated";
import { GmailMailboxClient, TokenCipher } from "@comprador/gmail";

import { workerEnv } from "./env";

export function createMailboxClient(connection: GmailConnection) {
  const cipher = new TokenCipher(workerEnv.tokenEncryptionKey);

  return new GmailMailboxClient(
    {
      accessToken: cipher.decrypt(connection.accessTokenCiphertext),
      refreshToken: connection.refreshTokenCiphertext
        ? cipher.decrypt(connection.refreshTokenCiphertext)
        : null,
      expiresAt: connection.tokenExpiresAt,
      scopes: connection.scopes,
    },
    async (tokens) => {
      await prisma.gmailConnection.updateMany({
        where: { id: connection.id, status: "ACTIVE" },
        data: {
          accessTokenCiphertext: tokens.accessToken
            ? cipher.encrypt(tokens.accessToken)
            : undefined,
          refreshTokenCiphertext: tokens.refreshToken
            ? cipher.encrypt(tokens.refreshToken)
            : undefined,
          tokenExpiresAt: tokens.expiresAt,
        },
      });
    },
  );
}
