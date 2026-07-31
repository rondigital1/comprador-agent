import { JobType } from "@casero/database/generated";
import { prisma } from "@casero/database";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";

import { serverEnv } from "@/lib/server-env";

export const runtime = "nodejs";

const PubSubEnvelope = z.object({
  message: z.object({
    data: z.string(),
    messageId: z.string(),
  }),
});

const Notification = z.object({
  emailAddress: z.email(),
  historyId: z.string(),
});

async function verifyPush(request: Request) {
  const authorization = request.headers.get("authorization");
  const idToken = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!idToken) {
    throw new Error("Missing Pub/Sub bearer token");
  }

  const ticket = await new OAuth2Client().verifyIdToken({
    idToken,
    audience: serverEnv.pubSubAudience,
  });
  if (ticket.getPayload()?.email !== serverEnv.pubSubServiceAccount) {
    throw new Error("Unexpected Pub/Sub service account");
  }
}

export async function POST(request: Request) {
  try {
    await verifyPush(request);
    const envelope = PubSubEnvelope.parse(await request.json());
    const notification = Notification.parse(
      JSON.parse(Buffer.from(envelope.message.data, "base64").toString("utf8")),
    );
    const connection = await prisma.gmailConnection.findFirst({
      where: {
        emailAddress: notification.emailAddress,
        status: "ACTIVE",
      },
    });

    if (connection) {
      await prisma.outboxJob.upsert({
        where: {
          idempotencyKey: `gmail-push:${connection.id}:${notification.historyId}`,
        },
        create: {
          userId: connection.userId,
          type: JobType.GMAIL_INCREMENTAL_SYNC,
          payload: { connectionId: connection.id },
          idempotencyKey: `gmail-push:${connection.id}:${notification.historyId}`,
        },
        update: {},
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Rejected Gmail Pub/Sub push", error);
    return Response.json({ error: "Invalid push request" }, { status: 401 });
  }
}
