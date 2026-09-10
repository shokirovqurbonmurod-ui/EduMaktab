"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Award, CalendarDays, Clock3, FileCheck2, ListChecks, Medal, Plus, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton, EmptyState } from "@/components/shared/states";
import { topExamResults } from "@/lib/analytics";
import { fullName, formatDateUZ, todayISO, uid, useDebouncedSafe } from "@/lib/utils-safe";
import type { Exam } from "@/lib/types";

const formSchema = z.object({
  title: z.string().min(5, "Sarlavha kamida 5 belgi bo‘lsin"),
  subjectId: z.string().min(1, "Fan tanlang"),
  classId: z.string().min(1, "Guruh tanlang"),
  date: z.string().min(1, "Sana tanlang"),
  durationMin: z.coerce.number().min(15, "Davr kamida 15 daqiqa").max(240, "Davr 240 daqiqadan oshmasin"),
  questionCount: z.coerce.number().min(1, "Savollar soni kiriting"),
});
type FormValues = z.infer<typeof formSchema>;

export default function ExamsPage() {
  const { exams, classes, subjects, students } = useDataStore();
  const addExam = useDataStore((s) => s.addExam);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fStatus, setFStatus] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Exam | null>(null);
  const { loading } = usePageData(() => exams, []);

  const filtered = exams.filter((e) => {
    if (fStatus !== "all" && e.status !== fStatus) return false;
    if (dq && !e.title.toLowerCase().includes(dq.toLowerCase())) return false;
    return true;
  });

  const top = topExamResults(exams, students, 6);

  const save = (v: FormValues) => {
    addExam({
      id: uid("ex"),
      title: v.title,
      subjectId: v.subjectId,
      classId: v.classId,
      teacherId: "tch_01",
      date: v.date,
      durationMin: v.durationMin,
      questionCount: v.questionCount,
      maxScore: 100,
      status: "scheduled",
      results: [],
    });
    toast.success("Imtihon yaratildi", { description: `${v.title} — ${formatDateUZ(v.date)}` });
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Imtihonlar"
        subtitle={`${exams.length} ta imtihon · ${exams.filter((e) => e.status === "finished").length} ta tugagan`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Imtihon yaratish
          </Button>
        }
      />

      {/* Best results */}
      <Card className="mt-6 brand-gradient-soft border-primary/15">
        <CardHeader className="flex-row items-center">
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <Trophy className="size-4 text-primary" /> Eng yaxshi natijalar
          </CardTitle>
          <Badge variant="secondary" className="num">Top {top.length}</Badge>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border bg-card/70 p-3 backdrop-blur-sm">
              <span
                className={
                  i === 0
                    ? "brand-gradient flex size-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                    : "bg-card flex size-9 items-center justify-center rounded-xl border text-sm font-bold"
                }
              >
                {i + 1}
              </span>
              <Avatar name={fullName(r.student.lastName, r.student.firstName)} hue={r.student.hue} size="sm" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-semibold">{fullName(r.student.lastName, r.student.firstName)}</p>
                <p className="text-muted-foreground truncate text-[11px]">{r.exam}</p>
              </div>
              <Badge variant="success" className="num">
                <Medal className="size-3" /> {r.score}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar value={q} onChange={setQ} placeholder="Imtihon nomi bo‘yicha…" className="flex-1" />
            <FilterBar>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger size="sm" className="w-36" aria-label="Status filtri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="scheduled">Rejada</SelectItem>
                  <SelectItem value="finished">Tugagan</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
          </div>

          {loading ? (
            <PageSkeleton withCards={false} rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<FileCheck2 />} title="Imtihon topilmadi" description="Yangi imtihon yarating yoki filtrlarni o‘zgartiring." />
          ) : (
            <div className="stagger grid gap-3 md:grid-cols-2">
              {filtered.map((e) => {
                const cls = classes.find((c) => c.id === e.classId);
                const subj = subjects.find((s) => s.id === e.subjectId);
                const best = e.results[0];
                return (
                  <button
                    key={e.id}
                    onClick={() => setDetail(e)}
                    className="card-hover rounded-2xl border bg-card p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="brand-gradient-soft flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
                          <Award className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{e.title}</p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {cls?.name} · {subj?.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant={e.status === "finished" ? "success" : "info"}>
                        {e.status === "finished" ? "Tugagan" : "Rejada"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" /> {formatDateUZ(e.date)}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock3 className="size-3.5" /> {e.durationMin} daqiqa
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <ListChecks className="size-3.5" /> {e.questionCount} savol
                      </span>
                      {best ? (
                        <Badge variant="success" className="num ml-auto">
                          Rekord: {best.score}
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={save} />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        {detail ? (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileCheck2 className="size-5 text-primary" />
                {detail.title}
              </DialogTitle>
              <DialogDescription>
                {classes.find((c) => c.id === detail.classId)?.name} · {formatDateUZ(detail.date)} · {detail.durationMin} daqiqa · {detail.questionCount} savol
              </DialogDescription>
            </DialogHeader>
            {detail.results.length === 0 ? (
              <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                Natijalar hali e'lon qilinmagan — imtihon rejada.
              </p>
            ) : (
              <div className="scrollbar-none max-h-[50dvh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>O'rin</TableHead>
                      <TableHead>O'quvchi</TableHead>
                      <TableHead>Ball</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.results.map((r) => {
                      const s = students.find((x) => x.id === r.studentId);
                      return (
                        <TableRow key={r.studentId}>
                          <TableCell>
                            <span
                              className={
                                r.rank <= 3
                                  ? "brand-gradient flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                                  : "num text-sm text-muted-foreground"
                              }
                            >
                              {r.rank}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={s ? fullName(s.lastName, s.firstName) : "?"} hue={s?.hue} size="xs" />
                              <span className="text-[13px] font-medium">{s ? fullName(s.lastName, s.firstName) : "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={r.score >= 85 ? "success" : r.score >= 60 ? "secondary" : "warning"} className="num">
                              {r.score}/100
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetail(null)}>
                Yopish
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: FormValues) => void;
}) {
  const { classes, subjects } = useDataStore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: { title: "", subjectId: "", classId: "", date: "", durationMin: 60, questionCount: 20 },
  });

  React.useEffect(() => {
    if (open) reset({ title: "", subjectId: "", classId: "", date: "", durationMin: 60, questionCount: 20 });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            Yangi imtihon
          </DialogTitle>
          <DialogDescription>Parametrlarni kiritib, imtihon rejaga qo‘shing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="ex-title">Sarlavha</Label>
            <Input id="ex-title" placeholder="Masalan: Matematika — nazorat ishi" {...register("title")} />
            {errors.title ? <p className="text-danger text-xs">{errors.title.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fan</Label>
              <Select onValueChange={(v) => setValue("subjectId", v)}>
                <SelectTrigger className="w-full" aria-label="Fan">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId ? <p className="text-danger text-xs">{errors.subjectId.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Guruh</Label>
              <Select onValueChange={(v) => setValue("classId", v)}>
                <SelectTrigger className="w-full" aria-label="Guruh">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classId ? <p className="text-danger text-xs">{errors.classId.message}</p> : null}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ex-date">Sana</Label>
              <Input id="ex-date" type="date" min={todayISO()} {...register("date")} />
              {errors.date ? <p className="text-danger text-xs">{errors.date.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-dur">Davr (daqiqa)</Label>
              <Input id="ex-dur" type="number" {...register("durationMin")} />
              {errors.durationMin ? <p className="text-danger text-xs">{errors.durationMin.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-q">Savollar</Label>
              <Input id="ex-q" type="number" {...register("questionCount")} />
              {errors.questionCount ? <p className="text-danger text-xs">{errors.questionCount.message}</p> : null}
            </div>
          </div>
          <DialogFooter>
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
