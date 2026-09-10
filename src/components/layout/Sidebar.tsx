"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_SECTIONS } from "./nav";
import { useAuthStore } from "@/stores/useAuthStore";
import { useDataStore } from "@/stores/useDataStore";
import { canAccess, ROLE_LABELS, SCHOOL_NAME } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Sidebar({
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const unread = useDataStore((s) => s.notifications.filter((n) => !n.read).length);
  const role = session?.user.role ?? "DIRECTOR";

  const go = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar/90 sticky top-0 hidden h-dvh flex-col border-r backdrop-blur-xl lg:flex",
        collapsed ? "w-[76px]" : "w-[260px]",
        "transition-[width] duration-300",
      )}
      aria-label="Asosiy menyu"
    >
      <div className={cn("flex items-center gap-2 px-4 pt-5 pb-4", collapsed && "justify-center px-2")}>
        <Logo compact={collapsed} />
        {onToggleCollapse ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn("ml-auto size-8", collapsed && "hidden")}
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Panelni kengaytirish" : "Panelni yig'ish"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl border bg-card/60 px-3 py-2">
          <span className="brand-gradient size-6 rounded-lg" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">{SCHOOL_NAME}</p>
            <p className="text-muted-foreground truncate text-[10px]">Toshkent sh.</p>
          </div>
        </div>
      ) : null}

      <nav className="scrollbar-none flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Modullar">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((i) => canAccess(role, i.page));
          if (items.length === 0) return null;
          return (
            <div key={section.title}>
              {!collapsed ? (
                <p className="text-sidebar-muted px-3 pb-1.5 text-[10px] font-semibold tracking-widest uppercase">
                  {section.title}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => go(item.href)}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          collapsed && "justify-center px-0",
                          active
                            ? "brand-gradient-soft text-primary shadow-sm"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        {active ? (
                          <span className="brand-gradient absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full" />
                        ) : null}
                        <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                        {!collapsed && item.page === "notifications" && unread > 0 ? (
                          <Badge variant="destructive" className="ml-auto num h-5 min-w-5 px-1.5 text-[10px]">
                            {unread}
                          </Badge>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {session ? (
        <div className={cn("border-t p-3", collapsed && "flex justify-center")}>
          <div className={cn("flex items-center gap-2.5 rounded-2xl border bg-card/70 p-2.5", collapsed && "border-0 bg-transparent p-0")}>
            <Avatar name={session.user.name} hue={session.user.avatarHue} size="sm" />
            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[13px] font-semibold">{session.user.name}</p>
                  <p className="text-muted-foreground truncate text-[11px]">{ROLE_LABELS[session.user.role]}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  aria-label="Chiqish"
                >
                  <LogOut />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
