"use client";

import * as React from "react";
import { toast } from "sonner";
import { Banknote, Check, CheckCheck, Loader2, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataStore } from "@/stores/useDataStore";
import { usePageData } from "@/lib/api";
import { EmptyState } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatMonthUZ, formatNumber, formatUZS, formatUZSCompact, fullName, todayISO } from "@/lib/utils-safe";
import type { Salary } from "@/lib/types";

export default function SalariesPage() {
  const { salaries, teachers } = useDataStore();
  const setSalaryStatus = useDataStore((s) => s.setSalaryStatus);
  const [fMonth, setFMonth] = React.useState("all");
  const [fStatus, setFStatus] = React.useState("all");
  const [payAllOpen, setPayAllOpen] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const { loading } = usePageData(() => salaries, []);

  const months = Array.from(new Set(salaries.map((s) => s.month))).sort().reverse();
  const currentMonth = todayISO().slice(0, 7);
  const monthSalaries = salaries.filter((s) => s.month === (fMonth === "all" ? currentMonth : fMonth));
  const monthTotal = monthSalaries.reduce((a, s) => a + s.total, 0);
  const paidTotal = monthSalaries.filter((s) => s.status === "paid").reduce((a, s) => a + s.total, 0);
  const pendingTotal = monthSalaries.filter((s) => s.status !== "paid").reduce((a, s) => a + s.total, 0);

  const filtered = salaries
    .filter((s) => s.month === (fMonth === "all" ? currentMonth : fMonth))
    .filter((s) => (fStatus === "all" ? true : s.status === fStatus))
    .sort((a, b) => b.total - a.total);

  const payAll = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    monthSalaries.forEach((s) => s.status !== "paid" && setSalaryStatus(s.id, "paid"));
    setPaying(false);
    setPayAllOpen(false);
    toast.success("Maoshlar to‘landi", {
      description: `${monthSalaries.length} ta xodimga jami ${formatUZS(monthTotal)} to‘landi.`,
    });
  };

  const columns: Column<Salary>[] = [
    {
      key: "teacher",
      header: "Xodim",
      sortable: true,
      sortValue: (s) => {
        const t = teachers.find((x) => x.id === s.teacherId);
        return t ? fullName(t.lastName, t.firstName) : "";
      },
      cell: (s) => {
        const t = teachers.find((x) => x.id === s.teacherId);
        return (
          <div className="flex items-center gap-3">
            <Avatar name={t ? fullName(t.lastName, t.firstName) : "?"} hue={t?.hue} size="sm" />
            <div className="leading-tight">
              <p className="font-medium">{t ? fullName(t.lastName, t.firstName) : "—"}</p>
              <p className="text-muted-foreground text-xs">{t ? `${Math.round(t.kpiScore)}/100 KPI` : ""}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "base",
      header: "Asosiy",
      hideBelow: "md",
      sortable: true,
      sortValue: (s) => s.base,
      cell: (s) => <span className="num text-sm">{formatNumber(s.base)}</span>,
    },
    {
      key: "bonus",
      header: "Premiya",
      hideBelow: "lg",
      cell: (s) => <span className="num text-sm text-success">+{formatNumber(s.bonus)}</span>,
    },
    {
      key: "deduction",
      header: "Chegirma",
      hideBelow: "lg",
      cell: (s) => <span className="num text-sm text-danger">−{formatNumber(s.deduction)}</span>,
    },
    {
      key: "total",
      header: "Jami",
      sortable: true,
      sortValue: (s) => s.total,
      cell: (s) => <span className="num text-sm font-bold">{formatNumber(s.total)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (s) => (s.status === "paid" ? 0 : s.status === "approved" ? 1 : 2),
      cell: (s) => (
        <div className="flex items-center gap-2">
          <Badge variant={s.status === "paid" ? "success" : s.status === "approved" ? "info" : "warning"}>
            {s.status === "paid" ? "To‘langan" : s.status === "approved" ? "Tasdiqlangan" : "Kutilmoqda"}
          </Badge>
          {s.status !== "paid" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-primary"
              onClick={() => {
                setSalaryStatus(s.id, "paid");
                toast.success("Maosh to‘landi");
              }}
            >
              <Banknote className="size-3.5" /> To‘lash
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Maoshlar"
        subtitle={fMonth === "all" ? formatMonthUZ(currentMonth) : formatMonthUZ(fMonth)}
        actions={
          <Button
            onClick={() => setPayAllOpen(true)}
            disabled={pendingTotal === 0}
          >
            {paying ? <Loader2 className="animate-spin" /> : <CheckCheck />}
            Barchasini to‘lash
          </Button>
        }
      />

      <div className="stagger mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Oylik fond" value={monthTotal} format={(v) => formatUZSCompact(v)} icon={<Banknote />} hint={`${monthSalaries.length} ta xodim`} />
        <StatCard label="To‘langan" value={paidTotal} format={(v) => formatUZSCompact(v)} icon={<Check />} delta={0} hint={monthTotal ? `${Math.round((paidTotal / monthTotal) * 100)}% ulush` : ""} />
        <StatCard label="Kutilayotgan" value={pendingTotal} format={(v) => formatUZSCompact(v)} icon={<UsersRound />} hint="Tasdiqlash kerak" />
      </div>

      <Card className="mt-5">
        <CardContent className="space-y-4">
          <FilterBar>
            <Select value={fMonth} onValueChange={setFMonth}>
              <SelectTrigger size="sm" className="w-40" aria-label="Oy filtri">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Joriy oy</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {formatMonthUZ(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger size="sm" className="w-40" aria-label="Status filtri">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha status</SelectItem>
                <SelectItem value="paid">To‘langan</SelectItem>
                <SelectItem value="approved">Tasdiqlangan</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          <DataTable
            data={filtered}
            columns={columns}
            getRowKey={(s) => s.id}
            loading={loading}
            pageSize={12}
            empty={<EmptyState icon={<Banknote />} title="Maosh yozuvlari yo‘q" description="Ushbu oy va status bo‘yicha yozuv topilmadi." />}
            mobileCard={(s) => {
              const t = teachers.find((x) => x.id === s.teacherId);
              return (
                <div key={s.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={t ? fullName(t.lastName, t.firstName) : "?"} hue={t?.hue} size="sm" />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-sm font-medium">{t ? fullName(t.lastName, t.firstName) : "—"}</p>
                      <p className="text-muted-foreground text-xs">
                        Asosiy {formatNumber(s.base)} · Premiya +{formatNumber(s.bonus)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="num text-sm font-bold">{formatUZSCompact(s.total)}</p>
                      <Badge variant={s.status === "paid" ? "success" : s.status === "approved" ? "info" : "warning"} className="mt-1">
                        {s.status === "paid" ? "To‘langan" : s.status === "approved" ? "Tasdiqlangan" : "Kutilmoqda"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={payAllOpen}
        onOpenChange={setPayAllOpen}
        title="Barcha maoshlarni to‘lash"
        description={`${monthSalaries.filter((s) => s.status !== "paid").length} ta xodimga jami ${formatUZS(pendingTotal)} to‘lanadi. Bu amalni bekor qilib bo‘lmaydi.`}
        confirmText="To‘lashni tasdiqlash"
        onConfirm={payAll}
        loading={paying}
      />
    </>
  );
}
