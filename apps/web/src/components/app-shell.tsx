import {
  BookmarkIcon,
  InboxIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";

import { signOutUser } from "@/app/auth-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/today", label: "Today", icon: LayoutDashboardIcon },
  { href: "/deals", label: "Deals", icon: SparklesIcon },
  { href: "/watchlist", label: "Watchlist", icon: BookmarkIcon },
  { href: "/settings/integrations", label: "Integrations", icon: SettingsIcon },
];

const initials = (name?: string | null, email?: string | null) =>
  (name ?? email ?? "C")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex h-20 items-center gap-3 px-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <InboxIcon aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight">
              Comprador
            </p>
            <p className="text-xs text-muted-foreground">
              Personal buying desk
            </p>
          </div>
        </div>
        <Separator />
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant="ghost"
              className="justify-start"
              asChild
            >
              <Link href={href}>
                <Icon data-icon="inline-start" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="p-4">
          <Separator className="mb-4" />
          <div className="flex items-center gap-3">
            <Avatar>
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name ?? "Account"} />
              ) : null}
              <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.name ?? "Personal account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <form action={signOutUser}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <Link href="/today" className="font-heading text-lg font-semibold">
            Comprador
          </Link>
          <nav
            aria-label="Mobile primary"
            className="ml-auto flex items-center gap-1"
          >
            {navItems.slice(0, 3).map(({ href, label, icon: Icon }) => (
              <Button key={href} variant="ghost" size="icon" asChild>
                <Link href={href} aria-label={label}>
                  <Icon />
                </Link>
              </Button>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
