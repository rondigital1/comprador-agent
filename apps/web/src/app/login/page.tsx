import { ArrowRightIcon, MailCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signInWithGoogle } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/today");
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MailCheckIcon aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-xl font-semibold tracking-tight">
              Casero
            </p>
            <p className="text-sm text-muted-foreground">
              Your personal buying desk
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your workspace</CardTitle>
            <CardDescription>
              Start with your Google identity. Gmail read access is requested
              separately after sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              This private build reads only the Promotions category you connect.
              It cannot send, modify, or delete Gmail messages.
            </div>
          </CardContent>
          <CardFooter>
            <form action={signInWithGoogle} className="w-full">
              <Button type="submit" size="lg" className="w-full">
                Continue with Google
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
