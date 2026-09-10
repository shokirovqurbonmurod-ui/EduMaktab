"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ChevronRight,
  Phone,
  Plus,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton } from "@/components/shared/states";
import { LEAD_STAGE_META } from "@/components/shared/StatusBadge";
import { formatUZS, formatUZSCompact, relativeDayUZ, todayISO, uid } from "@/lib/utils-safe";
import { cn } from "@/lib/utils";
import type { Lead, LeadSource, LeadStage } from "@/lib/types";

const STAGES: LeadStage[] = ["new", "contacted", "demo", "trial", "contract", "accepted", "rejected"];

const SOURCE_LABELS: Record<LeadSource, string> = {
  telegram: "Telegram",
  instagram: "Instagram",
  referral: "Tavsiya",
  site: "Sayt",
  walkin: "Kirib kelgan",
  other: "Boshqa",
};

const formSchema = z.object({
  name: z.string().min(2, "Ism kiriting"),
  parentName: z.string().min(2, "Ota-ona ismi kiriting"),
  phone: z.string().min(9, "Telefon raqamini kiriting"),
  course: z.string().min(3, "Kurs tanlang"),
  source: z.enum(["telegram", "instagram", "referral", "site", "walkin", "other"]),
  value: z.coerce.number().min(100_000, "Oylik qiymat kiriting"),
});
type FormValues = z.infer<typeof formSchema>;

export default function CrmPage() {
  const { leads, staff } = useDataStore();
  const moveLead = useDataStore((s) => s.moveLead);
  const addLead = useDataStore((s) => s.addLead);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<LeadStage | null>(null);
  const [selected, setSelected] = React.useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { loading } = usePageData(() => leads, []);

  const byStage = React.useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    STAGES.forEach((s) => map.set(s, []));
    leads.forEach((l) => map.get(l.stage)?.push(l));
    return map;
  }, [leads]);

  const pipelineValue = leads
    .filter((l) => !["rejected", "accepted"].includes(l.stage))
    .reduce((s, l) => s + l.value, 0);
  const conversion = Math.round((leads.filter((l) => l.stage === "accepted").length / Math.max(1, leads.length)) * 100);

  const onDrop = (stage: LeadStage) => {
    if (dragId) {
      moveLead(dragId, stage);
      toast.success("Lid bosqichga o‘tkazildi", { description: LEAD_STAGE_META[stage].label });
    }
    setDragId(null);
    setOverStage(null);
  };

  const save = (v: FormValues) => {
    addLead({
      id: uid("lead"),
      name: v.name,
      parentName: v.parentName,
      phone: v.phone,
      course: v.course,
      source: v.source,
      stage: "new",
      managerId: staff[0]?.id ?? "usr_director",
      nextFollowUp: todayISO(),
      value: v.value,
      createdAt: todayISO(),
    });
    toast.success("Yangi lid yaratildi", { description: `${v.name} — ${v.course}` });
    setDialogOpen(false);
  };

  if (loading) return <PageSkeleton withCards={false} rows={6} />;

  return (
    <>
      <PageHeader
        title="CRM — Qabul"
        subtitle={`${leads.length} ta lid · konversiya ${conversion}%`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus /> Yangi lid
          </Button>
        }
      />

      <div className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Faol pid" value={leads.filter((l) => !["rejected", "accepted"].includes(l.stage)).length} icon={<Target />} hint="Jarayondagi" />
        <StatCard label="Pid qiymati" value={pipelineValue} format={(v) => formatUZSCompact(v)} icon={<TrendingUp />} hint="Oylik potensial" />
        <StatCard label="Konversiya" value={conversion} format={(v) => `${Math.round(v)}%`} icon={<Users />} delta={3.4} hint="Qabul qilish" />
      </div>

      <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-xs">
        <ChevronRight className="size-3.5" /> Kartalarni bosqichlar orasida sudrab tashlang yoki ⬅➡ tugmalari bilan o‘tkazing.
      </p>

      {/* Pipeline board */}
      <div className="scrollbar-none -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:mx-0 lg:px-0">
        {STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          const meta = LEAD_STAGE_META[stage];
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => onDrop(stage)}
              className={cn(
                "flex w-[260px] shrink-0 flex-col rounded-2xl border bg-muted/40 transition-colors",
                overStage === stage && "border-primary/60 bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
                <span className="flex items-center gap-2 text-[13px] font-semibold">
                  <Badge variant={meta.tone === "default" ? "default" : meta.tone} className="gap-1.5">
                    {meta.label}
                  </Badge>
                </span>
                <span className="num text-xs font-semibold text-muted-foreground">{items.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-2.5 pb-2.5" style={{ maxHeight: "58dvh" }}>
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-center">
                    <p className="text-muted-foreground text-xs">Bo‘sh</p>
                  </div>
                ) : (
                  items.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      onClick={() => setSelected(l)}
                      className={cn(
                        "cursor-grab rounded-xl border bg-card p-3 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm active:cursor-grabbing",
                        dragId === l.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-[13px] font-semibold">
                          {l.name} {l.parentName}
                        </p>
                        <span className="num shrink-0 text-[11px] font-semibold text-primary">
                          {formatUZSCompact(l.value)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 truncate text-[11px]">{l.course}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="muted" className="h-4 px-1.5 text-[9px]">
                          {SOURCE_LABELS[l.source]}
                        </Badge>
                        <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                          <CalendarClock className="size-3" />
                          {relativeDayUZ(l.nextFollowUp)}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between border-t pt-2">
                        <button
                          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px] font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            const idx = STAGES.indexOf(l.stage);
                            if (idx > 0) moveLead(l.id, STAGES[idx - 1]!);
                          }}
                          aria-label="Oldingi bosqich"
                        >
                          <ArrowLeft className="size-3" /> Oldinga
                        </button>
                        <button
                          className="text-primary hover:opacity-80 flex items-center gap-1 text-[10px] font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            const idx = STAGES.indexOf(l.stage);
                            if (idx < STAGES.length - 1) moveLead(l.id, STAGES[idx + 1]!);
                          }}
                          aria-label="Keyingi bosqich"
                        >
                          Keyingiga <ArrowRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected ? (
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" />
                {selected.name} {selected.parentName}
              </SheetTitle>
              <SheetDescription>
                {selected.course} · {SOURCE_LABELS[selected.source]}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={LEAD_STAGE_META[selected.stage].tone === "default" ? "default" : LEAD_STAGE_META[selected.stage].tone}>
                  {LEAD_STAGE_META[selected.stage].label}
                </Badge>
                <Badge variant="secondary" className="num">
                  {formatUZS(selected.value)} / oy
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Phone className="size-4" /> Telefon
                  </span>
                  <span className="num font-medium">{selected.phone}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5">
                  <span className="text-muted-foreground">Mas’ul</span>
                  <span className="font-medium">
                    {staff.find((s) => s.id === selected.managerId)?.name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5">
                  <span className="text-muted-foreground">Keyingi aloqa</span>
                  <span className="font-medium">{relativeDayUZ(selected.nextFollowUp)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5">
                  <span className="text-muted-foreground">Qo‘shilgan</span>
                  <span className="num font-medium">{selected.createdAt}</span>
                </div>
              </div>
              {selected.note ? (
                <p className="rounded-xl bg-muted p-3.5 text-sm leading-relaxed">{selected.note}</p>
              ) : null}
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider uppercase">Bosqichni o‘zgartirish</p>
                <div className="grid grid-cols-2 gap-2">
                  {STAGES.filter((s) => s !== selected.stage).map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        moveLead(selected.id, s);
                        setSelected({ ...selected, stage: s });
                        toast.success("Bosqich yangilandi", { description: LEAD_STAGE_META[s].label });
                      }}
                    >
                      {LEAD_STAGE_META[s].label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  toast.success("Aloqa yozuvi yaratildi", {
                    description: "Ota-onaga xabar tayyorlandi (demo).",
                  });
                }}
              >
                <Phone className="size-4" /> Bog‘lanishni belgilash
              </Button>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>

      <LeadDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={save} />
    </>
  );
}

function LeadDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: FormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: { name: "", parentName: "", phone: "", course: "", source: "telegram", value: 500_000 },
  });

  React.useEffect(() => {
    if (open) reset({ name: "", parentName: "", phone: "", course: "", source: "telegram", value: 500_000 });
  }, [open, reset]);

  const courses = [
    "Umumiy o'qish (1-A)", "Ingliz tili B1", "Ingliz tili B2", "Matematika olimpiada",
    "Kimyo laboratoriya", "Informatika (Python)", "Robototexnika", "Suzish",
    "Musiqa (piano)", "Shaxmat", "Rangtasvir", "Dasturlash (Web)",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            Yangi lid
          </DialogTitle>
          <DialogDescription>Murojaat ma'lumotlarini kiriting.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-2">
            <Label htmlFor="ld-name">O‘quvchi ismi</Label>
            <Input id="ld-name" placeholder="Masalan: Jasur" {...register("name")} />
            {errors.name ? <p className="text-danger text-xs">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ld-parent">Ota-ona ismi</Label>
            <Input id="ld-parent" placeholder="Masalan: Toshpo‘latov" {...register("parentName")} />
            {errors.parentName ? <p className="text-danger text-xs">{errors.parentName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ld-phone">Telefon</Label>
            <Input id="ld-phone" placeholder="+998 90 123 45 67" {...register("phone")} />
            {errors.phone ? <p className="text-danger text-xs">{errors.phone.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Manba</Label>
            <Select onValueChange={(v) => setValue("source", v as FormValues["source"])} defaultValue="telegram">
              <SelectTrigger className="w-full" aria-label="Manba">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Kurs</Label>
            <Select onValueChange={(v) => setValue("course", v)}>
              <SelectTrigger className="w-full" aria-label="Kurs tanlash">
                <SelectValue placeholder="Kurs tanlang" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.course ? <p className="text-danger text-xs">{errors.course.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ld-value">Oylik qiymat (so‘m)</Label>
            <Input id="ld-value" type="number" step={50_000} {...register("value")} />
            {errors.value ? <p className="text-danger text-xs">{errors.value.message}</p> : null}
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">Yaratish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
