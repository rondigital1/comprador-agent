import { describe, expect, it } from "vitest";

import {
  buildPromotionModelPayload,
  classifyMessageLocally,
  type LocalMessageInput,
} from "./sensitive-filter";

const message = (bodyText: string): LocalMessageInput => ({
  sender: "offers@example.com",
  subject: "This week's offers",
  snippet: "New promotions",
  bodyText,
});

describe("promotion model privacy boundary", () => {
  it("checks sensitive text anywhere in the exact model payload", () => {
    const input = message(`${"sale ".repeat(3_000)}verification code: 123456`);

    expect(buildPromotionModelPayload(input)).toContain("verification code");
    expect(classifyMessageLocally(input)).toEqual({
      allowModel: false,
      category: "security",
    });
  });

  it("does not inspect body text beyond the model payload limit", () => {
    const input = message(`${"x".repeat(40_000)}verification code: 123456`);
    const payload = buildPromotionModelPayload(input);

    expect(payload).not.toContain("verification code");
    expect(classifyMessageLocally(input)).toEqual({ allowModel: true });
  });
});
