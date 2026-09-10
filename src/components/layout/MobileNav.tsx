"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Grid3x3 } from "lucide-react";
import { MOBILE_TABS, NAV_SECTIONS } from "./nav";
import { Logo } from "./Logo";
import { useAuthStore } from "@/stores/useAuthStore";
import { canAccess, ROLE_LABELS } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDataStore } from "@/stores/useDataStore";
import { cn } from "@/lib/utils";

/**
 * iOS-style bottom navigation:
 * Bosh sahifa · O'quvchilar · Jadval · Xabarlar · Boshqa (all modules)
 */
export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const unread = useDataStore((s) => s.notifications.filter((n) => !n.read).length);
  const [moreOpen, setMoreOpen] = React.useState(false);

  const role = session?.user.role ?? "DIRECTOR";
  const visibleTabs = MOBILE_TABS.filter((t) => canAccess(role, t.page));

  return (
    <>
      <nav
        className="glass fixed inset-x-0 bottom-0 z-40 border-t safe-bottom lg:hidden"
        aria-label="Mobil navigatsiya"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {visibleTabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-[22px]", active && "scale-105")} strokeWidth={active ? 2.4 : 2} />
                  {tab.page === "messages" && unread > 0 ? (
                    <span className="bg-danger absolute -top-0.5 -right-1.5 size-2 rounded-full" />
                  ) : null}
                </span>
                {tab.label}
                {active ? <span className="brand-gradient absolute top-0 h-0.5 w-8 rounded-full" /> : null}
              </button>
            );
          })}

          {/* "Boshqa" (more) button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Barcha bo'limlar"
          >
            <Grid3x3 className="size-[22px]" />
            Boshqa
          </button>
        </div>
      </nav>

      {/* More sheet — all modules */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="top-auto h-auto max-h-[85dvh] rounded-t-3xl">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted" />
          <SheetHeader className="px-5 pb-2 text-center">
            <SheetTitle className="text-base">Barcha bo‘limlar</SheetTitle>
          </SheetHeader>
          <div className="scrollbar-none max-h-[65dvh] space-y-4 overflow-y-auto px-5 pb-6">
            <div className="flex items-center gap-3 rounded-2xl border bg-card/70 p-3">
              <Logo compact />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{session?.user.name}</p>
                <p className="text-muted-foreground text-xs">{session ? ROLE_LABELS[session.user.role] : ""}</p>
              </div>
              {session ? <Avatar name={session.user.name} hue={session.user.avatarHue} size="md" /> : null}
            </div>
            {NAV_SECTIONS.map((section) => {
              const items = section.items.filter((i) => canAccess(role, i.page));
              if (items.length === 0) return null;
              return (
                <div key={section.title}>
                  <p className="text-muted-foreground pb-1.5 text-[10px] font-semibold tracking-widest uppercase">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <button
                          key={item.href}
                          onClick={() => {
                            router.push(item.href);
                            setMoreOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-2.5 rounded-2xl border p-3 text-left text-[13px] font-medium transition-all",
                            active
                              ? "brand-gradient-soft border-primary/25 text-primary"
                              : "bg-card hover:bg-accent",
                          )}
                        >
                          <Icon className={cn("size-4.5 shrink-0", active && "text-primary")} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function useUnreadCount() {
  return useDataStore((s) => s.notifications.filter((n) => !n.read).length);
}
