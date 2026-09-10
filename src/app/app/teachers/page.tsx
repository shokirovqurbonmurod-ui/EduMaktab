"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Banknote,
  Gauge,
  GraduationCap,
  MoreHorizontal,
  Plus,
  Star,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { NoResults } from "@/components/shared/states";
import { StatCard } from "@/components/shared/StatCard";
import { fullName, formatNumber, useDebouncedSafe } from "@/lib/utils-safe";
import type { Teacher } from "@/lib/types";

const formSchema = z.object({
  firstName: z.string().min(2, "Ism kiriting"),
  lastName: z.string().min(2, "Familiya kiriting"),
  subjectId: z.string().min(1, "Fan tanlang"),
  phone: z.string().min(9, "Telefon raqami kiriting"),
  salary: z.coerce.number().min(1_000_000, "Maosh kamida 1 mln so'm"),
});
type FormValues = z.infer<typeof formSchema>;

export default function TeachersPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { teachers, subjects } = useDataStore();
  const addTeacher = useDataStore((s) => s.addTeacher);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fSubject, setFSubject] = React.useState("all");
  const [fStatus, setFStatus] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(params.get("new") === "1");

  const { loading } = usePageData(() => teachers, []);

  const filtered = React.useMemo(() => {
    const query = dq.trim().toLowerCase();
    return teachers.filter((t) => {
      if (query) {
        if (!fullName(t.lastName, t.firstName).toLowerCase().includes(query)) return false;
      }
      if (fSubject !== "all" && t.subjectId !== fSubject) return false;
      if (fStatus !== "all" && t.status !== fStatus) return false;
      return true;
    });
  }, [teachers, dq, fSubject, fStatus]);

  const save = (v: FormValues) => {
    const t: Teacher = {
      id: `tch_${Date.now().toString(36)}`,
      firstName: v.firstName,
      lastName: v.lastName,
      gender: Math.random() > 0.5 ? "male" : "female",
      subjectId: v.subjectId,
      phone: v.phone,
      email: `${v.firstName[0].toLowerCase()}.${v.lastName.toLowerCase()}@ziyo.uz`,
      hireDate: new Date().toISOString().slice(0, 10),
      status: "active",
      groupsIds: [],
      monthlySalary: v.salary,
      kpiScore: 80,
      rating: 4.2,
      attendanceRate: 100,
      hue: Math.floor(Math.random() * 360),
    };
    addTeacher(t);
    toast.success("O‘qituvchi qo‘shildi", { description: `${fullName(t.lastName, t.firstName)} ro‘yxatga olindi.` });
    setDialogOpen(false);
  };

  const columns: Column<Teacher>[] = [
    {
      key: "name",
      header: "F.I.Sh.",
      sortable: true,
      sortValue: (t) => fullName(t.lastName, t.firstName),
      cell: (t) => (
        <div className="flex items-center gap-3">
          <Avatar name={fullName(t.lastName, t.firstName)} hue={t.hue} size="sm" />
          <div className="leading-tight">
            <p className="font-medium">{fullName(t.lastName, t.firstName)}</p>
            <p className="text-muted-foreground text-xs">{subjects.find((s) => s.id === t.subjectId)?.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Fan",
      sortable: true,
      sortValue: (t) => subjects.find((s) => s.id === t.subjectId)?.name ?? "",
      cell: (t) => <Badge variant="secondary">{subjects.find((s) => s.id === t.subjectId)?.shortName}</Badge>,
    },
    {
      key: "groups",
      header: "Guruhlar",
      hideBelow: "md",
      sortable: true,
      sortValue: (t) => t.groupsIds.length,
      cell: (t) => <span className="num text-sm">{t.groupsIds.length} ta</span>,
    },
    {
      key: "att",
      header: "Davomat",
      hideBelow: "md",
      sortable: true,
      sortValue: (t) => t.attendanceRate,
      cell: (t) => <span className="num text-sm font-semibold">{t.attendanceRate}%</span>,
    },
    {
      key: "kpi",
      header: "KPI",
      sortable: true,
      sortValue: (t) => t.kpiScore,
      cell: (t) => (
        <span className="inline-flex items-center gap-1.5">
          <span className={`num text-sm font-bold ${t.kpiScore >= 85 ? "text-success" : t.kpiScore >= 70 ? "text-warning" : "text-danger"}`}>
            {t.kpiScore}
          </span>
          <span className="text-muted-foreground text-xs">/100</span>
        </span>
      ),
    },
    {
      key: "rating",
      header: "Reyting",
      hideBelow: "lg",
      sortable: true,
      sortValue: (t) => t.rating,
      cell: (t) => (
        <span className="inline-flex items-center gap-1 text-sm font-medium">
          <Star className="size-3.5 fill-warning text-warning" />
          {t.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "salary",
      header: "Maosh",
      hideBelow: "lg",
      sortable: true,
      sortValue: (t) => t.monthlySalary,
      cell: (t) => <span className="num text-sm">{formatNumber(t.monthlySalary / 1_000_000)} mln</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => (
        <Badge variant={t.status === "active" ? "success" : "warning"}>
          {t.status === "active" ? "Faol" : t.status === "vacation" ? "Izolda" : "Chiqib ketgan"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Amallar">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/app/teachers/${t.id}`)}>Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/app/kpi")}>KPI hisoboti</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/app/salaries")}>Maosh</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="O‘qituvchilar"
        subtitle={`Jami ${teachers.length} ta xodim · ${filtered.length} ta ko‘rsatilmoqda`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> O‘qituvchi qo‘shish
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Faol o‘qituvchilar" value={teachers.filter((t) => t.status === "active").length} icon={<UsersRound />} delta={1.2} />
        <StatCard label="O‘rtacha KPI" value={Math.round(teachers.reduce((a, t) => a + t.kpiScore, 0) / Math.max(1, teachers.length))} format={(v) => `${Math.round(v)}/100`} icon={<Gauge />} delta={2.4} />
        <StatCard label="O‘rtacha maosh" value={Math.round(teachers.reduce((a, t) => a + t.monthlySalary, 0) / Math.max(1, teachers.length) / 1000)} format={(v) => `${formatNumber(v)} ming`} icon={<Banknote />} hint="so'm / oy" />
      </div>

      <Card className="mt-5">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar value={q} onChange={setQ} placeholder="Ism yoki familiya bo‘yicha…" className="flex-1" />
          </div>
          <FilterBar activeCount={[fSubject, fStatus].filter((v) => v !== "all").length}>
            <Select value={fSubject} onValueChange={setFSubject}>
              <SelectTrigger size="sm" className="w-40" aria-label="Fan filtri">
                <SelectValue placeholder="Barcha fanlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha fanlar</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger size="sm" className="w-36" aria-label="Status filtri">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="vacation">Izolda</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          <DataTable
            data={filtered}
            columns={columns}
            getRowKey={(t) => t.id}
            loading={loading}
            onRowClick={(t) => router.push(`/app/teachers/${t.id}`)}
            empty={<NoResults query={dq} />}
            pageSize={10}
            mobileCard={(t) => (
              <div key={t.id} onClick={() => router.push(`/app/teachers/${t.id}`)} className="rounded-2xl border bg-card p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(t.lastName, t.firstName)} hue={t.hue} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate font-medium">{fullName(t.lastName, t.firstName)}</p>
                    <p className="text-muted-foreground text-xs">{subjects.find((s) => s.id === t.subjectId)?.name} · {t.groupsIds.length} guruh</p>
                  </div>
                  <Badge variant={t.kpiScore >= 85 ? "success" : "warning"} className="num">KPI {t.kpiScore}</Badge>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <TeacherFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={save} />
    </>
  );
}

function TeacherFormDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: FormValues) => void;
}) {
  const subjects = useDataStore((s) => s.subjects);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: { firstName: "", lastName: "", subjectId: "", phone: "", salary: 4_000_000 },
  });

  React.useEffect(() => {
    if (open) reset({ firstName: "", lastName: "", subjectId: "", phone: "", salary: 4_000_000 });
  }, [open, reset]);

  const salary = watch("salary");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            Yangi o‘qituvchi
          </DialogTitle>
          <DialogDescription>Xodim ma'lumotlarini kiritib, jamoaga qo‘shing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-2">
            <Label htmlFor="tc-first">Ism</Label>
            <Input id="tc-first" {...register("firstName")} />
            {errors.firstName ? <p className="text-danger text-xs">{errors.firstName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tc-last">Familiya</Label>
            <Input id="tc-last" {...register("lastName")} />
            {errors.lastName ? <p className="text-danger text-xs">{errors.lastName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Fan</Label>
            <Select onValueChange={(v) => setValue("subjectId", v)}>
              <SelectTrigger className="w-full" aria-label="Fan tanlash">
                <SelectValue placeholder="Fan tanlang" />
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
            <Label htmlFor="tc-phone">Telefon</Label>
            <Input id="tc-phone" {...register("phone")} />
            {errors.phone ? <p className="text-danger text-xs">{errors.phone.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tc-salary">Oylik maosh (so‘m)</Label>
            <Input id="tc-salary" type="number" step={100000} {...register("salary")} />
            {salary ? <p className="text-muted-foreground num text-xs">= {formatNumber(Number(salary))} so‘m</p> : null}
            {errors.salary ? <p className="text-danger text-xs">{errors.salary.message}</p> : null}
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
