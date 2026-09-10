"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BookOpenCheck, Clock, FileText, Paperclip, Plus, Star, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { fullName, formatDateUZ, relativeDayUZ, todayISO, uid, useDebouncedSafe } from "@/lib/utils-safe";
import type { Homework } from "@/lib/types";

const formSchema = z.object({
  title: z.string().min(5, "Sarlavha kamida 5 belgi bo‘lsin"),
  classId: z.string().min(1, "Guruh tanlang"),
  subjectId: z.string().min(1, "Fan tanlang"),
  dueDate: z.string().min(1, "Muddatni tanlang"),
  description: z.string().min(10, "Tavsif kamida 10 belgi bo‘lsin"),
});
type FormValues = z.infer<typeof formSchema>;

export default function HomeworkPage() {
  const { homework, classes, subjects, students, teachers } = useDataStore();
  const addHomework = useDataStore((s) => s.addHomework);
  const gradeSubmission = useDataStore((s) => s.gradeSubmission);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fClass, setFClass] = React.useState("all");
  const [fStatus, setFStatus] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Homework | null>(null);
  const { loading } = usePageData(() => homework, []);

  const filtered = homework.filter((h) => {
    if (fClass !== "all" && h.classId !== fClass) return false;
    if (fStatus !== "all" && h.status !== fStatus) return false;
    if (dq && !h.title.toLowerCase().includes(dq.toLowerCase())) return false;
    return true;
  });

  const save = (v: FormValues) => {
    const cls = classes.find((c) => c.id === v.classId);
    addHomework({
      id: uid("hw"),
      title: v.title,
      subjectId: v.subjectId,
      classId: v.classId,
      teacherId: teachers[0]?.id ?? "tch_01",
      description: v.description,
      dueDate: v.dueDate,
      createdAt: todayISO(),
      totalStudents: cls?.studentCount ?? 20,
      submittedCount: 0,
      submissions: [],
      status: "open",
    });
    toast.success("Uy vazifa yaratildi", { description: `${v.title} — ${cls?.name}` });
    setDialogOpen(false);
  };

  const giveGrade = (hwId: string, studentId: string, grade: number) => {
    gradeSubmission(hwId, studentId, grade);
    toast.success("Baho qo‘yildi", { description: `${grade} ball` });
    setDetail((d) => (d && d.id === hwId ? { ...d, submissions: d.submissions.map((s) => (s.studentId === studentId ? { ...s, grade } : s)) } : d));
  };

  return (
    <>
      <PageHeader
        title="Uy vazifalar"
        subtitle={`${homework.length} ta vazifa · ${homework.filter((h) => h.status === "open").length} ta ochiq`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Yangi vazifa
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar value={q} onChange={setQ} placeholder="Vazifa nomi bo‘yicha…" className="flex-1" />
            <FilterBar>
              <Select value={fClass} onValueChange={setFClass}>
                <SelectTrigger size="sm" className="w-36" aria-label="Guruh filtri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha guruhlar</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger size="sm" className="w-36" aria-label="Status filtri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="open">Ochiq</SelectItem>
                  <SelectItem value="grading">Baholanmoqda</SelectItem>
                  <SelectItem value="closed">Tugagan</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
          </div>

          {loading ? (
            <PageSkeleton withCards={false} rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<BookOpenCheck />} title="Vazifa topilmadi" description="Yangi uy vazifa yarating yoki filtrlarni o‘zgartiring." />
          ) : (
            <div className="stagger grid gap-3 md:grid-cols-2">
              {filtered.map((h) => {
                const cls = classes.find((c) => c.id === h.classId);
                const subj = subjects.find((s) => s.id === h.subjectId);
                const teacher = teachers.find((t) => t.id === h.teacherId);
                const overdue = h.dueDate < todayISO();
                const progress = Math.round((h.submittedCount / Math.max(1, h.totalStudents)) * 100);
                return (
                  <button
                    key={h.id}
                    onClick={() => setDetail(h)}
                    className="card-hover rounded-2xl border bg-card p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="brand-gradient-soft flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
                        <BookOpenCheck className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{h.title}</p>
                        <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                          <span>{cls?.name}</span>·<span>{subj?.name}</span>·
                          <span>{teacher ? fullName(teacher.lastName, teacher.firstName) : "—"}</span>
                        </p>
                      </div>
                      <Badge variant={h.status === "open" ? "success" : h.status === "grading" ? "warning" : "muted"}>
                        {h.status === "open" ? "Ochiq" : h.status === "grading" ? "Baholanmoqda" : "Tugagan"}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="size-3.5" /> {h.submittedCount}/{h.totalStudents} topshirdi
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${overdue ? "text-danger" : "text-muted-foreground"}`}>
                          <Clock className="size-3.5" /> {relativeDayUZ(h.dueDate)}
                        </span>
                      </div>
                      <Progress value={progress} classNameIndicator={progress > 80 ? "bg-success" : "bg-primary"} />
                      {h.fileName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-[11px]">
                          <Paperclip className="size-3" /> {h.fileName}
                        </span>
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
                <FileText className="size-5 text-primary" />
                {detail.title}
              </DialogTitle>
              <DialogDescription>
                {classes.find((c) => c.id === detail.classId)?.name} · muddat: {formatDateUZ(detail.dueDate)} · {detail.submittedCount}/{detail.totalStudents} topshirildi
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-relaxed">{detail.description}</p>
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase">Topshiriqlar</p>
              {detail.submissions.length === 0 ? (
                <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                  Hali topshiriq yo‘q.
                </p>
              ) : (
                detail.submissions.map((s) => {
                  const stu = students.find((x) => x.id === s.studentId);
                  return (
                    <div key={s.studentId} className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
                      <Avatar name={stu ? fullName(stu.lastName, stu.firstName) : "?"} hue={stu?.hue} size="sm" />
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-sm font-medium">{stu ? fullName(stu.lastName, stu.firstName) : "O‘quvchi"}</p>
                        <p className="text-muted-foreground text-[11px]">{formatDateUZ(s.submittedAt)}</p>
                      </div>
                      {s.grade != null ? (
                        <Badge variant="success" className="num">
                          <Star className="size-3" /> {s.grade}
                        </Badge>
                      ) : (
                        <div className="flex gap-1">
                          {[7, 8, 9, 10].map((g) => (
                            <button
                              key={g}
                              onClick={() => giveGrade(detail.id, s.studentId, g)}
                              className="num h-7 w-7 rounded-lg border text-xs font-semibold transition-all hover:border-primary hover:text-primary"
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
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
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", classId: "", subjectId: "", dueDate: "", description: "" },
  });
  const [file, setFile] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      reset({ title: "", classId: "", subjectId: "", dueDate: "", description: "" });
      setFile(null);
    }
  }, [open, reset]);

  React.useEffect(() => {
    setValue("classId", watch("classId") ?? "");
  }, [watch, setValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            Yangi uy vazifa
          </DialogTitle>
          <DialogDescription>Guruh, fan va muddatni belgilang.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="hw-title">Sarlavha</Label>
            <Input id="hw-title" placeholder="Masalan: 12-dars bo‘yicha vazifa" {...register("title")} />
            {errors.title ? <p className="text-danger text-xs">{errors.title.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Guruh</Label>
              <Select onValueChange={(v) => setValue("classId", v)}>
                <SelectTrigger className="w-full" aria-label="Guruh tanlash">
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
            <div className="space-y-2">
              <Label>Fan</Label>
              <Select onValueChange={(v) => setValue("subjectId", v)}>
                <SelectTrigger className="w-full" aria-label="Fan tanlash">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="hw-due">Muddat</Label>
            <Input id="hw-due" type="date" {...register("dueDate")} />
            {errors.dueDate ? <p className="text-danger text-xs">{errors.dueDate.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hw-desc">Tavsif</Label>
            <Textarea id="hw-desc" rows={3} placeholder="Vazifa talab…" {...register("description")} />
            {errors.description ? <p className="text-danger text-xs">{errors.description.message}</p> : null}
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
            <Paperclip className="size-4" />
            {file ?? "Fayl ulash (PDF, doc, rasm — demo)"}
            <input
              type="file"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
            />
          </label>
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
