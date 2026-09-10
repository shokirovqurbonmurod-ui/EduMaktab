"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/useAuthStore";
import { LogoMark } from "@/components/layout/Logo";
import { initTheme } from "@/stores/useThemeStore";

/**
 * Auth guard + app chrome.
 *
 * The session lives in a client store, so the first render (server and
 * client) shows a neutral splash; after hydration we either render the
 * app shell or redirect to /login. This avoids hydration mismatches.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    initTheme();
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !session) {
      router.replace("/login");
    }
  }, [ready, session, router]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <LogoMark className="size-14 animate-pulse" />
        <div className="text-muted-foreground text-sm">SchoolOS yuklanmoqda…</div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
