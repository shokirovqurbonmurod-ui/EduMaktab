"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Award, Gauge, Target, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ChartCard } from "@/components/shared/ChartCard";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton, EmptyState } from "@/components/shared/states";
import { kpiRanking } from "@/lib/analytics";
import { formatNumber, fullName } from "@/lib/utils-safe";
import type { KpiRecord } from "@/lib/types";

const METRICS: { key: keyof Omit<KpiRecord, "teacherId" | "total" | "trend">; label: string }[] = [
  { key: "attendance", label: "Davomat" },
  { key: "progress", label: "O‘quv jarayoni" },
  { key: "homework", label: "Uy vazifasi" },
  { key: "satisfaction", label: "Qoniqarlilik" },
  { key: "exams", label: "Imtihonlar" },
  { key: "lessonQuality", label: "Dars sifati" },
];

export default function KpiPage() {
  const { kpis, teachers } = useDataStore();
  const [topTeacherId, setTopTeacherId] = React.useState<string | null>(null);
  const { loading } = usePageData(() => kpis, []);

  const rows = React.useMemo(
    () =>
      kpis
        .map((k) => ({ kpi: k, teacher: teachers.find((t) => t.id === k.teacherId) }))
        .filter((x): x is { kpi: KpiRecord; teacher: (typeof teachers)[number] } => Boolean(x.teacher))
        .sort((a, b) => b.kpi.total - a.kpi.total),
    [kpis, teachers],
  );

  const top5 = React.useMemo(() => kpiRanking(kpis, teachers, 5), [kpis, teachers]);
  const avgTotal = rows.length ? Math.round(rows.reduce((s, r) => s + r.kpi.total, 0) / rows.length) : 0;
  const weak = rows.filter((r) => r.kpi.total < 75).length;

  const selected =
    (topTeacherId ? rows.find((r) => r.teacher.id === topTeacherId) : null) ?? top5[0] ?? null;

  const radar = React.useMemo(() => {
    if (!selected) return [];
    return METRICS.map((m) => ({ metric: m.label, value: selected.kpi[m.key] }));
  }, [selected]);

  const columns: Column<KpiRecord>[] = [
    {
      key: "teacher",
      header: "O‘qituvchi",
      sortable: true,
      sortValue: (k) => {
        const t = teachers.find((x) => x.id === k.teacherId);
        return t ? fullName(t.lastName, t.firstName) : "";
      },
      cell: (k) => {
        const t = teachers.find((x) => x.id === k.teacherId)!;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={fullName(t.lastName, t.firstName)} hue={t.hue} size="sm" />
            <div className="leading-tight">
              <p className="font-medium">{fullName(t.lastName, t.firstName)}</p>
              <p className="text-muted-foreground text-xs">{fullName(t.lastName, t.firstName).split(" ").slice(-1)[0]} o‘qituvchisi</p>
            </div>
          </div>
        );
      },
    },
    ...METRICS.map((m) => ({
      key: m.key as string,
      header: m.label,
      hideBelow: (m.key === "homework" || m.key === "exams" ? "lg" : "md") as "md" | "lg",
      sortable: true,
      sortValue: (k: KpiRecord) => k[m.key as keyof KpiRecord] as number,
      cell: (k: KpiRecord) => {
        const v = k[m.key as keyof KpiRecord] as number;
        return (
          <div className="w-24">
            <div className="flex items-baseline justify-between">
              <span className="num text-xs font-semibold">{v}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${v}%`,
                  background: v >= 85 ? "var(--success)" : v >= 70 ? "var(--chart-1)" : "var(--danger)",
                }}
              />
            </div>
          </div>
        );
      },
    })),
    {
      key: "total",
      header: "Umumiy",
      sortable: true,
      sortValue: (k) => k.total,
      cell: (k) => (
        <Badge
          variant={k.total >= 85 ? "success" : k.total >= 70 ? "default" : "warning"}
          className="num"
        >
          {k.total}/100
        </Badge>
      ),
    },
    {
      key: "trend",
      header: "Trend",
      hideBelow: "md",
      sortable: true,
      sortValue: (k) => k.trend,
      cell: (k) =>
        k.trend >= 0 ? (
          <span className="num text-success flex items-center gap-0.5 text-xs font-semibold">
            <TrendingUp className="size-3.5" /> +{k.trend}
          </span>
        ) : (
          <span className="num text-danger flex items-center gap-0.5 text-xs font-semibold">
            <TrendingDown className="size-3.5" /> {k.trend}
          </span>
        ),
    },
  ];

  if (loading) return <PageSkeleton withCards rows={6} />;
  if (rows.length === 0)
    return (
      <>
        <PageHeader title="KPI" subtitle="Xodimlarning samaradorlik ko‘rsatkichlari" />
        <EmptyState icon={<Gauge />} title="KPI ma'lumotlari yo‘q" description="KPI yozuvlari hali topilmadi." />
      </>
    );

  return (
    <>
      <PageHeader
        title="KPI"
        subtitle={`${rows.length} ta xodim · o‘rtacha ${avgTotal}/100`}
      />

      <div className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="O‘rtacha KPI" value={avgTotal} format={(v) => `${formatNumber(v)}/100`} icon={<Gauge />} delta={2.2} hint="Barcha xodimlar" />
        <StatCard
          label="Eng yuqori KPI"
          value={top5[0]?.kpi.total ?? 0}
          format={(v) => `${formatNumber(v)}/100`}
          icon={<Award />}
          hint={top5[0] ? fullName(top5[0].teacher.lastName, top5[0].teacher.firstName) : ""}
        />
        <StatCard label="E'tibor kerak" value={weak} icon={<Target />} hint="75/100 dan past" delta={-1.4} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardContent className="p-4">
            <DataTable
              data={rows.map((r) => r.kpi)}
              columns={columns}
              getRowKey={(k) => k.teacherId}
              pageSize={8}
              empty={<EmptyState icon={<Gauge />} title="KPI yozuvlari yo‘q" />}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ChartCard title="Top-5 o‘qituvchi" description="Umumiy KPI bo‘yicha" height={230} bodyClassName="px-3">
            <div className="space-y-2">
              {top5.map((r, i) => (
                <button
                  key={r.teacher.id}
                  onClick={() => setTopTeacherId(r.teacher.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                    selected?.teacher.id === r.teacher.id ? "border-primary/40 bg-primary/5" : "hover:bg-accent/40"
                  }`}
                >
                  <span
                    className={`num flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      i === 0
                        ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950"
                        : i === 1
                          ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900"
                          : i === 2
                            ? "bg-gradient-to-br from-orange-300 to-orange-400 text-orange-950"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Avatar name={fullName(r.teacher.lastName, r.teacher.firstName)} hue={r.teacher.hue} size="sm" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[13px] font-medium">{fullName(r.teacher.lastName, r.teacher.firstName)}</p>
                    <p className="num text-[11px] text-muted-foreground">
                      {r.kpi.trend >= 0 ? (
                        <ArrowUpRight className="text-success mr-0.5 inline size-3" />
                      ) : (
                        <ArrowDownRight className="text-danger mr-0.5 inline size-3" />
                      )}
                      {r.kpi.trend >= 0 ? "+" : ""}
                      {r.kpi.trend} punkt
                    </p>
                  </div>
                  <span className="num text-sm font-bold">{r.kpi.total}</span>
                </button>
              ))}
            </div>
          </ChartCard>

          {selected ? (
            <ChartCard
              title={fullName(selected.teacher.lastName, selected.teacher.firstName)}
              description={`Umumiy: ${selected.kpi.total}/100`}
              height={240}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    formatter={(value) => [String(value), "Ball"]}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  />
                  <Radar dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 px-2 pb-2">
                {METRICS.slice(0, 3).map((m) => (
                  <div key={m.key} className="rounded-lg bg-muted p-2 text-center">
                    <p className="num text-sm font-bold">{selected.kpi[m.key]}</p>
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          ) : null}
        </div>
      </div>

      <Card className="mt-5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-2xl">
            <Target className="text-primary size-5" />
          </div>
          <div className="flex-1 text-sm leading-snug">
            <p className="font-medium">KPI tizimi</p>
            <p className="text-muted-foreground text-xs">
              Har oy yakunida avtomatik hisoblanadi: davomat, o‘quv jarayoni, uy vazifalari, ota-onalar
              qoniqarliligi, imtihon natijalari va dars sifati — 6 ko‘rsatkichning o‘rtachasi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selected ? selected.teacher.id : ""} onValueChange={setTopTeacherId}>
              <SelectTrigger size="sm" className="w-52" aria-label="O‘qituvchi tanlash">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rows.map((r) => (
                  <SelectItem key={r.teacher.id} value={r.teacher.id}>
                    {fullName(r.teacher.lastName, r.teacher.firstName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
