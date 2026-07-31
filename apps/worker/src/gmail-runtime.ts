import { prisma } from "@casero/database";
import type { GmailConnection } from "@casero/database/generated";
import { GmailMailboxClient, TokenCipher } from "@casero/gmail";

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
