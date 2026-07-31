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
};

const decodeBody = (value: string | null | undefined) =>
  value ? Buffer.from(value, "base64url").toString("utf8") : "";

function collectBodies(
  part: gmail_v1.Schema$MessagePart,
  output: { html: string[]; text: string[] },
) {
  if (part.filename) {
    return;
  }

  const content = decodeBody(part.body?.data);
  if (content && part.mimeType === "text/plain") {
    output.text.push(content);
  } else if (content && part.mimeType === "text/html") {
    output.html.push(content);
  }

  for (const child of part.parts ?? []) {
    collectBodies(child, output);
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
  const bodies = { html: [] as string[], text: [] as string[] };
  if (message.payload) {
    collectBodies(message.payload, bodies);
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
  };
}
