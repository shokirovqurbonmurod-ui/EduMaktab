"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  GraduationCap,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDataStore } from "@/stores/useDataStore";
import { useUIStore } from "@/stores/useUIStore";
import { relativeDayUZ } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; label: string; cls: string }> = {
  attendance: { icon: <CalendarClock />, label: "Davomat", cls: "bg-info-soft text-info" },
  finance: { icon: <Wallet />, label: "Moliya", cls: "bg-success-soft text-success" },
  academic: { icon: <GraduationCap />, label: "O'quv", cls: "brand-gradient-soft text-primary" },
  event: { icon: <Bell />, label: "Tadbir", cls: "bg-warning-soft text-warning" },
  system: { icon: <AlertTriangle />, label: "Tizim", cls: "bg-muted text-muted-foreground" },
};

export function NotificationPanel() {
  const open = useUIStore((s) => s.notificationPanelOpen);
  const setOpen = useUIStore((s) => s.setNotificationPanel);
  const notifications = useDataStore((s) => s.notifications);
  const mark = useDataStore((s) => s.markNotification);
  const markAll = useDataStore((s) => s.markAllNotifications);
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const list = notifications.filter((n) => (filter === "unread" ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                Bildirishnomalar
                {unreadCount > 0 ? <Badge variant="destructive" className="num">{unreadCount}</Badge> : null}
              </SheetTitle>
              <SheetDescription className="mt-1">
                Maktab bo‘yicha so‘nggi yangiliklar
              </SheetDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={markAll}>
              <CheckCheck /> Barchasi
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  filter === f ? "brand-gradient text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "all" ? "Barchasi" : "O‘qilmagan"}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {list.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="brand-gradient-soft flex size-14 items-center justify-center rounded-2xl text-primary [&_svg]:size-7">
                <Bell />
              </div>
              <p className="font-medium">Hammasi o‘qilgan 🎉</p>
              <p className="text-muted-foreground text-sm">Yangi bildirishnomalar shu yerda paydo bo‘ladi.</p>
            </div>
          ) : (
            list.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  mark(n.id);
                  setOpen(false);
                  router.push("/app/notifications");
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50",
                  !n.read && "bg-accent/40",
                )}
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TYPE_META[n.type].cls)}>
                  {TYPE_META[n.type].icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{n.title}</span>
                    {!n.read ? <span className="bg-primary size-2 shrink-0 rounded-full" /> : null}
                  </span>
                  <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-[13px]">{n.body}</span>
                  <span className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
                    <Badge variant="muted" className="h-4 px-1.5 text-[9px]">{TYPE_META[n.type].label}</Badge>
                    {relativeDayUZ(n.date)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type { AppNotification };
