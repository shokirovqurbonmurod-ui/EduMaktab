"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton } from "@/components/shared/states";
import { WEEKDAYS_UZ_SHORT, formatDateUZ, todayISO, formatMonthUZ } from "@/lib/utils-safe";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type View = "day" | "week" | "month";

export default function SchedulePage() {
  const { classes, teachers } = useDataStore();
  const addCalendarEvent = useDataStore((s) => s.addCalendarEvent);
  const [view, setView] = React.useState<View>("week");
  const [fClass, setFClass] = React.useState("cls_9a");
  const { loading } = usePageData(() => classes, []);

  const today = todayISO();
  const cls = classes.find((c) => c.id === fClass) ?? classes[0]!;
  const todayWd = (new Date().getDay() + 6) % 7; // Mon=0

  const slots = React.useMemo(
    () => cls.schedule.map((s) => ({ ...s, teacher: teachers.find((t) => t.id === s.teacherId) })).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start)),
    [cls, teachers],
  );

  const addLesson = () => {
    addCalendarEvent({
      id: `cal_${Date.now()}`,
      title: `${cls.name} — yangi dars`,
      date: today,
      time: "15:00",
      type: "event",
      location: cls.room,
      hue: cls.hue,
    });
    toast.success("Dars qo‘shildi", { description: "Kalendarga yangi tadbir qo‘shildi." });
  };

  if (loading) return <PageSkeleton withCards={false} rows={8} />;

  return (
    <>
      <PageHeader
        title="Jadval"
        subtitle={`${cls.name} guruhi · ${slots.length} ta dars/hafta`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={fClass} onValueChange={setFClass}>
              <SelectTrigger className="w-40" aria-label="Guruh tanlash">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 rounded-xl bg-muted p-1">
              {(
                [
                  { v: "day", l: "Kun" },
                  { v: "week", l: "Hafta" },
                  { v: "month", l: "Oy" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  onClick={() => setView(o.v)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    view === o.v ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={addLesson}>
              <Plus /> Dars qo‘shish
            </Button>
          </div>
        }
      />

      <div className="mt-6">
        {view === "week" ? (
          <WeekView slots={slots} />
        ) : view === "day" ? (
          <DayView slots={slots} todayWd={todayWd} />
        ) : (
          <MonthView today={today} />
        )}
      </div>
    </>
  );
}

/* ---------- Week grid ---------- */

function WeekView({ slots }: { slots: { day: number; start: string; end: string; subjectId: string; teacherId: string; room: string; teacher?: { firstName: string; lastName: string } }[] }) {
  const { subjects } = useDataStore();
  const days = [0, 1, 2, 3, 4, 5];
  const hours = ["08:30", "09:30", "10:30", "11:30", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[56px_repeat(6,1fr)] gap-1.5">
          <div />
          {days.map((d) => (
            <div key={d} className="rounded-xl border bg-card py-2.5 text-center">
              <p className="text-sm font-semibold">{WEEKDAYS_UZ_SHORT[d]}</p>
              <p className="text-muted-foreground text-[11px]">{d + 1}-kun</p>
            </div>
          ))}
          {hours.map((h) => (
            <React.Fragment key={h}>
              <div className="num flex h-[52px] items-start justify-end pt-1 pr-2 text-[11px] text-muted-foreground">{h}</div>
              {days.map((d) => {
                const slot = slots.find((s) => s.day === d && s.start === h);
                return (
                  <div key={`${d}-${h}`} className="min-h-[52px] rounded-xl border border-dashed p-1">
                    {slot ? (
                      <div
                        className="h-full w-full overflow-hidden rounded-lg border-l-4 p-2"
                        style={{
                          background: `hsl(${(subjects.find((x) => x.id === slot.subjectId)?.hue ?? 258)} 70% 95%)`,
                          borderLeftColor: `hsl(${subjects.find((x) => x.id === slot.subjectId)?.hue ?? 258} 60% 50%)`,
                        }}
                      >
                        <p className="truncate text-xs font-bold" style={{ color: `hsl(${subjects.find((x) => x.id === slot.subjectId)?.hue ?? 258} 55% 32%)` }}>
                          {subjects.find((x) => x.id === slot.subjectId)?.name}
                        </p>
                        <p className="truncate text-[10px]" style={{ color: `hsl(${subjects.find((x) => x.id === slot.subjectId)?.hue ?? 258} 40% 40%)` }}>
                          {slot.teacher ? `${slot.teacher.firstName[0]}. ${slot.teacher.lastName}` : "—"} · {slot.room}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Day timeline ---------- */

function DayView({ slots, todayWd }: { slots: { day: number; start: string; end: string; subjectId: string; teacherId: string; room: string; teacher?: { firstName: string; lastName: string } }[]; todayWd: number }) {
  const { subjects } = useDataStore();
  const tomorrowWd = (todayWd + 1) % 7;
  const now = new Date();
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const render = (day: number, label: string) => {
    const list = slots.filter((s) => s.day === day);
    if (list.length === 0)
      return (
        <div className="text-muted-foreground rounded-2xl border border-dashed py-8 text-center text-sm">
          {label}: darslar yo‘q 🎉
        </div>
      );
    return (
      <div className="space-y-2">
        {list.map((s, i) => {
          const subj = subjects.find((x) => x.id === s.subjectId);
          const isNow = s.start <= nowHM && nowHM < s.end;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 rounded-2xl border p-3.5 transition-all",
                isNow && "brand-gradient-soft border-primary/40 shadow-sm",
              )}
            >
              <div className="w-20 shrink-0">
                <p className="num text-sm font-bold">{s.start}</p>
                <p className="text-muted-foreground num text-[11px]">gacha {s.end}</p>
              </div>
              <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: `hsl(${subj?.hue ?? 258} 60% 55%)` }} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  {subj?.name}
                  {isNow ? <Badge variant="success">Davom etmoqda</Badge> : null}
                </p>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                  <MapPin className="size-3" /> {s.room}-xona · {s.teacher ? `${s.teacher.firstName[0]}. ${s.teacher.lastName}` : "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          Bugun <Badge variant="secondary">{formatDateUZ(todayISO())}</Badge>
        </h3>
        {render(todayWd, "Bugun")}
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold">Ertaga</h3>
        {render(tomorrowWd, "Ertaga")}
      </div>
    </div>
  );
}

/* ---------- Month ---------- */

function MonthView({ today }: { today: string }) {
  const [offset, setOffset] = React.useState(0);
  const { calendar } = useDataStore();
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + offset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWd = (new Date(year, month, 1).getDay() + 6) % 7;

  const eventsOn = (day: number) => {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendar.filter((e) => e.date === iso);
  };

  const TYPE_COLORS: Record<string, string> = {
    exam: "bg-danger-soft text-danger",
    meeting: "bg-info-soft text-info",
    "parent-meeting": "bg-success-soft text-success",
    holiday: "bg-warning-soft text-warning",
    event: "brand-gradient-soft text-primary",
    payment: "bg-muted text-muted-foreground",
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWd }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">{formatMonthUZ(`${year}-${String(month + 1).padStart(2, "0")}`)}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => setOffset((o) => o - 1)} aria-label="Oldingi oy">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setOffset((o) => o + 1)} aria-label="Keyingi oy">
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS_UZ_SHORT.map((d) => (
            <div key={d} className="text-muted-foreground py-1 text-center text-[11px] font-semibold uppercase">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            const iso = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
            const evts = day ? eventsOn(day) : [];
            const isToday = iso === today;
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[76px] rounded-xl border p-1.5 transition-all",
                  day ? "bg-card hover:border-primary/40" : "border-transparent",
                  isToday && "border-primary/60 bg-accent/50",
                )}
              >
                {day ? (
                  <>
                    <p className={cn("num mb-1 text-right text-[11px] font-semibold", isToday ? "text-primary" : "text-muted-foreground")}>
                      {day}
                    </p>
                    <div className="space-y-1">
                      {evts.slice(0, 2).map((e) => (
                        <div key={e.id} title={e.title} className={cn("truncate rounded-md px-1.5 py-0.5 text-[9px] font-medium", TYPE_COLORS[e.type])}>
                          {e.title}
                        </div>
                      ))}
                      {evts.length > 2 ? <p className="text-muted-foreground text-[9px]">+{evts.length - 2}</p> : null}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-3">
          {(Object.keys(TYPE_COLORS) as (keyof typeof TYPE_COLORS)[]).map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px]">
              <span className={cn("size-2.5 rounded-full", TYPE_COLORS[t])} />
              {t === "exam" ? "Imtihon" : t === "meeting" ? "Yig‘ilish" : t === "parent-meeting" ? "Ota-onalar" : t === "holiday" ? "Bayram" : t === "event" ? "Tadbir" : "To‘lov"}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
