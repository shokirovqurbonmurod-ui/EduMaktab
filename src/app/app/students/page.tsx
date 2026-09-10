"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Award,
  MoreHorizontal,
  Plus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatCard } from "@/components/shared/StatCard";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { NoResults } from "@/components/shared/states";
import { PAYMENT_META, STUDENT_STATUS_META, StatusBadge } from "@/components/shared/StatusBadge";
import { fullName, todayISO, uid, useDebouncedSafe } from "@/lib/utils-safe";
import type { Student } from "@/lib/types";

const formSchema = z.object({
  firstName: z.string().min(2, "Ism kiriting"),
  lastName: z.string().min(2, "Familiya kiriting"),
  gender: z.enum(["male", "female"]),
  classId: z.string().min(1, "Guruh tanlang"),
  parentName: z.string().min(3, "Ota-ona ismini kiriting"),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive", "graduated"]),
});
type FormValues = z.infer<typeof formSchema>;

export default function StudentsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { students, classes, parents } = useDataStore();
  const upsert = useDataStore((s) => s.upsertStudent);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fClass, setFClass] = React.useState("all");
  const [fPay, setFPay] = React.useState("all");
  const [fStatus, setFStatus] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(params.get("new") === "1");
  const [editing, setEditing] = React.useState<Student | null>(null);

  const { loading } = usePageData(() => students, []);

  const filtered = React.useMemo(() => {
    const query = dq.trim().toLowerCase();
    return students.filter((s) => {
      if (query) {
        const name = fullName(s.lastName, s.firstName).toLowerCase();
        if (!name.includes(query) && !s.code.toLowerCase().includes(query)) return false;
      }
      if (fClass !== "all" && s.groupId !== fClass) return false;
      if (fPay !== "all" && s.paymentStatus !== fPay) return false;
      if (fStatus !== "all" && s.status !== fStatus) return false;
      return true;
    });
  }, [students, dq, fClass, fPay, fStatus]);

  const activeFilters = [fClass, fPay, fStatus].filter((v) => v !== "all").length;

  const openEdit = (s: Student) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const save = (v: FormValues) => {
    const existing = editing;
    const cls = classes.find((c) => c.id === v.classId);
    const student: Student = existing
      ? { ...existing, firstName: v.firstName, lastName: v.lastName, gender: v.gender, groupId: v.classId, status: v.status, phone: v.phone || undefined }
      : {
          id: uid("stu"),
          code: `SM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          firstName: v.firstName,
          lastName: v.lastName,
          gender: v.gender,
          birthDate: "2012-05-10",
          groupId: v.classId,
          parentIds: [],
          phone: v.phone || undefined,
          status: v.status,
          joinDate: todayISO(),
          attendanceRate: 100,
          avgGrade: 8,
          paymentStatus: "debt",
          hue: Math.floor(Math.random() * 360),
          behaviorScore: 90,
          certificates: [],
        };
    upsert(student);
    toast.success(existing ? "O‘quvchi yangilandi" : "O‘quvchi qo‘shildi", {
      description: `${fullName(student.lastName, student.firstName)} — ${cls?.name ?? ""}`,
    });
    setDialogOpen(false);
    setEditing(null);
  };

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "F.I.Sh.",
      sortable: true,
      sortValue: (s) => fullName(s.lastName, s.firstName),
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={fullName(s.lastName, s.firstName)} hue={s.hue} size="sm" />
          <div className="leading-tight">
            <p className="font-medium">{fullName(s.lastName, s.firstName)}</p>
            <p className="text-muted-foreground text-xs capitalize">{s.gender === "male" ? "Erkak" : "Ayol"}</p>
          </div>
        </div>
      ),
    },
    { key: "code", header: "ID", hideBelow: "md", cell: (s) => <span className="num text-xs text-muted-foreground">{s.code}</span> },
    {
      key: "class",
      header: "Guruh",
      sortable: true,
      sortValue: (s) => classes.find((c) => c.id === s.groupId)?.name ?? "",
      cell: (s) => <Badge variant="secondary">{classes.find((c) => c.id === s.groupId)?.name ?? "—"}</Badge>,
    },
    {
      key: "phone",
      header: "Telefon",
      hideBelow: "lg",
      cell: (s) => <span className="num text-xs">{s.phone ?? "—"}</span>,
    },
    {
      key: "parent",
      header: "Ota-ona",
      hideBelow: "lg",
      cell: (s) => {
        const p = parents.find((x) => s.parentIds.includes(x.id));
        return <span className="text-[13px]">{p?.name ?? "—"}</span>;
      },
    },
    {
      key: "att",
      header: "Davomat",
      sortable: true,
      sortValue: (s) => s.attendanceRate,
      cell: (s) => (
        <span className={`num text-sm font-semibold ${s.attendanceRate >= 95 ? "text-success" : s.attendanceRate >= 85 ? "text-warning" : "text-danger"}`}>
          {s.attendanceRate}%
        </span>
      ),
    },
    {
      key: "grade",
      header: "O‘rtacha",
      sortable: true,
      sortValue: (s) => s.avgGrade,
      cell: (s) => (
        <span className="inline-flex items-center gap-1 text-sm font-semibold">
          <Award className="size-3.5 text-primary" />
          {s.avgGrade.toFixed(1)}
        </span>
      ),
    },
    {
      key: "pay",
      header: "To‘lov",
      sortable: true,
      sortValue: (s) => (s.paymentStatus === "paid" ? 0 : s.paymentStatus === "partial" ? 1 : 2),
      cell: (s) => {
        const m = PAYMENT_META[s.paymentStatus];
        return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => {
        const m = STUDENT_STATUS_META[s.status];
        return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Amallar">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/app/students/${s.id}`)}>Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(s)}>Tahrirlash</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/app/attendance")}>Davomat</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/app/grades")}>Baholar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/app/payments")}>To‘lovlar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="O‘quvchilar"
        subtitle={`Jami ${students.length} ta o‘quvchi · ${filtered.length} ta ko‘rsatilmoqda`}
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <UserPlus /> O‘quvchi qo‘shish
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Faol o‘quvchilar" value={students.filter((s) => s.status === "active").length} icon={<Users />} delta={1.8} />
        <StatCard label="Qarzdor" value={students.filter((s) => s.paymentStatus === "debt").length} icon={<Wallet />} hint="Joriy oy" />
        <StatCard
          label="O‘rtacha baho"
          value={students.reduce((a, s) => a + s.avgGrade, 0) / Math.max(1, students.length)}
          format={(v) => v.toFixed(2)}
          icon={<Award />}
          delta={0.6}
        />
      </div>

      <Card className="mt-5">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar value={q} onChange={setQ} placeholder="Ism, familiya yoki ID bo‘yicha…" className="flex-1" />
          </div>
          <FilterBar activeCount={activeFilters}>
            <Select value={fClass} onValueChange={setFClass}>
              <SelectTrigger size="sm" className="w-40" aria-label="Guruh filtri">
                <SelectValue placeholder="Barcha guruhlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha guruhlar</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.type === "club" ? "· klub" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fPay} onValueChange={setFPay}>
              <SelectTrigger size="sm" className="w-36" aria-label="To'lov filtri">
                <SelectValue placeholder="To‘lov" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha to‘lovlar</SelectItem>
                <SelectItem value="paid">To‘langan</SelectItem>
                <SelectItem value="partial">Qisman</SelectItem>
                <SelectItem value="debt">Qarzdor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger size="sm" className="w-36" aria-label="Status filtri">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha status</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Nofaol</SelectItem>
                <SelectItem value="graduated">Bitiruvchi</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          <DataTable
            data={filtered}
            columns={columns}
            getRowKey={(s) => s.id}
            loading={loading}
            onRowClick={(s) => router.push(`/app/students/${s.id}`)}
            empty={
              <NoResults
                query={dq}
              />
            }
            pageSize={10}
            mobileCard={(s) => (
              <div key={s.id} onClick={() => router.push(`/app/students/${s.id}`)} className="rounded-2xl border bg-card p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(s.lastName, s.firstName)} hue={s.hue} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate font-medium">{fullName(s.lastName, s.firstName)}</p>
                    <p className="text-muted-foreground text-xs">
                      {classes.find((c) => c.id === s.groupId)?.name} · <span className="num">{s.code}</span>
                    </p>
                  </div>
                  <StatusBadge tone={STUDENT_STATUS_META[s.status].tone}>{STUDENT_STATUS_META[s.status].label}</StatusBadge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="num font-semibold">{s.attendanceRate}%</span>
                    <span className="text-muted-foreground">davomat</span>
                    <span className="num font-semibold">{s.avgGrade.toFixed(1)}</span>
                    <span className="text-muted-foreground">baho</span>
                  </div>
                  <StatusBadge tone={PAYMENT_META[s.paymentStatus].tone}>{PAYMENT_META[s.paymentStatus].label}</StatusBadge>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        onSave={save}
      />
    </>
  );
}

function StudentFormDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Student | null;
  onSave: (v: FormValues) => void;
}) {
  const classes = useDataStore((s) => s.classes);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: "", lastName: "", gender: "male", classId: "", parentName: "", phone: "", status: "active" },
  });

  React.useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          firstName: editing.firstName,
          lastName: editing.lastName,
          gender: editing.gender,
          classId: editing.groupId,
          parentName: "",
          phone: editing.phone ?? "",
          status: editing.status,
        });
      } else {
        reset({ firstName: "", lastName: "", gender: "male", classId: "", parentName: "", phone: "", status: "active" });
      }
    }
  }, [open, editing, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            {editing ? "O‘quvchini tahrirlash" : "Yangi o‘quvchi"}
          </DialogTitle>
          <DialogDescription>
            {editing ? "Ma'lumotlarni yangilang va saqlang." : "Yangi o‘quvchini ro‘yxatdan o‘tkazing."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-2">
            <Label htmlFor="st-first">Ism</Label>
            <Input id="st-first" placeholder="Masalan: Aziz" {...register("firstName")} />
            {errors.firstName ? <p className="text-danger text-xs">{errors.firstName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-last">Familiya</Label>
            <Input id="st-last" placeholder="Masalan: Rahimov" {...register("lastName")} />
            {errors.lastName ? <p className="text-danger text-xs">{errors.lastName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Guruh</Label>
            <Select value={editing?.groupId ?? undefined} onValueChange={(v) => setValue("classId", v)} defaultValue={undefined}>
              <SelectTrigger className="w-full" aria-label="Guruh tanlash">
                <SelectValue placeholder="Guruh tanlang" />
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
            <Label>Jins</Label>
            <Select value="male" onValueChange={(v) => setValue("gender", v as FormValues["gender"])}>
              <SelectTrigger className="w-full" aria-label="Jins">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Erkak</SelectItem>
                <SelectItem value="female">Ayol</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="st-parent">Ota-ona ismi</Label>
            <Input id="st-parent" placeholder="Masalan: Nodira Rahimova" {...register("parentName")} />
            {errors.parentName ? <p className="text-danger text-xs">{errors.parentName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-phone">Telefon (ixtiyoriy)</Label>
            <Input id="st-phone" placeholder="+998 90 123 45 67" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value="active" onValueChange={(v) => setValue("status", v as FormValues["status"])}>
              <SelectTrigger className="w-full" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Nofaol</SelectItem>
                <SelectItem value="graduated">Bitiruvchi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">{editing ? "Saqlash" : "Qo‘shish"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
