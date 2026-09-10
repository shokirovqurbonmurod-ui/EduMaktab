"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CalendarDays,
  Layers,
  MoreHorizontal,
  Plus,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton, EmptyState } from "@/components/shared/states";
import { fullName, formatPercent, formatUZSCompact, useDebouncedSafe, WEEKDAYS_UZ_SHORT } from "@/lib/utils-safe";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Guruh nomi kiriting"),
  type: z.enum(["class", "club"]),
  teacherId: z.string().min(1, "O‘qituvchi tanlang"),
  room: z.string().min(1, "Xona kiriting"),
  monthlyPayment: z.coerce.number().min(100_000, "Oylik to‘lov kamida 100 ming so'm"),
});
type FormValues = z.infer<typeof formSchema>;

export default function ClassesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { classes, teachers, subjects } = useDataStore();
  const addClass = useDataStore((s) => s.addClass);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fType, setFType] = React.useState<"all" | "class" | "club">("all");
  const [dialogOpen, setDialogOpen] = React.useState(params.get("new") === "1");
  const [selected, setSelected] = React.useState<string | null>(null);
  const { loading } = usePageData(() => classes, []);

  const filtered = classes.filter((c) => {
    if (fType !== "all" && c.type !== fType) return false;
    if (dq && !c.name.toLowerCase().includes(dq.toLowerCase())) return false;
    return true;
  });

  const core = classes.filter((c) => c.type === "class");
  const clubs = classes.filter((c) => c.type === "club");

  const save = (v: FormValues) => {
    const id = `cls_new_${Date.now().toString(36)}`;
    addClass({
      id,
      name: v.name,
      type: v.type,
      teacherId: v.teacherId,
      studentCount: 0,
      room: v.room,
      attendanceRate: 100,
      avgResult: 80,
      monthlyPayment: v.monthlyPayment,
      hue: Math.floor(Math.random() * 360),
      schedule: [],
      description: v.type === "class" ? "Asosiy o‘quv guruhi" : "Qo‘shimcha guruh",
    });
    toast.success("Guruh yaratildi", { description: `${v.name} — ${v.room}-xona` });
    setDialogOpen(false);
  };

  if (loading) return <PageSkeleton withCards={false} />;

  return (
    <>
      <PageHeader
        title="Guruhlar"
        subtitle={`${core.length} ta asosiy sinf · ${clubs.length} ta qo‘shimcha guruh`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Guruh yaratish
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={q} onChange={setQ} placeholder="Guruh nomi bo‘yicha…" className="flex-1" />
        <div className="flex gap-2">
          {(
            [
              { v: "all", l: "Barchasi" },
              { v: "class", l: "Asosiy sinflar" },
              { v: "club", l: "Qo‘shimcha" },
            ] as const
          ).map((o) => (
            <Button
              key={o.v}
              variant={fType === o.v ? "default" : "outline"}
              size="sm"
              onClick={() => setFType(o.v)}
            >
              {o.l}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={<Layers />} title="Guruh topilmadi" description="Qidiruv yoki filtrni o‘zgartirib ko‘ring." />
        </div>
      ) : (
        <div className="stagger mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const teacher = teachers.find((t) => t.id === c.teacherId);
            const sel = selected === c.id;
            return (
              <Card key={c.id} className={cn("card-hover overflow-hidden", sel && "border-primary/50")}>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-11 items-center justify-center rounded-2xl text-sm font-bold text-white"
                        style={{ background: `linear-gradient(135deg, hsl(${c.hue} 65% 55%), hsl(${(c.hue + 40) % 360} 60% 45%))` }}
                      >
                        {c.type === "class" ? c.name : c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="leading-tight">
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {c.type === "class" ? "Asosiy sinf" : "Qo‘shimcha guruh"} · {c.room}-xona
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Guruh amallari">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelected(sel ? null : c.id)}>
                          {sel ? "Batafsil yopish" : "Batafsil ko‘rish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/app/attendance")}>Davomat</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/app/schedule")}>Jadval</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/app/payments")}>To‘lovlar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Avatar name={teacher ? fullName(teacher.lastName, teacher.firstName) : "?"} hue={teacher?.hue} size="sm" />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[13px] font-medium">
                        {teacher ? fullName(teacher.lastName, teacher.firstName) : "—"}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {subjects.find((s) => s.id === teacher?.subjectId)?.name ?? "Sinf mudiri"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-muted/60 px-2 py-2">
                      <p className="num text-sm font-bold">{c.studentCount}</p>
                      <p className="text-muted-foreground text-[10px]">o‘quvchi</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 px-2 py-2">
                      <p className={`num text-sm font-bold ${c.attendanceRate >= 93 ? "text-success" : "text-warning"}`}>
                        {c.attendanceRate}%
                      </p>
                      <p className="text-muted-foreground text-[10px]">davomat</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 px-2 py-2">
                      <p className="num text-sm font-bold">{c.avgResult}%</p>
                      <p className="text-muted-foreground text-[10px]">natija</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Samaradorlik</span>
                      <span className="num font-semibold">{c.avgResult}/100</span>
                    </div>
                    <Progress value={c.avgResult} classNameIndicator={c.avgResult >= 85 ? "bg-success" : "bg-primary"} />
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Wallet className="size-3.5" /> {formatUZSCompact(c.monthlyPayment)} / o‘quvchi
                    </span>
                    <Badge variant="secondary" className="num">
                      {formatPercent(c.attendanceRate)}
                    </Badge>
                  </div>

                  {sel ? (
                    <div className="space-y-2 rounded-2xl border bg-muted/40 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold">
                        <CalendarDays className="size-3.5 text-primary" /> Haftalik jadval
                      </p>
                      {c.schedule.slice(0, 4).map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {WEEKDAYS_UZ_SHORT[s.day]} · {s.start}
                          </span>
                          <span className="font-medium">{subjects.find((x) => x.id === s.subjectId)?.name}</span>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full gap-1 text-primary" onClick={() => router.push("/app/schedule")}>
                        To‘liq jadval <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ClassFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={save} />
    </>
  );
}

function ClassFormDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: FormValues) => void;
}) {
  const teachers = useDataStore((s) => s.teachers);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: { name: "", type: "class", teacherId: "", room: "", monthlyPayment: 1_100_000 },
  });

  React.useEffect(() => {
    if (open) reset({ name: "", type: "class", teacherId: "", room: "", monthlyPayment: 1_100_000 });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            Yangi guruh
          </DialogTitle>
          <DialogDescription>Yangi o‘quv yoki qo‘shimcha guruh yaratish.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cl-name">Guruh nomi</Label>
            <Input id="cl-name" placeholder="Masalan: 11-B yoki Ingliz tili C1" {...register("name")} />
            {errors.name ? <p className="text-danger text-xs">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Turi</Label>
            <Select onValueChange={(v) => setValue("type", v as FormValues["type"])} defaultValue="class">
              <SelectTrigger className="w-full" aria-label="Guruh turi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Asosiy sinf</SelectItem>
                <SelectItem value="club">Qo‘shimcha guruh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-room">Xona</Label>
            <Input id="cl-room" placeholder="Masalan: 402" {...register("room")} />
            {errors.room ? <p className="text-danger text-xs">{errors.room.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Mas’ul o‘qituvchi</Label>
            <Select onValueChange={(v) => setValue("teacherId", v)}>
              <SelectTrigger className="w-full" aria-label="O‘qituvchi tanlash">
                <SelectValue placeholder="O‘qituvchi tanlang" />
              </SelectTrigger>
              <SelectContent>
                {teachers.slice(0, 40).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {fullName(t.lastName, t.firstName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.teacherId ? <p className="text-danger text-xs">{errors.teacherId.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cl-pay">Oylik to‘lov (so‘m / o‘quvchi)</Label>
            <Input id="cl-pay" type="number" step={50000} {...register("monthlyPayment")} />
            {errors.monthlyPayment ? <p className="text-danger text-xs">{errors.monthlyPayment.message}</p> : null}
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
