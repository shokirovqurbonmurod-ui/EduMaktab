"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  CircleDot,
  GraduationCap,
  Landmark,
  ScanFace,
  Server,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { ChartCard } from "@/components/shared/ChartCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton, EmptyState } from "@/components/shared/states";
import { relativeDayUZ } from "@/lib/utils-safe";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/types";

const TYPE_META: Record<NotificationType, { label: string; icon: React.ReactNode; tone: string }> = {
  attendance: { label: "Davomat", icon: <ScanFace />, tone: "text-success" },
  finance: { label: "Moliya", icon: <Landmark />, tone: "text-primary" },
  academic: { label: "O‘quv", icon: <GraduationCap />, tone: "text-warning" },
  event: { label: "Tadbir", icon: <CalendarDays />, tone: "text-info" },
  system: { label: "Tizim", icon: <Server />, tone: "text-muted-foreground" },
};

const FILTERS: { value: "all" | NotificationType; label: string }[] = [
  { value: "all", label: "Barchasi" },
  { value: "attendance", label: "Davomat" },
  { value: "finance", label: "Moliya" },
  { value: "academic", label: "O‘quv" },
  { value: "event", label: "Tadbir" },
  { value: "system", label: "Tizim" },
];

export default function NotificationsPage() {
  const { notifications } = useDataStore();
  const mark = useDataStore((s) => s.markNotification);
  const markAll = useDataStore((s) => s.markAllNotifications);
  const [fType, setFType] = React.useState<"all" | NotificationType>("all");
  const { loading } = usePageData(() => notifications, []);

  const unread = notifications.filter((n) => !n.read).length;
  const filtered = notifications
    .filter((n) => (fType === "all" ? true : n.type === fType))
    .sort((a, b) => Number(b.read) - Number(a.read) || b.date.localeCompare(a.date));

  const byType = React.useMemo(() => {
    const map = new Map<NotificationType, number>();
    for (const n of notifications) map.set(n.type, (map.get(n.type) ?? 0) + 1);
    return map;
  }, [notifications]);

  const onOpen = (n: AppNotification) => {
    if (!n.read) mark(n.id);
  };

  return (
    <>
      <PageHeader
        title="Bildirishnomalar"
        subtitle={unread > 0 ? `${unread} ta o‘qilmagan` : "Hammasi o‘qilgan"}
        actions={
          <Button variant="outline" size="sm" onClick={() => {
            markAll();
            toast.success("Barchasi o‘qilgan deb belgilandi");
          }}>
            <CheckCheck /> Barchasini o‘qish
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <ChartCard title="Turlar bo‘yicha" description={`${notifications.length} ta bildirishnoma`} height={200} bodyClassName="px-4">
            <div className="space-y-2.5">
              {(Object.keys(TYPE_META) as NotificationType[]).map((t) => {
                const meta = TYPE_META[t];
                const count = byType.get(t) ?? 0;
                const max = Math.max(1, ...Array.from(byType.values()));
                return (
                  <button
                    key={t}
                    onClick={() => setFType(fType === t ? "all" : t)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                      fType === t ? "bg-accent/60" : "hover:bg-accent/40",
                    )}
                  >
                    <span className={cn("shrink-0", meta.tone)}>{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px] font-medium">{meta.label}</span>
                        <span className="num text-xs text-muted-foreground">{count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground/50 transition-all"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ChartCard>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-2xl">
                <BellRing className="text-primary size-5" />
              </div>
              <div className="text-sm leading-snug">
                <p className="font-medium">Eslatmalar</p>
                <p className="text-muted-foreground text-xs">To‘lov muddati — oyning 25-sanasigacha. Kechikkanda eslatma yuboriladi.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <FilterBar className="justify-start">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFType(f.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    fType === f.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </FilterBar>

            {loading ? (
              <PageSkeleton withCards={false} rows={7} />
            ) : filtered.length === 0 ? (
              <EmptyState icon={<Bell />} title="Bildirishnomalar yo‘q" description="Ushbu tur bo‘yicha yangi bildirishnomalar yo‘q." />
            ) : (
              <div className="scrollbar-none -mx-1 max-h-[62dvh] space-y-2 overflow-y-auto px-1">
                {filtered.map((n) => {
                  const meta = TYPE_META[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => onOpen(n)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:border-primary/30",
                        !n.read ? "bg-card shadow-sm ring-1 ring-primary/10" : "bg-muted/30 opacity-80",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          !n.read ? "bg-primary/10" : "bg-muted",
                        )}
                      >
                        <span className={meta.tone}>{meta.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn("truncate text-sm", !n.read && "font-semibold")}>{n.title}</p>
                          {!n.read ? <CircleDot className="text-primary size-3.5 shrink-0" /> : null}
                        </div>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[13px] leading-snug">{n.body}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge variant="muted" className="h-4 px-1.5 text-[9px]">{meta.label}</Badge>
                          <span className="num text-[11px] text-muted-foreground">{relativeDayUZ(n.date)}</span>
                          {n.actorName ? <span className="text-[11px] text-muted-foreground">· {n.actorName}</span> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
