import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class TokenCipher {
  readonly #key: Buffer;

  constructor(encodedKey: string) {
    const key = Buffer.from(encodedKey, "base64");
    if (key.length !== 32) {
      throw new Error(
        "TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64",
      );
    }
    this.#key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv("aes-256-gcm", this.#key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [VERSION, iv, tag, encrypted]
      .map((part) =>
        typeof part === "string" ? part : part.toString("base64url"),
      )
      .join(".");
  }

  decrypt(ciphertext: string): string {
    const [version, ivValue, tagValue, encryptedValue] = ciphertext.split(".");
    if (version !== VERSION || !ivValue || !tagValue || !encryptedValue) {
      throw new Error("Unsupported encrypted token format");
    }

    const iv = Buffer.from(ivValue, "base64url");
    const tag = Buffer.from(tagValue, "base64url");
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      throw new Error("Invalid encrypted token");
    }

    const decipher = createDecipheriv("aes-256-gcm", this.#key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }
}
