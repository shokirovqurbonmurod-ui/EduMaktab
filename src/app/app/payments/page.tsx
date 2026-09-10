"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Banknote,
  CircleDollarSign,
  FileText,
  Percent,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { ChartCard, RangeChips } from "@/components/shared/ChartCard";
import { StatCard } from "@/components/shared/StatCard";
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
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { NoResults } from "@/components/shared/states";
import { PAYMENT_META, StatusBadge } from "@/components/shared/StatusBadge";
import { monthFinance, cashFlowByRange } from "@/lib/analytics";
import {
  formatDateUZ,
  formatNumber,
  formatMonthUZ,
  formatUZS,
  formatUZSCompact,
  fullName,
  todayISO,
  uid,
  useDebouncedSafe,
} from "@/lib/utils-safe";
import type { DateRange, Payment } from "@/lib/types";

const formSchema = z.object({
  studentId: z.string().min(1, "O‘quvchi tanlang"),
  amount: z.coerce.number().min(100_000, "Summa kamida 100 ming so'm"),
  method: z.enum(["cash", "card", "bank"]),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

export default function PaymentsPage() {
  const params = useSearchParams();
  const { payments, students, classes, invoices, cashFlow } = useDataStore();
  const addPayment = useDataStore((s) => s.addPayment);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fStatus, setFStatus] = React.useState("all");
  const [fMethod, setFMethod] = React.useState("all");
  const [range, setRange] = React.useState<DateRange>("1y");
  const [dialogOpen, setDialogOpen] = React.useState(params.get("new") === "1");
  const { loading } = usePageData(() => payments, []);

  const today = todayISO();
  const monthKey = today.slice(0, 7);
  const fin = monthFinance(payments, monthKey);
  const flow = React.useMemo(() => cashFlowByRange(cashFlow, range), [cashFlow, range]);

  const filtered = React.useMemo(() => {
    const query = dq.trim().toLowerCase();
    return payments
      .filter((p) => p.month === monthKey)
      .filter((p) => {
        const s = students.find((x) => x.id === p.studentId);
        if (query && s && !fullName(s.lastName, s.firstName).toLowerCase().includes(query)) return false;
        return true;
      })
      .filter((p) => (fStatus === "all" ? true : p.status === fStatus))
      .filter((p) => (fMethod === "all" ? true : p.method === fMethod))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, students, dq, fStatus, fMethod, monthKey]);

  const invoiceFor = (p: Payment) => invoices.find((i) => i.studentId === p.studentId && i.issuedAt.slice(0, 7) === monthKey);

  const save = (v: FormValues) => {
    const s = students.find((x) => x.id === v.studentId);
    const cls = s ? classes.find((c) => c.id === s.groupId) : undefined;
    const amount = v.amount;
    const expected = cls?.monthlyPayment ?? amount;
    addPayment({
      id: uid("pay"),
      studentId: v.studentId,
      amount,
      date: today,
      month: monthKey,
      method: v.method,
      status: amount >= expected ? "paid" : "partial",
      note: v.note,
    });
    toast.success("To‘lov kiritildi", {
      description: `${s ? fullName(s.lastName, s.firstName) : ""} — ${formatUZS(amount)}`,
    });
    setDialogOpen(false);
  };

  const columns: Column<Payment>[] = [
    {
      key: "student",
      header: "O‘quvchi",
      sortable: true,
      sortValue: (p) => {
        const s = students.find((x) => x.id === p.studentId);
        return s ? fullName(s.lastName, s.firstName) : "";
      },
      cell: (p) => {
        const s = students.find((x) => x.id === p.studentId);
        return (
          <div className="flex items-center gap-3">
            <Avatar name={s ? fullName(s.lastName, s.firstName) : "?"} hue={s?.hue} size="sm" />
            <div className="leading-tight">
              <p className="font-medium">{s ? fullName(s.lastName, s.firstName) : "—"}</p>
              <p className="text-muted-foreground text-xs">
                {s ? classes.find((c) => c.id === s.groupId)?.name : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Summa",
      sortable: true,
      sortValue: (p) => p.amount,
      cell: (p) => <span className="num text-sm font-semibold">{formatUZS(p.amount)}</span>,
    },
    {
      key: "method",
      header: "Usul",
      hideBelow: "md",
      cell: (p) => (
        <Badge variant="muted">
          {p.method === "cash" ? "Naqd" : p.method === "card" ? "Karta" : "Bank"}
        </Badge>
      ),
    },
    {
      key: "invoice",
      header: "Hisob",
      hideBelow: "lg",
      cell: (p) => {
        const inv = invoiceFor(p);
        return inv ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.info("Hisobvara ko‘rsatildi", { description: `${inv.number} — ${formatUZS(inv.amount)}` });
            }}
            className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            <FileText className="size-3.5" /> {inv.number}
          </button>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    { key: "date", header: "Sana", hideBelow: "md", cell: (p) => <span className="num text-xs text-muted-foreground">{formatDateUZ(p.date)}</span> },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (p) => (p.status === "paid" ? 0 : p.status === "partial" ? 1 : 2),
      cell: (p) => {
        const m = PAYMENT_META[p.status];
        return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="To‘lovlar"
        subtitle={formatMonthUZ(monthKey) + " hisob-kitobi"}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> To‘lov kiritish
          </Button>
        }
      />

      {/* Finance dashboard */}
      <div className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Oylik daromad" value={fin.revenue} format={(v) => formatUZSCompact(v)} icon={<CircleDollarSign />} delta={6.2} />
        <StatCard label="Kutilayotgan" value={fin.expected} format={(v) => formatUZSCompact(v)} icon={<Receipt />} hint="To‘liq reja" />
        <StatCard label="To‘langan" value={fin.paid} format={(v) => formatUZSCompact(v)} icon={<Banknote />} delta={5.1} />
        <StatCard label="Qarzdorlik" value={fin.debt} format={(v) => formatUZSCompact(v)} icon={<AlertCircle />} delta={-3.8} hint="Joriy oy" />
        <StatCard label="Chegirmalar" value={Math.round(fin.revenue * 0.04)} format={(v) => formatUZSCompact(v)} icon={<Percent />} hint="4% ulush" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Daromad dinamikasi"
            description="So‘nggi davrlar bo‘yicha (so‘m)"
            action={
              <RangeChips
                value={range}
                onChange={setRange}
                options={[
                  { value: "30d" as DateRange, label: "30 kun" },
                  { value: "3m" as DateRange, label: "3 oy" },
                  { value: "1y" as DateRange, label: "1 yil" },
                ]}
              />
            }
            height={260}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => `${Math.round(v / 100_000_000)}s`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={38} />
                <Tooltip
                  formatter={(value) => [formatUZS(Number(value)), "Daromad"]}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#gRev2)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-3 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="text-primary size-4" /> Joriy oy holati
            </p>
            <div className="space-y-2.5">
              <PayBar label="To‘langan" value={fin.paid} total={fin.expected} cls="bg-success" />
              <PayBar label="Qisman" value={fin.partial} total={fin.expected} cls="bg-warning" />
              <PayBar label="Qarzdor" value={fin.debt} total={fin.expected} cls="bg-danger" />
            </div>
            <div className="space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Umumiy hisobvara</span>
                <span className="num font-semibold">{formatNumber(invoices.length)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">O‘quvchilar</span>
                <span className="num font-semibold">{formatNumber(students.length)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jami to‘lovdagi</span>
                <span className="num font-semibold">{formatUZSCompact(fin.revenue + fin.partial + fin.debt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar value={q} onChange={setQ} placeholder="O‘quvchi bo‘yicha…" className="flex-1" />
            <FilterBar>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger size="sm" className="w-36" aria-label="Status filtri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha status</SelectItem>
                  <SelectItem value="paid">To‘langan</SelectItem>
                  <SelectItem value="partial">Qisman</SelectItem>
                  <SelectItem value="debt">Qarzdor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fMethod} onValueChange={setFMethod}>
                <SelectTrigger size="sm" className="w-32" aria-label="Usul filtri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha usullar</SelectItem>
                  <SelectItem value="cash">Naqd</SelectItem>
                  <SelectItem value="card">Karta</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
          </div>

          <DataTable
            data={filtered}
            columns={columns}
            getRowKey={(p) => p.id}
            loading={loading}
            pageSize={10}
            empty={<NoResults query={dq} />}
            mobileCard={(p) => {
              const s = students.find((x) => x.id === p.studentId);
              return (
                <div key={p.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={s ? fullName(s.lastName, s.firstName) : "?"} hue={s?.hue} size="sm" />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-sm font-medium">{s ? fullName(s.lastName, s.firstName) : "—"}</p>
                      <p className="text-muted-foreground text-xs">{formatDateUZ(p.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="num text-sm font-bold">{formatUZSCompact(p.amount)}</p>
                      <StatusBadge tone={PAYMENT_META[p.status].tone} className="mt-1">
                        {PAYMENT_META[p.status].label}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>

      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={save} />
    </>
  );
}

function PayBar({ label, value, total, cls }: { label: string; value: number; total: number; cls: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="num font-semibold">
          {formatUZSCompact(value)} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: FormValues) => void;
}) {
  const { students, classes } = useDataStore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: { studentId: "", amount: 0, method: "card", note: "" },
  });
  const studentId = watch("studentId");
  const cls = React.useMemo(() => {
    const s = students.find((x) => x.id === studentId);
    return s ? classes.find((c) => c.id === s.groupId) : undefined;
  }, [studentId, students, classes]);

  React.useEffect(() => {
    if (open) reset({ studentId: "", amount: 0, method: "card", note: "" });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            To‘lov kiritish
          </DialogTitle>
          <DialogDescription>O‘quvchi va to‘lov ma'lumotlarini kiriting.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>O‘quvchi</Label>
            <Select onValueChange={(v) => { setValue("studentId", v); if (cls) setValue("amount", cls.monthlyPayment); }}>
              <SelectTrigger className="w-full" aria-label="O‘quvchi tanlash">
                <SelectValue placeholder="O‘quvchi tanlang" />
              </SelectTrigger>
              <SelectContent>
                {students.slice(0, 80).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {fullName(s.lastName, s.firstName)} — {classes.find((c) => c.id === s.groupId)?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.studentId ? <p className="text-danger text-xs">{errors.studentId.message}</p> : null}
            {cls ? (
              <p className="text-muted-foreground text-xs">
                {cls.name} oylik to‘lovi: <span className="num font-semibold text-foreground">{formatUZS(cls.monthlyPayment)}</span>
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Summa (so‘m)</Label>
              <Input id="pay-amount" type="number" step={50_000} {...register("amount")} />
              {errors.amount ? <p className="text-danger text-xs">{errors.amount.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Usul</Label>
              <Select onValueChange={(v) => setValue("method", v as FormValues["method"])} defaultValue="card">
                <SelectTrigger className="w-full" aria-label="To‘lov usuli">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Naqd</SelectItem>
                  <SelectItem value="card">Karta</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-note">Izoh (ixtiyoriy)</Label>
            <Input id="pay-note" placeholder="Masalan: 2-chorak uchun" {...register("note")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">Kiritish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
