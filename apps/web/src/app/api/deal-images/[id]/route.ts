import { prisma } from "@casero/database";

import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = (await getSession())?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const image = await prisma.emailImage.findFirst({
    where: { id, gmailMessage: { userId } },
    select: { data: true, mimeType: true, sha256: true },
  });
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=86400, immutable",
      ETag: `"${image.sha256}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
