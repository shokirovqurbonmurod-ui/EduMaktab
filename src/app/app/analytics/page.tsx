"use client";

import * as React from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Landmark, PiggyBank, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ChartCard, RangeChips } from "@/components/shared/ChartCard";
import { StatCard } from "@/components/shared/StatCard";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton } from "@/components/shared/states";
import {
  addDaysISO,
  formatNumber,
  formatPercent,
  formatUZS,
  formatUZSCompact,
  todayISO,
} from "@/lib/utils-safe";
import { attendanceTrend, cashFlowByRange, classPerformance, subjectAverages } from "@/lib/analytics";
import type { DateRange } from "@/lib/types";

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "today", label: "Bugun" },
  { value: "7d", label: "7 kun" },
  { value: "30d", label: "30 kun" },
  { value: "3m", label: "3 oy" },
  { value: "1y", label: "1 yil" },
];

const RANGE_DAYS: Record<DateRange, number> = { today: 0, "7d": 6, "30d": 29, "3m": 90, "1y": 365 };

const METHOD_LABELS: Record<string, string> = { cash: "Naqd", card: "Karta", bank: "Bank" };
const METHOD_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

export default function AnalyticsPage() {
  const { payments, expenses, attendance, grades, classes, cashFlow } = useDataStore();
  const [range, setRange] = React.useState<DateRange>("30d");
  const { loading } = usePageData(() => [payments, expenses, attendance], []);

  const today = todayISO();
  const from = addDaysISO(today, -RANGE_DAYS[range]);

  const rangePayments = React.useMemo(
    () => payments.filter((p) => p.date >= from),
    [payments, from],
  );
  const rangeExpenses = React.useMemo(
    () => expenses.filter((e) => e.date >= from),
    [expenses, from],
  );
  const rangeAttendance = React.useMemo(
    () => attendance.filter((a) => a.date >= from),
    [attendance, from],
  );

  const revenue = rangePayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const partial = rangePayments.filter((p) => p.status === "partial").reduce((s, p) => s + p.amount, 0);
  const debt = rangePayments.filter((p) => p.status === "debt").reduce((s, p) => s + p.amount, 0);
  const expenseTotal = rangeExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue + partial - expenseTotal;
  const attPct = rangeAttendance.length
    ? Math.round((rangeAttendance.filter((r) => r.status !== "absent").length / rangeAttendance.length) * 1000) / 10
    : 0;

  const byMethod = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of rangePayments) map.set(p.method, (map.get(p.method) ?? 0) + p.amount);
    return Array.from(map.entries()).map(([m, value]) => ({
      name: METHOD_LABELS[m] ?? m,
      value,
    }));
  }, [rangePayments]);

  const trend = React.useMemo(() => attendanceTrend(attendance, 14), [attendance]);
  const subjects = React.useMemo(() => subjectAverages(grades).slice(0, 8), [grades]);
  const perf = React.useMemo(() => classPerformance(classes), [classes]);

  const combined = React.useMemo(() => {
    const flow = cashFlowByRange(cashFlow, range);
    return flow;
  }, [cashFlow, range]);

  const maxSubject = Math.max(10, ...subjects.map((s) => s.avg));

  if (loading) return <PageSkeleton withCards rows={6} />;

  return (
    <>
      <PageHeader
        title="Analitika"
        subtitle={`${formatNumber(RANGE_DAYS[range] + 1)} kunlik holat`}
        actions={
          <RangeChips options={RANGE_OPTIONS} value={range} onChange={setRange} />
        }
      />

      <div className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tushum"
          value={revenue + partial}
          format={(v) => formatUZSCompact(v)}
          icon={<Landmark />}
          delta={4.6}
          hint={`${rangePayments.length} ta to‘lov`}
        />
        <StatCard
          label="Xarajat"
          value={expenseTotal}
          format={(v) => formatUZSCompact(v)}
          icon={<PiggyBank />}
          delta={-2.1}
          hint={`${rangeExpenses.length} ta yozuv`}
        />
        <StatCard
          label="Foyda"
          value={profit}
          format={(v) => formatUZSCompact(v)}
          icon={<TrendingUp />}
          delta={6.8}
          hint={profit >= 0 ? "Ijobiy" : "Manfiy"}
        />
        <StatCard
          label="Qarzdorlik"
          value={debt}
          format={(v) => formatUZSCompact(v)}
          icon={<Users />}
          hint="Jamoalashgan"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Tushum, xarajat va foyda"
            description="Oylik dinamika"
            height={300}
            action={<BadgeDot />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combined} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  formatter={(value, name) => [formatUZS(Number(value)), String(name)]}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" name="Tushum" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" />
                <Bar dataKey="expenses" name="Xarajat" fill="var(--chart-4)" fillOpacity={0.55} radius={[5, 5, 0, 0]} barSize={14} />
                <Line type="monotone" dataKey="profit" name="Foyda" stroke="var(--success)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="To‘lov usullari" description="Ulush bo‘yicha" height={300} bodyClassName="px-0">
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byMethod} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                    {byMethod.map((_, i) => (
                      <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatUZS(Number(value))}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 px-4 pb-3">
              {byMethod.map((m, i) => {
                const total = Math.max(1, byMethod.reduce((s, x) => s + x.value, 0));
                return (
                  <div key={m.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full" style={{ background: METHOD_COLORS[i % METHOD_COLORS.length] }} />
                    <span className="flex-1 text-muted-foreground">{m.name}</span>
                    <span className="num font-medium">{formatPercent((m.value / total) * 100, 0)}</span>
                    <span className="num text-muted-foreground w-16 text-right">{formatUZSCompact(m.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <ChartCard title="Davomat dinamikasi" description="So‘nggi 14 kun" height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={2} />
              <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                formatter={(value) => [formatPercent(Number(value)), "Davomat"]}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="pct" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 2.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="num px-2 pt-1 text-center text-xs text-muted-foreground">
            Davr orttacha: <span className="font-semibold text-foreground">{formatPercent(attPct)}</span>
          </p>
        </ChartCard>

        <ChartCard title="Fanlar bo‘yicha o‘rtacha" description="10 ballik shkala" height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={subjects} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" domain={[0, maxSubject]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={82} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => [Number(value).toFixed(1) + "/10", "O‘rtacha"]}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={12}>
                {subjects.map((s, i) => (
                  <Cell key={i} fill={s.avg >= 8.5 ? "var(--success)" : s.avg >= 7 ? "var(--chart-1)" : "var(--warning)"} fillOpacity={0.85} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Guruhlar natijasi" description="O‘rtacha ball (%)" height={240}>
          <div className="space-y-2.5 px-2 py-1">
            {perf.slice(0, 8).map((p, i) => (
              <div key={p.name}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-medium">
                    {p.name} <span className="num text-muted-foreground">· davomat {p.attendance}%</span>
                  </span>
                  <span className="num font-semibold">{p.result}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.result}%`,
                      background: i === 0 ? "var(--success)" : "var(--chart-1)",
                      opacity: 0.9,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="stagger mt-5 grid gap-4 sm:grid-cols-3">
        <MiniStat label="O‘rtacha to‘lov / o‘quvchi" value={revenue + partial > 0 && rangePayments.length > 0 ? formatUZSCompact((revenue + partial) / rangePayments.length) : "—"} />
        <MiniStat label="To‘lovlar o‘z vaqtida" value={formatPercent(rangePayments.length ? ((revenue + partial) / Math.max(1, revenue + partial + debt)) * 100 : 0, 0)} />
        <MiniStat label="Kunlik o‘rtacha tushum" value={formatUZSCompact((revenue + partial) / Math.max(1, RANGE_DAYS[range] + 1))} />
      </div>
    </>
  );
}

function BadgeDot() {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <ArrowUpRight className="size-3.5 text-success" /> jonli
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="num mt-1 text-xl font-bold tracking-tight">{value}</p>
      <div className="mt-2 flex gap-1">
        <ArrowDownRight className="size-3 text-success" />
        <span className="text-[10px] text-muted-foreground">doimiy kuzatuv</span>
      </div>
    </div>
  );
}
