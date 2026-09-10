"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCheck,
  QrCode,
  ScanFace,
  Users,
  Zap,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { ChartCard } from "@/components/shared/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ATTENDANCE_META } from "@/components/shared/StatusBadge";
import {
  addDaysISO,
  formatDateShortUZ,
  formatDateUZ,
  formatPercent,
  fullName,
  todayISO,
  useDebouncedSafe,
  weekdayOfISO,
} from "@/lib/utils-safe";
import { attendanceTrend, attendanceCountByStatus, attendanceRatePct } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/types";

type Mode = "today" | "week" | "month";

export default function AttendancePage() {
  const router = useRouter();
  const { students, classes, attendance } = useDataStore();
  const setAtt = useDataStore((s) => s.setAttendance);
  const setMany = useDataStore((s) => s.setAttendanceMany);
  const [mode, setMode] = React.useState<Mode>("today");
  const [fClass, setFClass] = React.useState<string>("cls_9a");
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const { loading } = usePageData(() => attendance, []);

  const today = todayISO();
  const cls = classes.find((c) => c.id === fClass) ?? classes[0]!;
  const clsStudents = React.useMemo(
    () =>
      students
        .filter((s) => s.groupId === cls.id)
        .filter((s) => !dq || fullName(s.lastName, s.firstName).toLowerCase().includes(dq.toLowerCase())),
    [students, cls.id, dq],
  );

  const todayCounts = attendanceCountByStatus(attendance, today);
  const todayPct = attendanceRatePct(attendance, today);
  const trend = attendanceTrend(attendance, 14);

  const allPresent = () => {
    setMany(clsStudents.map((s) => s.id), today, "present");
    toast.success("Barchasi keldi deb belgilandi", { description: `${cls.name} — ${clsStudents.length} ta o‘quvchi` });
  };

  const mark = (studentId: string, status: AttendanceStatus) => {
    setAtt(studentId, today, status);
  };

  const weekDays = React.useMemo(() => {
    const days: { iso: string; label: string; pct: number; absent: number; late: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const iso = addDaysISO(today, -d);
      const wd = weekdayOfISO(iso);
      if (wd === 0) continue;
      const dayRecs = attendance.filter((a) => a.date === iso);
      days.push({
        iso,
        label: formatDateShortUZ(iso),
        pct: attendanceRatePct(dayRecs, iso),
        absent: dayRecs.filter((a) => a.status === "absent").length,
        late: dayRecs.filter((a) => a.status === "late").length,
      });
    }
    return days;
  }, [attendance, today]);

  return (
    <>
      <PageHeader
        title="Davomat"
        subtitle={`Joriy holat: ${formatPercent(todayPct)} · ${todayCounts.total} ta o‘quvchi`}
        actions={
          <div className="flex gap-2">
            {(
              [
                { v: "today", l: "Bugun" },
                { v: "week", l: "Hafta" },
                { v: "month", l: "Oy" },
              ] as const
            ).map((o) => (
              <Button key={o.v} variant={mode === o.v ? "default" : "outline"} size="sm" onClick={() => setMode(o.v)}>
                {o.l}
              </Button>
            ))}
          </div>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-2">
          {mode === "today" ? (
            <Card>
              <CardHeader className="flex-row items-center">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-[15px]">Bugungi davomat</CardTitle>
                  <Select value={fClass} onValueChange={setFClass}>
                    <SelectTrigger size="sm" className="w-36" aria-label="Guruh tanlash">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="outline" onClick={allPresent}>
                  <CheckCheck /> Barchasi keldi
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <SearchBar value={q} onChange={setQ} placeholder="O‘quvchi qidirish…" className="max-w-xs" />
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(ATTENDANCE_META) as AttendanceStatus[]).map((st) => (
                    <div key={st} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 text-sm">
                      <span aria-hidden>{ATTENDANCE_META[st].emoji}</span>
                      <span className="text-muted-foreground">{ATTENDANCE_META[st].label}</span>
                      <span className="num font-bold">
                        {todayCounts[st]}
                      </span>
                    </div>
                  ))}
                </div>
                <Progress value={todayPct} classNameIndicator={todayPct >= 93 ? "bg-success" : "bg-warning"} />

                <div className="scrollbar-none max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {loading ? (
                    <PageSkeleton withCards={false} rows={6} />
                  ) : clsStudents.length === 0 ? (
                    <EmptyState icon={<Users />} title="O‘quvchi topilmadi" description="Guruh yoki qidiruvni o‘zgartiring." />
                  ) : (
                    clsStudents.map((s) => {
                      const rec = attendance.find((a) => a.studentId === s.id && a.date === today);
                      const st: AttendanceStatus = rec?.status ?? "absent";
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-2.5 transition-all",
                            st === "present" && "border-success/30 bg-success-soft/30",
                            st === "late" && "border-warning/30 bg-warning-soft/30",
                            st === "absent" && "border-danger/30 bg-danger-soft/30",
                            st === "excused" && "border-info/30 bg-info-soft/30",
                          )}
                        >
                          <Avatar name={fullName(s.lastName, s.firstName)} hue={s.hue} size="sm" />
                          <div className="min-w-0 flex-1 leading-tight">
                            <p className="truncate text-sm font-medium">{fullName(s.lastName, s.firstName)}</p>
                            <p className="text-muted-foreground num text-[11px]">
                              {s.code}
                              {rec?.time ? ` · ${rec.time}` : ""}
                              {rec?.method === "face" ? " · 📷 yuz" : rec?.method === "qr" ? " · 🔳 QR" : ""}
                            </p>
                          </div>
                          <div className="flex gap-1" role="group" aria-label={`Davomat: ${fullName(s.lastName, s.firstName)}`}>
                            {(Object.keys(ATTENDANCE_META) as AttendanceStatus[]).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => mark(s.id, opt)}
                                aria-pressed={st === opt}
                                title={ATTENDANCE_META[opt].label}
                                className={cn(
                                  "size-8 rounded-lg border text-sm transition-all",
                                  st === opt
                                    ? opt === "present"
                                      ? "border-success bg-success text-white"
                                      : opt === "late"
                                        ? "border-warning bg-warning text-white"
                                        : opt === "absent"
                                          ? "border-danger bg-danger text-white"
                                          : "border-info bg-info text-white"
                                    : "bg-card opacity-60 hover:opacity-100",
                                )}
                              >
                                {opt === "present" ? "✓" : opt === "late" ? "⏱" : opt === "absent" ? "✗" : "ℹ"}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          ) : mode === "week" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Haftalik davomat ({formatDateUZ(today)})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Niobat</TableHead>
                      <TableHead>Keldi</TableHead>
                      <TableHead>Kechikdi</TableHead>
                      <TableHead>Kelmagan</TableHead>
                      <TableHead>Niobat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekDays.map((d) => (
                      <TableRow key={d.iso}>
                        <TableCell className="text-[13px] font-medium">{formatDateShortUZ(d.iso)}</TableCell>
                        <TableCell className="num text-[13px]">{todayCounts.total}</TableCell>
                        <TableCell className="num text-[13px] text-success">
                          {Math.round((d.pct / 100) * todayCounts.total)}
                        </TableCell>
                        <TableCell className="num text-[13px] text-warning">{d.late}</TableCell>
                        <TableCell className="num text-[13px] text-danger">{d.absent}</TableCell>
                        <TableCell>
                          <Badge variant={d.pct >= 93 ? "success" : d.pct >= 85 ? "warning" : "danger"} className="num">
                            {d.pct.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]">Oylik davomat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border p-3 text-center">
                    <p className="num text-2xl font-bold text-success">{formatPercent(todayPct)}</p>
                    <p className="text-muted-foreground text-xs">Oylik o‘rtacha</p>
                  </div>
                  <div className="rounded-2xl border p-3 text-center">
                    <p className="num text-2xl font-bold">{Math.round(todayCounts.late / 5)}</p>
                    <p className="text-muted-foreground text-xs">Oylik kechikish</p>
                  </div>
                  <div className="rounded-2xl border p-3 text-center">
                    <p className="num text-2xl font-bold text-danger">{Math.round(todayCounts.absent / 5)}</p>
                    <p className="text-muted-foreground text-xs">Oylik kelmagan</p>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={34} />
                      <Tooltip
                        formatter={(v) => [`${Number(v).toFixed(1)}%`, "Davomat"]}
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                      />
                      <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                        {trend.map((t, i) => (
                          <Cell key={i} fill={t.pct >= 93 ? "var(--success)" : t.pct >= 85 ? "var(--warning)" : "var(--danger)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: analytics + biometric placeholders */}
        <div className="space-y-4 lg:col-span-2 xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <BiometricCard
              icon={<ScanFace />}
              title="Yuz orqali kirish"
              desc="Kamera orqali avtomatik tan olish"
              stat="99.1% aniqlik"
              active
            />
            <BiometricCard
              icon={<QrCode />}
              title="QR orqali davomat"
              desc="O‘quvchilar mobil qo‘shimchadan QR skanerlaydi"
              stat="248 ta skanerlash / kun"
            />
          </div>

          <ChartCard title="Davomat dinamikasi" description="So‘nggi 14 ish kuni" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={34} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, "Davomat"]}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                  {trend.map((t, i) => (
                    <Cell key={i} fill={t.pct >= 93 ? "var(--chart-2)" : "var(--chart-3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <Card>
            <CardHeader className="flex-row items-center">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <Zap className="size-4 text-primary" /> Tezkor amallar
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={allPresent} className="justify-start gap-2">
                <CheckCheck className="text-success" /> Barchasini qo‘yish
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/app/students")} className="justify-start gap-2">
                <Users className="text-info" /> O‘quvchilar ro‘yxati
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/app/schedule")} className="justify-start gap-2">
                <ScanFace className="text-primary" /> Kechikganlarni ko‘rish
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/app/notifications")} className="justify-start gap-2">
                <Zap className="text-warning" /> Hisobot yuborish
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function BiometricCard({
  icon,
  title,
  desc,
  stat,
  active = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  stat: string;
  active?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      {active ? (
        <div className="absolute inset-x-0 h-0.5 animate-scan bg-gradient-to-r from-transparent via-primary to-transparent" />
      ) : null}
      <CardContent className="flex items-start gap-3.5 p-5">
        <span className="brand-gradient-soft flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary [&_svg]:size-5">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {title}
            {active ? (
              <span className="relative flex size-2">
                <span className="bg-success absolute h-full w-full animate-ping rounded-full opacity-60" />
                <span className="bg-success relative size-2 rounded-full" />
              </span>
            ) : (
              <Badge variant="muted">Demo</Badge>
            )}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">{desc}</p>
          <p className="num mt-2 text-xs font-semibold text-primary">{stat}</p>
        </div>
      </CardContent>
    </Card>
  );
}
