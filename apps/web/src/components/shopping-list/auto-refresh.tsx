"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ShoppingResearchRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let refreshes = 0;
    const interval = window.setInterval(() => {
      router.refresh();
      refreshes += 1;
      if (refreshes >= 15) window.clearInterval(interval);
    }, 4_000);
    return () => window.clearInterval(interval);
  }, [active, router]);
  return null;
}
