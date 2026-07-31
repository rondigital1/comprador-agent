import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export const getSession = cache(auth);

export async function requireUserId() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}
