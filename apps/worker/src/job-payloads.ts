import { z } from "zod";

export const ConnectionJobPayload = z.object({
  connectionId: z.string().min(1),
});

export const MessageJobPayload = ConnectionJobPayload.extend({
  gmailMessageId: z.string().min(1),
});
