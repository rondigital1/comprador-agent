export type LocalMessageInput = {
  subject: string;
  sender: string;
  snippet: string;
  bodyText: string;
};

const MODEL_INPUT_LIMITS = {
  sender: 1_000,
  subject: 1_000,
  snippet: 2_000,
  bodyText: 40_000,
} as const;

export type LocalMessageDecision =
  | { allowModel: true }
  | {
      allowModel: false;
      category:
        "security" | "transactional" | "financial" | "unknown-sensitive";
    };

const SECURITY_PATTERNS = [
  /\bpassword reset\b/i,
  /\bsecurity (?:alert|code|notice)\b/i,
  /\bverification code\b/i,
  /\bone[- ]time (?:code|password)\b/i,
  /\bnew sign[- ]in\b/i,
  /\bsuspicious activity\b/i,
  /\bconfirm your (?:identity|email)\b/i,
];

const TRANSACTIONAL_PATTERNS = [
  /\border (?:confirmation|number|update)\b/i,
  /\bthanks for your (?:order|purchase)\b/i,
  /\byour (?:order|package) (?:has shipped|was delivered)\b/i,
  /\btracking number\b/i,
  /\breturn (?:approved|received)\b/i,
  /\brefund (?:issued|processed)\b/i,
  /\breceipt\b/i,
];

const FINANCIAL_PATTERNS = [
  /\baccount statement\b/i,
  /\bpayment (?:received|due|failed)\b/i,
  /\binvoice\b/i,
  /\bgift card (?:number|balance|code)\b/i,
  /\bcredit card\b/i,
];

const matchesAny = (value: string, patterns: RegExp[]) =>
  patterns.some((pattern) => pattern.test(value));

const singleLine = (value: string, maxLength: number) =>
  value
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, maxLength);

export function buildPromotionModelPayload(input: LocalMessageInput) {
  return [
    `From: ${singleLine(input.sender, MODEL_INPUT_LIMITS.sender)}`,
    `Subject: ${singleLine(input.subject, MODEL_INPUT_LIMITS.subject)}`,
    `Snippet: ${singleLine(input.snippet, MODEL_INPUT_LIMITS.snippet)}`,
    "",
    input.bodyText.slice(0, MODEL_INPUT_LIMITS.bodyText),
  ].join("\n");
}

export function classifyMessageLocally(
  input: LocalMessageInput,
): LocalMessageDecision {
  const modelPayload = buildPromotionModelPayload(input);

  if (matchesAny(modelPayload, SECURITY_PATTERNS)) {
    return { allowModel: false, category: "security" };
  }

  if (matchesAny(modelPayload, FINANCIAL_PATTERNS)) {
    return { allowModel: false, category: "financial" };
  }

  if (matchesAny(modelPayload, TRANSACTIONAL_PATTERNS)) {
    return { allowModel: false, category: "transactional" };
  }

  if (input.subject.trim().length === 0 || input.sender.trim().length === 0) {
    return { allowModel: false, category: "unknown-sensitive" };
  }

  return { allowModel: true };
}
