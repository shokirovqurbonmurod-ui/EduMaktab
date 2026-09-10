"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton, EmptyState } from "@/components/shared/states";
import {
  MONTHS_UZ,
  WEEKDAYS_UZ_SHORT,
  formatDateShortUZ,
  formatDateUZ,
  formatTimeUZ,
  todayISO,
  uid,
} from "@/lib/utils-safe";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

const EVENT_META: Record<CalendarEvent["type"], { label: string }> = {
  exam: { label: "Imtihon" },
  meeting: { label: "Yig‘ilish" },
  "parent-meeting": { label: "Ota-onalar" },
  holiday: { label: "Bayram" },
  event: { label: "Tadbir" },
  payment: { label: "To‘lov" },
};

const eventColors: Record<CalendarEvent["type"], { bg: string; text: string; dot: string }> = {
  exam: { bg: "bg-violet-500/12", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  meeting: { bg: "bg-sky-500/12", text: "text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  "parent-meeting": { bg: "bg-emerald-500/12", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  holiday: { bg: "bg-amber-500/12", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  event: { bg: "bg-fuchsia-500/12", text: "text-fuchsia-700 dark:text-fuchsia-300", dot: "bg-fuchsia-500" },
  payment: { bg: "bg-rose-500/12", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
};

const formSchema = z.object({
  title: z.string().min(3, "Nomi kiriting"),
  date: z.string().min(1, "Sana tanlang"),
  time: z.string(),
  endTime: z.string(),
  type: z.enum(["exam", "meeting", "parent-meeting", "holiday", "event", "payment"]),
  location: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

export default function CalendarPage() {
  const { calendar } = useDataStore();
  const addEvent = useDataStore((s) => s.addCalendarEvent);
  const today = todayISO();
  const [cursor, setCursor] = React.useState(() => today.slice(0, 7)); // "yyyy-mm"
  const [selectedDay, setSelectedDay] = React.useState<string>(today);
  const [fType, setFType] = React.useState<"all" | CalendarEvent["type"]>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { loading } = usePageData(() => calendar, []);

  const year = Number(cursor.slice(0, 4));
  const month = Number(cursor.slice(5, 7));
  const firstDay = new Date(year, month - 1, 1);
  const startWd = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: startWd }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOn = (date: string) =>
    calendar
      .filter((e) => e.date === date && (fType === "all" || e.type === fType))
      .sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));

  const move = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const dayEvents = eventsOn(selectedDay);

  const save = (v: FormValues) => {
    addEvent({
      id: uid("cal"),
      title: v.title,
      date: v.date,
      time: v.time || undefined,
      endTime: v.endTime || undefined,
      type: v.type,
      location: v.location || undefined,
      allDay: !v.time,
      hue: 258,
    });
    toast.success("Tadbir qo‘shildi", { description: `${v.title} — ${formatDateUZ(v.date)}` });
    setDialogOpen(false);
  };

  if (loading) return <PageSkeleton withCards={false} rows={8} />;

  return (
    <>
      <PageHeader
        title="Kalendar"
        subtitle={`${MONTHS_UZ[month - 1]} ${year} · ${calendar.length} ta tadbir`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <CalendarPlus /> Tadbir qo‘shish
          </Button>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-9" onClick={() => move(-1)} aria-label="Oldingi oy">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setCursor(today.slice(0, 7));
            setSelectedDay(today);
          }}>
            Bugun
          </Button>
          <Button variant="outline" size="icon" className="size-9" onClick={() => move(1)} aria-label="Keyingi oy">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <FilterBar>
          {(["all", ...Object.keys(EVENT_META)] as ("all" | CalendarEvent["type"])[]).map((t) => (
            <button
              key={t}
              onClick={() => setFType(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                fType === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {t !== "all" ? <span className={cn("size-2 rounded-full", eventColors[t].dot)} /> : null}
              {t === "all" ? "Barchasi" : EVENT_META[t].label}
            </button>
          ))}
        </FilterBar>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS_UZ_SHORT.map((d, i) => (
                <div key={d} className="pb-1 text-center text-[11px] font-semibold tracking-wider text-muted-foreground">
                  {i === 5 || i === 6 ? d : d.toUpperCase()}
                </div>
              ))}
              {cells.map((date, i) =>
                date === null ? (
                  <div key={`e${i}`} className="min-h-20 rounded-xl" />
                ) : (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDay(date);
                    }}
                    className={cn(
                      "min-h-20 rounded-xl border p-1.5 text-left align-top transition-colors",
                      date === today
                        ? "border-primary/50 bg-primary/5"
                        : date === selectedDay
                          ? "border-foreground/30 bg-accent/40"
                          : "border-transparent hover:border-foreground/15 hover:bg-accent/30",
                    )}
                  >
                    <span
                      className={cn(
                        "num inline-flex size-6 items-center justify-center rounded-full text-xs",
                        date === today && "bg-primary text-primary-foreground font-semibold",
                      )}
                    >
                      {Number(date.slice(8, 10))}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {eventsOn(date).slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className={cn("truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium", eventColors[e.type].bg, eventColors[e.type].text)}
                        >
                          {e.time ? `${e.time} ` : ""}{e.title}
                        </div>
                      ))}
                      {eventsOn(date).length > 2 ? (
                        <div className="px-1.5 text-[10px] text-muted-foreground">+{eventsOn(date).length - 2}</div>
                      ) : null}
                    </div>
                  </button>
                ),
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {formatDateShortUZ(selectedDay)} <span className="text-muted-foreground font-normal">· {formatDateUZ(selectedDay)}</span>
              </p>
              <Badge variant={dayEvents.length ? "default" : "muted"} className="num">{dayEvents.length} ta</Badge>
            </div>
            {dayEvents.length === 0 ? (
              <EmptyState icon={<Clock />} title="Tadbirlar yo‘q" description="Ushbu kun uchun tadbirlar belgilanmagan." />
            ) : (
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <div key={e.id} className={cn("rounded-2xl border p-3", eventColors[e.type].bg)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-[13px] font-semibold leading-tight", eventColors[e.type].text)}>{e.title}</p>
                      <span className={cn("mt-0.5 size-2 shrink-0 rounded-full", eventColors[e.type].dot)} />
                    </div>
                    <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                      {e.time ? (
                        <p className="num flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          {formatTimeUZ(e.time)} – {e.endTime ? formatTimeUZ(e.endTime) : "—"}
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5">
                          <Clock className="size-3.5" /> Kunning istalgan vaqti
                        </p>
                      )}
                      {e.location ? (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3.5" /> {e.location}
                        </p>
                      ) : null}
                      <p>
                        <Badge variant="muted" className="mt-1">{EVENT_META[e.type].label}</Badge>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-muted-foreground pt-1 text-xs">
              Oyga ko‘cha tadbirlar ro‘yxati: {calendar.filter((e) => e.date.slice(0, 7) === cursor).length} ta
            </p>
          </CardContent>
        </Card>
      </div>

      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={save} defaultDate={selectedDay} />
    </>
  );
}

function EventDialog({
  open,
  onOpenChange,
  onSave,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: FormValues) => void;
  defaultDate: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", date: defaultDate, time: "09:00", endTime: "10:00", type: "event", location: "" },
  });

  React.useEffect(() => {
    if (open) reset({ title: "", date: defaultDate, time: "09:00", endTime: "10:00", type: "event", location: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-5 text-primary" />
            Yangi tadbir
          </DialogTitle>
          <DialogDescription>Kalendar uchun tadbir qo‘shing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cv-title">Nomi</Label>
            <Input id="cv-title" placeholder="Masalan: Ota-onalar yig‘ilishi" {...register("title")} />
            {errors.title ? <p className="text-danger text-xs">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv-date">Sana</Label>
            <Input id="cv-date" type="date" {...register("date")} />
            {errors.date ? <p className="text-danger text-xs">{errors.date.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Tur</Label>
            <Select onValueChange={(v) => setValue("type", v as FormValues["type"])} defaultValue="event">
              <SelectTrigger className="w-full" aria-label="Tur">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv-time">Boshlanish</Label>
            <Input id="cv-time" type="time" {...register("time")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv-end">Tugash</Label>
            <Input id="cv-end" type="time" {...register("endTime")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cv-loc">Joy</Label>
            <Input id="cv-loc" placeholder="Masalan: 305-xona" {...register("location")} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">Qo‘shish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
