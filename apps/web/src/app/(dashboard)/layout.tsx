import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
