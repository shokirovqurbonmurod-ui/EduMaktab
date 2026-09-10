"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Home, Plus, Receipt, Wrench, Utensils, Car, Megaphone, Package, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { ChartCard } from "@/components/shared/ChartCard";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
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
import { NoResults } from "@/components/shared/states";
import { EXPENSE_CATEGORIES } from "@/components/shared/StatusBadge";
import {
  addDaysISO,
  formatDateUZ,
  formatUZS,
  formatUZSCompact,
  todayISO,
  uid,
  useDebouncedSafe,
} from "@/lib/utils-safe";
import type { Expense, ExpenseCategory } from "@/lib/types";

const CAT_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  rent: <Home />,
  utilities: <Home />,
  food: <Utensils />,
  materials: <Package />,
  repairs: <Wrench />,
  transport: <Car />,
  marketing: <Megaphone />,
  other: <MoreHorizontal />,
};

const formSchema = z.object({
  title: z.string().min(3, "Nomi kiriting"),
  category: z.enum(["rent", "utilities", "food", "materials", "repairs", "transport", "marketing", "other"]),
  amount: z.coerce.number().min(10_000, "Summa kamida 10 ming so'm"),
  method: z.enum(["cash", "card", "bank"]),
});
type FormValues = z.infer<typeof formSchema>;

export default function ExpensesPage() {
  const { expenses } = useDataStore();
  const addExpense = useDataStore((s) => s.addExpense);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [fCat, setFCat] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { loading } = usePageData(() => expenses, []);

  const monthKey = todayISO().slice(0, 7);
  const monthExp = expenses.filter((e) => e.date.slice(0, 7) === monthKey);
  const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0);
  const last30 = React.useMemo(
    () => expenses.filter((e) => e.date >= addDaysISO(todayISO(), -30)),
    [expenses],
  );
  const last30Total = last30.reduce((s, e) => s + e.amount, 0);

  const byCat = React.useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of last30) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries())
      .map(([cat, value]) => ({ cat, label: EXPENSE_CATEGORIES[cat]?.label ?? cat, value }))
      .sort((a, b) => b.value - a.value);
  }, [last30]);

  const catColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--chart-1)", "var(--chart-2)"];

  const byWeek = React.useMemo(() => {
    const out: { label: string; total: number }[] = [];
    for (let w = 11; w >= 0; w--) {
      const start = addDaysISO(todayISO(), -(w * 7 + 6));
      const end = addDaysISO(todayISO(), -w * 7);
      const total = expenses
        .filter((e) => e.date >= start && e.date <= end)
        .reduce((s, e) => s + e.amount, 0);
      out.push({ label: `${start.slice(8, 10)}.${start.slice(5, 7)}`, total });
    }
    return out;
  }, [expenses]);

  const filtered = React.useMemo(() => {
    return expenses
      .filter((e) => (fCat === "all" ? true : e.category === fCat))
      .filter((e) => !dq || e.title.toLowerCase().includes(dq.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, fCat, dq]);

  const save = (v: FormValues) => {
    addExpense({
      id: uid("exp"),
      title: v.title,
      category: v.category,
      amount: v.amount,
      date: todayISO(),
      paidBy: "Direktor",
      method: v.method,
    });
    toast.success("Xarajat qo‘shildi", { description: `${v.title} — ${formatUZS(v.amount)}` });
    setDialogOpen(false);
  };

  const columns: Column<Expense>[] = [
    {
      key: "title",
      header: "Xarajat",
      sortable: true,
      sortValue: (e) => e.title,
      cell: (e) => (
        <div className="flex items-center gap-3">
          <span className="bg-muted flex size-9 items-center justify-center rounded-xl text-muted-foreground [&_svg]:size-4">
            {CAT_ICONS[e.category]}
          </span>
          <div className="leading-tight">
            <p className="font-medium">{e.title}</p>
            <p className="text-muted-foreground text-xs">{e.paidBy}</p>
          </div>
        </div>
      ),
    },
    {
      key: "cat",
      header: "Kategoriya",
      sortable: true,
      sortValue: (e) => e.category,
      cell: (e) => (
        <Badge variant="secondary">{EXPENSE_CATEGORIES[e.category]?.label ?? e.category}</Badge>
      ),
    },
    {
      key: "amount",
      header: "Summa",
      sortable: true,
      sortValue: (e) => e.amount,
      cell: (e) => <span className="num text-sm font-semibold">{formatUZS(e.amount)}</span>,
    },
    {
      key: "method",
      header: "Usul",
      hideBelow: "md",
      cell: (e) => (
        <Badge variant="muted">{e.method === "cash" ? "Naqd" : e.method === "card" ? "Karta" : "Bank"}</Badge>
      ),
    },
    { key: "date", header: "Sana", sortable: true, sortValue: (e) => e.date, cell: (e) => <span className="num text-xs text-muted-foreground">{formatDateUZ(e.date)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Xarajatlar"
        subtitle={`Joriy oy: ${formatUZS(monthTotal)} · 30 kun: ${formatUZS(last30Total)}`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Xarajat qo‘shish
          </Button>
        }
      />

      <div className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Joriy oy xarajat" value={monthTotal} format={(v) => formatUZSCompact(v)} icon={<Receipt />} delta={-2.4} />
        <StatCard label="So‘nggi 30 kun" value={last30Total} format={(v) => formatUZSCompact(v)} icon={<Receipt />} hint={`${last30.length} ta yozuv`} />
        <StatCard label="Eng katta band" value={byCat[0]?.value ?? 0} format={(v) => formatUZSCompact(v)} icon={<Home />} hint={byCat[0]?.label ?? ""} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Haftalik xarajatlar" description="So‘nggi 12 hafta" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byWeek} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={34} />
                <Tooltip
                  formatter={(value) => [formatUZS(Number(value)), "Xarajat"]}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="var(--chart-4)" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <ChartCard title="Kategoriyalar bo‘yicha" description="30 kunlik ulush" height={260} bodyClassName="px-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byCat} dataKey="value" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                {byCat.map((_, i) => (
                  <Cell key={i} fill={catColors[i % catColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatUZS(Number(value))}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 px-4 pb-3">
            {byCat.slice(0, 6).map((c, i) => (
              <span key={c.cat} className="flex items-center gap-1.5 text-[11px]">
                <span className="size-2 rounded-full" style={{ background: catColors[i] }} />
                <span className="truncate text-muted-foreground">{c.label}</span>
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <Card className="mt-5">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar value={q} onChange={setQ} placeholder="Xarajat nomi bo‘yicha…" className="flex-1" />
            <FilterBar>
              <Select value={fCat} onValueChange={setFCat}>
                <SelectTrigger size="sm" className="w-40" aria-label="Kategoriya filtri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha kategoriya</SelectItem>
                  {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterBar>
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            getRowKey={(e) => e.id}
            loading={loading}
            pageSize={10}
            empty={<NoResults query={dq} />}
            mobileCard={(e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
                <span className="bg-muted flex size-10 items-center justify-center rounded-xl text-muted-foreground [&_svg]:size-4.5">
                  {CAT_ICONS[e.category]}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {EXPENSE_CATEGORIES[e.category]?.label} · {formatDateUZ(e.date)}
                  </p>
                </div>
                <span className="num text-sm font-bold">{formatUZSCompact(e.amount)}</span>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={save} />
    </>
  );
}

function ExpenseDialog({
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
    defaultValues: { title: "", category: "materials", amount: 0, method: "card" },
  });

  React.useEffect(() => {
    if (open) reset({ title: "", category: "materials", amount: 0, method: "card" });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            Yangi xarajat
          </DialogTitle>
          <DialogDescription>Xarajat ma'lumotlarini kiriting.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="ex-title">Nomi</Label>
            <Input id="ex-title" placeholder="Masalan: O‘quv materiallari" {...register("title")} />
            {errors.title ? <p className="text-danger text-xs">{errors.title.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategoriya</Label>
              <Select onValueChange={(v) => setValue("category", v as FormValues["category"])} defaultValue="materials">
                <SelectTrigger className="w-full" aria-label="Kategoriya">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-amount">Summa (so‘m)</Label>
              <Input id="ex-amount" type="number" step={10_000} {...register("amount")} />
              {errors.amount ? <p className="text-danger text-xs">{errors.amount.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Usul</Label>
            <Select onValueChange={(v) => setValue("method", v as FormValues["method"])} defaultValue="card">
              <SelectTrigger className="w-full" aria-label="Usul">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Naqd</SelectItem>
                <SelectItem value="card">Karta</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
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
