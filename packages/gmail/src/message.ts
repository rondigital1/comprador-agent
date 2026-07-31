import { convert } from "html-to-text";
import type { gmail_v1 } from "googleapis";

export type NormalizedGmailMessage = {
  gmailMessageId: string;
  threadId: string | null;
  historyId: string | null;
  sender: string;
  subject: string;
  snippet: string;
  bodyText: string;
  receivedAt: Date | null;
  images: NormalizedGmailImage[];
};

export type NormalizedGmailImage = {
  attachmentId: string | null;
  contentId: string | null;
  filename: string | null;
  mimeType: string;
  size: number;
  data: Buffer | null;
};

const decodeBody = (value: string | null | undefined) =>
  value ? Buffer.from(value, "base64url").toString("utf8") : "";

const supportedImageTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function collectParts(
  part: gmail_v1.Schema$MessagePart,
  output: {
    html: string[];
    text: string[];
    images: NormalizedGmailImage[];
  },
) {
  const mimeType = part.mimeType?.toLocaleLowerCase() ?? "";
  if (supportedImageTypes.has(mimeType)) {
    const headers = new Map(
      (part.headers ?? []).map((header) => [
        header.name?.toLocaleLowerCase() ?? "",
        header.value ?? "",
      ]),
    );
    output.images.push({
      attachmentId: part.body?.attachmentId ?? null,
      contentId: headers.get("content-id")?.replace(/^<|>$/g, "") ?? null,
      filename: part.filename || null,
      mimeType,
      size: part.body?.size ?? 0,
      data: part.body?.data ? Buffer.from(part.body.data, "base64url") : null,
    });
  }

  if (!part.filename) {
    const content = decodeBody(part.body?.data);
    if (content && mimeType === "text/plain") {
      output.text.push(content);
    } else if (content && mimeType === "text/html") {
      output.html.push(content);
    }
  }

  for (const child of part.parts ?? []) {
    collectParts(child, output);
  }
}

export function normalizeGmailMessage(
  message: gmail_v1.Schema$Message,
): NormalizedGmailMessage {
  if (!message.id) {
    throw new Error("Gmail message is missing its ID");
  }

  const headers = new Map(
    (message.payload?.headers ?? []).map((header) => [
      header.name?.toLowerCase() ?? "",
      header.value ?? "",
    ]),
  );
  const bodies = {
    html: [] as string[],
    text: [] as string[],
    images: [] as NormalizedGmailImage[],
  };
  if (message.payload) {
    collectParts(message.payload, bodies);
  }

  const plainText = bodies.text.join("\n\n").trim();
  const htmlText = bodies.html.length
    ? convert(bodies.html.join("\n"), {
        selectors: [
          { selector: "img", format: "skip" },
          { selector: "a", options: { ignoreHref: true } },
        ],
        wordwrap: false,
      }).trim()
    : "";

  return {
    gmailMessageId: message.id,
    threadId: message.threadId ?? null,
    historyId: message.historyId ?? null,
    sender: headers.get("from") ?? "",
    subject: headers.get("subject") ?? "",
    snippet: message.snippet ?? "",
    bodyText: (plainText || htmlText).slice(0, 40_000),
    receivedAt: message.internalDate
      ? new Date(Number(message.internalDate))
      : null,
    images: bodies.images,
  };
}
