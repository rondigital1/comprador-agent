import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { normalizeGmailMessage } from "./message";
import { TokenCipher } from "./token-cipher";

describe("TokenCipher", () => {
  it("round-trips a token without storing plaintext", () => {
    const cipher = new TokenCipher(randomBytes(32).toString("base64"));
    const encrypted = cipher.encrypt("refresh-token");

    expect(encrypted).not.toContain("refresh-token");
    expect(cipher.decrypt(encrypted)).toBe("refresh-token");
  });
});

describe("normalizeGmailMessage", () => {
  it("extracts headers and plain text", () => {
    const message = normalizeGmailMessage({
      id: "message-1",
      threadId: "thread-1",
      internalDate: "1000",
      payload: {
        mimeType: "text/plain",
        headers: [
          { name: "From", value: "Store <deals@example.com>" },
          { name: "Subject", value: "20% off" },
        ],
        body: {
          data: Buffer.from("Use code SAVE20").toString("base64url"),
        },
      },
    });

    expect(message.subject).toBe("20% off");
    expect(message.bodyText).toBe("Use code SAVE20");
    expect(message.images).toEqual([]);
  });

  it("retains supported embedded email images without exposing remote trackers", () => {
    const imageBytes = Buffer.from("email-image");
    const message = normalizeGmailMessage({
      id: "message-2",
      payload: {
        mimeType: "multipart/related",
        parts: [
          {
            mimeType: "text/html",
            body: {
              data: Buffer.from('<img src="cid:hero">Offer').toString(
                "base64url",
              ),
            },
          },
          {
            mimeType: "image/png",
            filename: "hero.png",
            headers: [{ name: "Content-ID", value: "<hero>" }],
            body: {
              data: imageBytes.toString("base64url"),
              size: imageBytes.byteLength,
            },
          },
        ],
      },
    });

    expect(message.images).toHaveLength(1);
    expect(message.images[0]).toMatchObject({
      contentId: "hero",
      filename: "hero.png",
      mimeType: "image/png",
    });
    expect(message.images[0]?.data).toEqual(imageBytes);
  });
});
