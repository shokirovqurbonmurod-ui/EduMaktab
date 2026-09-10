"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Award, Plus, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
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
import { fullName, todayISO, uid, useDebouncedSafe } from "@/lib/utils-safe";
import { subjectAverages } from "@/lib/analytics";
import { gradeTypeLabel } from "@/app/app/students/[id]/page";
import type { GradeType } from "@/lib/types";

const formSchema = z.object({
  studentId: z.string().min(1, "O‘quvchi tanlang"),
  subjectId: z.string().min(1, "Fan tanlang"),
  type: z.enum(["homework", "test", "exam", "participation"]),
  value: z.coerce.number().min(2, "Baho 2 dan katta bo‘lsin").max(10, "Baho 10 dan katta bo‘lmasligi kerak"),
});
type FormValues = z.infer<typeof formSchema>;

export default function GradesPage() {
  const { grades, students, classes, subjects, teachers } = useDataStore();
  const addGrade = useDataStore((s) => s.addGrade);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fClass, setFClass] = React.useState("cls_9a");
  const [fSubject, setFSubject] = React.useState("all");
  const [fType, setFType] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { loading } = usePageData(() => grades, []);

  const cls = classes.find((c) => c.id === fClass) ?? classes[0]!;
  const clsStudents = React.useMemo(
    () => students.filter((s) => s.groupId === cls.id).filter((s) => !dq || fullName(s.lastName, s.firstName).toLowerCase().includes(dq.toLowerCase())),
    [students, cls.id, dq],
  );

  const filtered = React.useMemo(() => {
    return grades
      .filter((g) => clsStudents.some((s) => s.id === g.studentId))
      .filter((g) => (fSubject === "all" ? true : g.subjectId === fSubject))
      .filter((g) => (fType === "all" ? true : g.type === fType))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [grades, clsStudents, fSubject, fType]);

  const averages = React.useMemo(
    () =>
      subjectAverages(grades.filter((g) => clsStudents.some((s) => s.id === g.studentId))).map((a) => ({
        ...a,
        label: subjects.find((s) => s.id === a.name)?.shortName ?? a.name,
        full: subjects.find((s) => s.id === a.name)?.name ?? a.name,
      })),
    [grades, clsStudents, subjects],
  );

  const save = (v: FormValues) => {
    addGrade({
      id: uid("gr"),
      studentId: v.studentId,
      subjectId: v.subjectId,
      type: v.type,
      value: v.value,
      date: todayISO(),
      teacherId: teachers[0]?.id ?? "tch_01",
    });
    toast.success("Baho qo‘shildi", {
      description: `${fullName((students.find((s) => s.id === v.studentId) ?? { firstName: "", lastName: "" }).lastName, (students.find((s) => s.id === v.studentId) ?? { firstName: "", lastName: "" }).firstName)} — ${v.value} ball (${gradeTypeLabel(v.type)})`,
    });
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Baholar"
        subtitle={`${cls.name} guruhi · ${filtered.length} ta baho`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Baho qo‘shish
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="text-primary size-4" /> Fanlar bo‘yicha o‘rtacha
              </p>
              <Badge variant="secondary" className="num">O‘rtacha: {(averages.reduce((a, x) => a + x.avg, 0) / Math.max(1, averages.length)).toFixed(1)}/10</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={averages} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={26} />
                  <Tooltip
                    formatter={(v, _n, item) => [`${v}/10`, (item?.payload as { full?: string })?.full ?? ""]}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {averages.map((a, i) => (
                      <Cell key={i} fill={a.avg >= 8 ? "var(--chart-2)" : a.avg >= 6 ? "var(--chart-1)" : "var(--chart-4)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {averages.slice(0, 7).map((a) => (
                <span key={a.label} className="text-[11px]">
                  <span className="text-muted-foreground">{a.label}:</span> <b className="num">{a.avg.toFixed(1)}</b>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="brand-gradient-soft border-primary/15">
          <CardContent className="flex h-full flex-col justify-center gap-4 p-6">
            <p className="flex items-center gap-2 font-semibold">
              <Award className="text-primary size-5" /> Guruh reytingi
            </p>
            {clsStudents
              .map((s) => ({ s, g: grades.filter((x) => x.studentId === s.id) }))
              .map((x) => ({
                s: x.s,
                avg: x.g.length ? x.g.reduce((a, b) => a + b.value, 0) / x.g.length : 0,
              }))
              .sort((a, b) => b.avg - a.avg)
              .slice(0, 5)
              .map((x, i) => (
                <div key={x.s.id} className="flex items-center gap-3">
                  <span
                    className={
                      i === 0
                        ? "brand-gradient flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                        : "bg-card flex size-7 items-center justify-center rounded-lg text-xs font-bold"
                    }
                  >
                    {i + 1}
                  </span>
                  <Avatar name={fullName(x.s.lastName, x.s.firstName)} hue={x.s.hue} size="xs" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{fullName(x.s.lastName, x.s.firstName)}</p>
                  <span className="num text-sm font-bold">{x.avg.toFixed(1)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchBar value={q} onChange={setQ} placeholder="O‘quvchi qidirish…" className="flex-1" />
            <FilterBar>
              <Select value={fClass} onValueChange={setFClass}>
                <SelectTrigger size="sm" className="w-36" aria-label="Guruh">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes.filter((c) => c.type === "class").map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fSubject} onValueChange={setFSubject}>
                <SelectTrigger size="sm" className="w-36" aria-label="Fan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha fanlar</SelectItem>
                  {subjects.slice(0, 7).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fType} onValueChange={setFType}>
                <SelectTrigger size="sm" className="w-36" aria-label="Tur">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="homework">Uy vazifasi</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="exam">Imtihon</SelectItem>
                  <SelectItem value="participation">Faollik</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
          </div>

          {loading ? (
            <PageSkeleton withCards={false} rows={8} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Award />} title="Baho topilmadi" description="Filtrlarni o‘zgartiring yoki baho qo‘shing." />
          ) : (
            <div className="scrollbar-none -mx-5 overflow-x-auto px-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>O‘quvchi</TableHead>
                    <TableHead>Fan</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Baho</TableHead>
                    <TableHead>Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 60).map((g) => {
                    const s = students.find((x) => x.id === g.studentId);
                    if (!s) return null;
                    return (
                      <TableRow key={g.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={fullName(s.lastName, s.firstName)} hue={s.hue} size="xs" />
                            <span className="text-[13px] font-medium">{fullName(s.lastName, s.firstName)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{subjects.find((x) => x.id === g.subjectId)?.shortName}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[13px]">{gradeTypeLabel(g.type)}</TableCell>
                        <TableCell>
                          <Badge variant={g.value >= 8 ? "success" : g.value >= 6 ? "secondary" : "warning"} className="num">
                            {g.value}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground num text-xs">{g.date}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <GradeDialog open={dialogOpen} onOpenChange={setDialogOpen} students={clsStudents} onSave={save} />
    </>
  );
}

function GradeDialog({
  open,
  onOpenChange,
  students,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: { id: string; firstName: string; lastName: string }[];
  onSave: (v: FormValues) => void;
}) {
  const subjects = useDataStore((s) => s.subjects);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: { studentId: "", subjectId: "", type: "homework", value: 8 },
  });

  React.useEffect(() => {
    if (open) reset({ studentId: "", subjectId: "", type: "homework", value: 8 });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            Baho qo‘shish
          </DialogTitle>
          <DialogDescription>O‘quvchi, fan va bahoni kiriting.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>O‘quvchi</Label>
            <Select onValueChange={(v) => setValue("studentId", v)}>
              <SelectTrigger className="w-full" aria-label="O‘quvchi tanlash">
                <SelectValue placeholder="O‘quvchi tanlang" />
              </SelectTrigger>
              <SelectContent>
                {students.slice(0, 50).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {fullName(s.lastName, s.firstName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.studentId ? <p className="text-danger text-xs">{errors.studentId.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fan</Label>
              <Select onValueChange={(v) => setValue("subjectId", v)}>
                <SelectTrigger className="w-full" aria-label="Fan tanlash">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.slice(0, 7).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId ? <p className="text-danger text-xs">{errors.subjectId.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Turi</Label>
              <Select onValueChange={(v) => setValue("type", v as GradeType)} defaultValue="homework">
                <SelectTrigger className="w-full" aria-label="Baho turi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homework">Uy vazifasi</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="exam">Imtihon</SelectItem>
                  <SelectItem value="participation">Faollik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gr-val">Baho (2–10)</Label>
            <Input id="gr-val" type="number" min={2} max={10} step={1} {...register("value")} />
            {errors.value ? <p className="text-danger text-xs">{errors.value.message}</p> : null}
          </div>
          <DialogFooter>
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
