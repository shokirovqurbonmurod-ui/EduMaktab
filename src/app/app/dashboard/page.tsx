"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  AlertTriangle,
  ArrowUpRight,
  Award,
  Banknote,
  Bell,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Megaphone,
  Moon,
  Sunrise,
  Sun,
  Users,
  UsersRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { useDataStore } from "@/stores/useDataStore";
import {
  attendanceRatePct,
  cashFlowByRange,
  homeworkSummary,
  liveSchoolStatus,
  monthFinance,
  topExamResults,
} from "@/lib/analytics";
import { usePageData } from "@/lib/api";
import { PageSkeleton } from "@/components/shared/states";
import {
  addDaysISO,
  formatDateUZ,
  formatPercent,
  formatUZS,
  formatUZSCompact,
  fullName,
  todayISO,
} from "@/lib/utils";
import { ATTENDANCE_META, PAYMENT_META } from "@/components/shared/StatusBadge";
import { RangeChips } from "@/components/shared/ChartCard";
import type { DateRange } from "@/lib/types";

export default function DashboardPage() {
  const session = useAuthStore((s) => s.session)!;
  const role = session.user.role;
  return (
    <>
      <GreetingHeader name={session.user.name} />
      {role === "TEACHER" ? <TeacherDashboard /> : null}
      {role === "STUDENT" ? <StudentDashboard /> : null}
      {role === "PARENT" ? <ParentDashboard /> : null}
      {!["TEACHER", "STUDENT", "PARENT"].includes(role) ? <DirectorDashboard /> : null}
    </>
  );
}

function GreetingHeader({ name }: { name: string }) {
  const hour = new Date().getHours();
  const greet =
    hour < 6 ? "Xayrli tun" : hour < 12 ? "Xayrli tong" : hour < 18 ? "Xayrli kun" : "Xayrli oqshom";
  const icon = hour < 6 ? <Moon /> : hour < 12 ? <Sunrise /> : hour < 18 ? <Sun /> : <Moon />;
  const dateLabel = formatDateUZ(todayISO());
  return (
    <PageHeader
      title={
        <span className="flex items-center gap-2.5">
          {greet}, {name.split(" ")[0]}{" "}
          <span aria-hidden className="animate-float text-2xl">👋</span>
        </span>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> {dateLabel}
          </span>
          <span aria-hidden>·</span>
          <span>Bugun maktabingizda nimalar bo‘layotganini ko‘ring.</span>
          <span className="sr-only">{icon}</span>
        </span>
      }
      actions={<QuickActions />}
    />
  );
}

/* ---------------------------------- */
/* Quick actions                      */
/* ---------------------------------- */

function QuickActions() {
  const router = useRouter();
  const [announceOpen, setAnnounceOpen] = React.useState(false);
  const role = useAuthStore((s) => s.session?.user.role);
  const isDirector = !role || role === "DIRECTOR" || role === "ADMIN";

  const actions: { label: string; icon: React.ReactNode; onClick: () => void; primary?: boolean }[] = [
    ...(isDirector
      ? [
          { label: "O‘quvchi qo‘shish", icon: <Users />, onClick: () => router.push("/app/students?new=1") },
          { label: "O‘qituvchi qo‘shish", icon: <UsersRound />, onClick: () => router.push("/app/teachers?new=1") },
          { label: "Guruh yaratish", icon: <GraduationCap />, onClick: () => router.push("/app/classes?new=1") },
          { label: "To‘lov kiritish", icon: <Wallet />, onClick: () => router.push("/app/payments?new=1") },
        ]
      : []),
    { label: "Davomat olish", icon: <ClipboardCheck />, onClick: () => router.push("/app/attendance") },
    { label: "Dars qo‘shish", icon: <CalendarDays />, onClick: () => router.push("/app/schedule") },
    { label: "E'lon yuborish", icon: <Megaphone />, onClick: () => setAnnounceOpen(true), primary: true },
  ];

  return (
    <>
      <div className="scrollbar-none -mr-1 flex items-center gap-2 overflow-x-auto pr-1">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant={a.primary ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1.5 whitespace-nowrap"
            onClick={a.onClick}
          >
            {a.icon}
            <span className="hidden sm:inline">{a.label}</span>
          </Button>
        ))}
      </div>
      <AnnounceDialog open={announceOpen} onOpenChange={setAnnounceOpen} />
    </>
  );
}

const announceSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 belgi bo‘lsin"),
  body: z.string().min(10, "Matn kamida 10 belgi bo‘lsin"),
});

function AnnounceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addNotification = useDataStore((s) => s.addNotification);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof announceSchema>>({
    resolver: zodResolver(announceSchema),
    defaultValues: { title: "", body: "" },
  });

  const onSubmit = (d: { title: string; body: string }) => {
    addNotification({
      id: `ntf_${Date.now()}`,
      type: "event",
      title: d.title,
      body: d.body,
      date: todayISO(),
      read: false,
      actorName: "Maktab ma'muriyati",
    });
    toast.success("E'lon yuborildi", { description: "Bildirishnomalar paneliga qo'shildi." });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="size-5 text-primary" />
            E'lon yuborish
          </DialogTitle>
          <DialogDescription>
            E'lon barcha xodimlarning bildirishnomalar panelida ko‘rinadi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="ann-title">Sarlavha</Label>
            <Input id="ann-title" placeholder="Masalan: Shanba kuni ish yuvi shabati" {...register("title")} />
            {errors.title ? <p className="text-danger text-xs">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-body">Matn</Label>
            <Textarea id="ann-body" rows={4} placeholder="E'lon matni…" {...register("body")} />
            {errors.body ? <p className="text-danger text-xs">{errors.body.message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">Yuborish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- */
/* Director                           */
/* ---------------------------------- */

function DirectorDashboard() {
  const { students, teachers, classes, attendance, payments, homework, exams, notifications, subjects, cashFlow } =
    useDataStore();
  const [range, setRange] = React.useState<DateRange>("1y");
  const { loading } = usePageData(
    () => ({ students, teachers, classes, attendance, payments }),
    [],
  );

  const today = todayISO();
  const monthKey = today.slice(0, 7);
  const fin = monthFinance(payments, monthKey);
  const attToday = attendanceRatePct(attendance, today);
  const live = React.useMemo(
    () => liveSchoolStatus(classes, teachers, attendance, notifications, subjects),
    [classes, teachers, attendance, notifications, subjects],
  );
  const flow = React.useMemo(() => cashFlowByRange(cashFlow, range), [cashFlow, range]);
  const topResults = React.useMemo(() => topExamResults(exams, students, 5), [exams, students]);
  const hw = homeworkSummary(homework);
  const enrollSpark = [1120, 1135, 1148, 1160, 1182, 1198, 1210, 1226, 1248];
  const recentPayments = payments.slice(0, 6);
  const latestNotifs = notifications.slice(0, 4);

  return (
    <div className="mt-6 space-y-6">
      {/* KPI row */}
      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard label="O‘quvchilar" value={students.length} icon={<Users />} spark={enrollSpark} delta={2.1} hint="9 ta yangi guruh" delay={0} />
          <StatCard label="O‘qituvchilar" value={teachers.length} icon={<UsersRound />} delta={1.2} hint={`${live.teacherOnDuty} nafar vazifada`} delay={40} />
          <StatCard label="Bugungi davomat" value={attToday} format={(v) => formatPercent(v)} icon={<ClipboardCheck />} delta={0.8} hint={`${attendanceCountToday(attendance, today)} ta o‘quvchi`} delay={80} />
          <StatCard label="Oylik tushum" value={fin.revenue} format={(v) => formatUZSCompact(v)} icon={<Wallet />} delta={6.4} hint="Joriy oy" delay={120} />
          <StatCard label="Qarzdorlik" value={fin.debt} format={(v) => formatUZSCompact(v)} icon={<Banknote />} delta={-4.2} hint={`${fin.count} ta hisob`} delay={160} />
          <StatCard label="Faol guruhlar" value={classes.length} icon={<GraduationCap />} delta={3.7} hint="54 ta dars jarayoni" delay={200} />
        </div>
      )}

      {/* Live school status */}
      <LiveStatusPanel data={live} />

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center">
            <div className="grid gap-1">
              <CardTitle className="text-[15px]">Moliya dinamikasi</CardTitle>
              <p className="text-muted-foreground text-xs">Daromad, xarajat va sof foyda (so'm)</p>
            </div>
            <RangeChips
              value={range}
              onChange={setRange}
              options={[
                { value: "30d" as DateRange, label: "30 kun" },
                { value: "3m" as DateRange, label: "3 oy" },
                { value: "1y" as DateRange, label: "1 yil" },
              ]}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v: number) => `${Math.round(v / 100_000_000)}s`}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={38}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatUZS(Number(value)),
                      String(name) === "revenue" ? "Daromad" : String(name) === "expenses" ? "Xarajat" : "Sof foyda",
                    ]}
                    contentStyle={tooltipStyle()}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="var(--chart-4)" strokeWidth={2} fill="url(#gExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">Davomat statistikasi</CardTitle>
            <Badge variant="muted" className="num">{formatPercent(attToday)} bugun</Badge>
          </CardHeader>
          <CardContent>
            <AttendanceDonut total={attendanceCountToday(attendance, today)} late={live.lateCount} absent={live.absentCount} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniStat icon={<CheckCircle2 className="text-success" />} label="Keldi" value={String(attendanceCountToday(attendance, today) - live.lateCount - live.absentCount)} />
              <MiniStat icon={<Clock className="text-warning" />} label="Kechikdi" value={String(live.lateCount)} />
              <MiniStat icon={<XCircle className="text-danger" />} label="Kelmagan" value={String(live.absentCount)} />
              <MiniStat icon={<Award className="text-info" />} label="O‘rtacha" value={formatPercent(attToday)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">Eng yaxshi natijalar</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
              <Link href="/app/exams">Barchasi <ArrowUpRight className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topResults.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={
                    i === 0
                      ? "brand-gradient flex size-8 items-center justify-center rounded-xl text-xs font-bold text-white"
                      : "bg-muted flex size-8 items-center justify-center rounded-xl text-xs font-bold"
                  }
                >
                  {i + 1}
                </span>
                <Avatar name={fullName(r.student.lastName, r.student.firstName)} hue={r.student.hue} size="sm" />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">{fullName(r.student.lastName, r.student.firstName)}</p>
                  <p className="text-muted-foreground truncate text-xs">{r.exam}</p>
                </div>
                <Badge variant="success" className="num">{r.score}/100</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">So‘nggi to‘lovlar</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
              <Link href="/app/payments">Barchasi <ArrowUpRight className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentPayments.map((p) => {
              const s = students.find((x) => x.id === p.studentId);
              const meta = PAYMENT_META[p.status];
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar name={s ? fullName(s.lastName, s.firstName) : "?"} hue={s?.hue} size="sm" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">{s ? fullName(s.lastName, s.firstName) : "O‘quvchi"}</p>
                    <p className="text-muted-foreground text-xs">{formatDateUZ(p.date)}</p>
                  </div>
                  <div className="text-right leading-tight">
                    <p className="num text-sm font-semibold">{formatUZSCompact(p.amount)}</p>
                    <Badge variant={meta.tone === "default" ? "default" : meta.tone} className="mt-0.5 h-4 px-1.5 text-[9px]">
                      {meta.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">So‘nggi yangiliklar</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
              <Link href="/app/notifications"><Bell className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestNotifs.map((n) => (
              <div key={n.id} className="flex items-start gap-2.5">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/40" : "bg-primary"}`} />
                <div className="min-w-0 leading-snug">
                  <p className="line-clamp-1 text-[13px] font-medium">{n.title}</p>
                  <p className="text-muted-foreground line-clamp-2 text-xs">{n.body}</p>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><BookOpenCheck className="size-4" /> Uy vazifalar</span>
              <Badge variant="info" className="num">{hw.open} ta ochiq · {hw.toGrade} ta baholanmoqda</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function attendanceCountToday(attendance: { date: string; status: string }[], date: string) {
  return attendance.filter((a) => a.date === date).length;
}

function tooltipStyle() {
  return {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    fontSize: 12,
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
  };
}

/* ---------------------------------- */
/* Live status panel                  */
/* ---------------------------------- */

function LiveStatusPanel({ data }: { data: ReturnType<typeof liveSchoolStatus> }) {
  return (
    <Card className="app-glow overflow-hidden">
      <CardHeader className="flex-row items-center">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
            <span className="bg-success relative inline-flex size-2.5 rounded-full" />
          </span>
          <CardTitle className="text-[15px]">Maktab holati</CardTitle>
          <Badge variant="muted">Real vaqt · demo</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="num">🟢 {data.active} ta dars davom etmoqda</Badge>
          <Badge variant="warning" className="num">🟡 {data.waiting} ta kutmoqda</Badge>
          <Badge variant="destructive" className="num">🔴 {data.issues} ta muammo</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Faol xonalar</p>
          {data.activeRooms.length === 0 ? (
            <p className="text-muted-foreground text-sm">Hozirda darslar yo‘q.</p>
          ) : (
            data.activeRooms.map((r, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border bg-card/60 px-3 py-2">
                <span className="brand-gradient size-8 rounded-lg" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[13px] font-semibold">{r.class} · {r.room}-xona</p>
                  <p className="text-muted-foreground truncate text-xs">{r.subject} — {r.teacher}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">O‘qituvchilar holati</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">{data.teacherOnDuty} vazifada</Badge>
            <Badge variant="warning">{data.lateCount} ta o‘quvchi kechikkan</Badge>
            <Badge variant="destructive">{data.absentCount} ta kelmagan</Badge>
          </div>
          <div className="rounded-xl border bg-card/60 p-3">
            <p className="text-[13px] font-medium">Yuz orqali kirish</p>
            <p className="text-muted-foreground mt-0.5 text-xs">99.1% aniqlik · 12 kamera faol</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            <AlertTriangle className="size-3.5 text-danger" /> Muammolar
          </p>
          {data.issuesList.map((iss, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft/50 px-3 py-2">
              <AlertTriangle className="text-danger mt-0.5 size-3.5 shrink-0" />
              <p className="text-[13px] leading-snug">{iss}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card/60 px-3 py-2">
      {icon}
      <div className="leading-tight">
        <p className="num text-sm font-bold">{value}</p>
        <p className="text-muted-foreground text-[10px]">{label}</p>
      </div>
    </div>
  );
}

function AttendanceDonut({ total, late, absent }: { total: number; late: number; absent: number }) {
  const present = Math.max(0, total - late - absent);
  const data = [
    { name: "Keldi", value: present, color: "var(--success)" },
    { name: "Kechikdi", value: late, color: "var(--warning)" },
    { name: "Kelmagan", value: absent, color: "var(--danger)" },
  ];
  const r = 54;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center justify-center gap-6">
      <svg viewBox="0 0 140 140" className="size-36 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted)" strokeWidth="14" />
        {data.map((d) => {
          const frac = total ? d.value / total : 0;
          const dash = frac * c;
          const el = (
            <circle
              key={d.name}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc}
              strokeLinecap="butt"
            />
          );
          acc += dash;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-muted-foreground w-16">{d.name}</span>
            <span className="num font-semibold">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* Teacher                            */
/* ---------------------------------- */

function TeacherDashboard() {
  const session = useAuthStore((s) => s.session)!;
  const { teachers, classes, homework, grades, subjects } = useDataStore();
  const me = teachers.find((t) => t.id === session.user.refId) ?? teachers[0]!;
  const myClasses = classes.filter((c) => me.groupsIds.includes(c.id));
  const now = new Date();
  const wd = (now.getDay() + 6) % 7;
  const todaySlots = myClasses.flatMap((c) => c.schedule.filter((s) => s.day === wd).map((s) => ({ ...s, cls: c })));
  todaySlots.sort((a, b) => a.start.localeCompare(b.start));
  const myGrades = grades.filter((g) => g.teacherId === me.id).length;
  const hwMine = homework.filter((h) => h.teacherId === me.id);
  const toGrade = hwMine.flatMap((h) => h.submissions.filter((s) => s.grade == null)).length;

  return (
    <div className="mt-6 space-y-6">
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mening guruhlarim" value={myClasses.length} icon={<GraduationCap />} hint={myClasses.map((c) => c.name).join(", ")} />
        <StatCard label="Bugungi darslar" value={todaySlots.length} icon={<CalendarDays />} hint={`Birinchi: ${todaySlots[0]?.start ?? "—"}`} />
        <StatCard label="Qo‘yilgan baholar" value={myGrades} icon={<Award />} delta={4.5} />
        <StatCard label="KPI ballim" value={me.kpiScore} format={(v) => `${Math.round(v)}/100`} icon={<Banknote />} delta={me.kpiScore > 85 ? 2.1 : -1.2} hint="Bu oy" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">Bugungi jadvalim</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
              <Link href="/app/schedule">To‘liq jadval <ArrowUpRight className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySlots.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">Bugun darslaringiz yo‘q 🎉</p>
            ) : (
              todaySlots.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
                  <span className="num w-14 text-sm font-bold text-primary">{s.start}</span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">
                      {s.cls.name} · {subjectName(subjects, s.subjectId)}
                    </p>
                    <p className="text-muted-foreground text-xs">{s.room}-xona</p>
                  </div>
                  <Badge variant={i === 0 ? "success" : "muted"}>{i === 0 ? "Keyingi" : "Rejada"}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">Baholash kerak</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
              <Link href="/app/homework">Uy vazifalar <ArrowUpRight className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {hwMine.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
                <BookOpenCheck className="text-primary size-4.5 shrink-0" />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">{h.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {classNameOf(classes, h.classId)} · muddat: {formatDateUZ(h.dueDate)}
                  </p>
                </div>
                <Badge variant="warning" className="num">
                  {h.submittedCount - h.submissions.filter((x) => x.grade != null).length} ta
                </Badge>
              </div>
            ))}
            <div className="pt-1">
              <Badge variant="info" className="num">Jami {toGrade} ta topshiriq kutmoqda</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type SubjectLike = { id: string; name: string };
type ClassLike = { id: string; name: string };

function subjectName(subjects: SubjectLike[], id: string) {
  return subjects.find((s) => s.id === id)?.name ?? id;
}

function classNameOf(classes: ClassLike[], id: string) {
  return classes.find((c) => c.id === id)?.name ?? id;
}

/* ---------------------------------- */
/* Student                            */
/* ---------------------------------- */

function StudentDashboard() {
  const session = useAuthStore((s) => s.session)!;
  const { students, classes, grades, homework, exams, payments, subjects } = useDataStore();
  const me = students.find((s) => s.id === session.user.refId) ?? students[0]!;
  const myClass = classes.find((c) => c.id === me.groupId);
  const today = todayISO();
  const now = new Date();
  const wd = (now.getDay() + 6) % 7;
  const todaySlots = (myClass?.schedule ?? []).filter((s) => s.day === wd).sort((a, b) => a.start.localeCompare(b.start));
  const myGrades = grades.filter((g) => g.studentId === me.id);
  const myPay = payments.find((p) => p.studentId === me.id && p.month === today.slice(0, 7));
  const nextExam = exams.filter((e) => e.status === "scheduled" && e.classId === me.groupId).sort((a, b) => a.date.localeCompare(b.date))[0];
  const hwMine = homework.filter((h) => h.classId === me.groupId && h.dueDate >= addDaysISO(today, -1));

  return (
    <div className="mt-6 space-y-6">
      <Card className="brand-gradient-soft border-primary/15">
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={fullName(me.lastName, me.firstName)} hue={me.hue} size="xl" />
            <div>
              <p className="text-lg font-bold">{fullName(me.lastName, me.firstName)}</p>
              <p className="text-muted-foreground text-sm">{myClass?.name} guruh · {me.code}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-card/70 px-4 py-2.5 backdrop-blur-sm">
              <p className="num text-xl font-bold">{me.attendanceRate}%</p>
              <p className="text-muted-foreground text-[11px]">Davomat</p>
            </div>
            <div className="rounded-2xl bg-card/70 px-4 py-2.5 backdrop-blur-sm">
              <p className="num text-xl font-bold">{me.avgGrade}</p>
              <p className="text-muted-foreground text-[11px]">O‘rtacha baho</p>
            </div>
            <div className="rounded-2xl bg-card/70 px-4 py-2.5 backdrop-blur-sm">
              <p className="num text-xl font-bold">{me.certificates.length}</p>
              <p className="text-muted-foreground text-[11px]">Sertifikat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bugungi darslar" value={todaySlots.length} icon={<CalendarDays />} hint={`Birinchi: ${todaySlots[0]?.start ?? "—"}`} />
        <StatCard label="Joriy oy to‘lovi" value={myPay?.amount ?? 0} format={(v) => formatUZSCompact(v)} icon={<Wallet />} hint={myPay ? PAYMENT_META[myPay.status].label : "Ma'lumot yo'q"} />
        <StatCard label="Bajarilgan vazifalar" value={myGrades.filter((g) => g.value >= 8).length} icon={<BookOpenCheck />} hint={`${myGrades.length} ta baho`} />
        <StatCard label="Keyingi imtihon" value={nextExam ? daysUntil(nextExam.date) : 0} format={(v) => `${Math.round(v)} kun`} icon={<Award />} hint={nextExam?.title ?? "Rejada yo'q"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">Bugungi darslarim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySlots.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">Bugun darslar yo‘q 🎉</p>
            ) : (
              todaySlots.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
                  <span className="num w-14 text-sm font-bold text-primary">{s.start}</span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">{subjectName(subjects, s.subjectId)}</p>
                    <p className="text-muted-foreground text-xs">{s.room}-xona</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">Uy vazifalarim</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
              <Link href="/app/homework">Barchasi <ArrowUpRight className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {hwMine.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">Yangi uy vazifa yo‘q</p>
            ) : (
              hwMine.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
                  <BookOpenCheck className="text-primary size-4.5 shrink-0" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">{h.title}</p>
                    <p className="text-muted-foreground text-xs">Muddat: {formatDateUZ(h.dueDate)}</p>
                  </div>
                  <Badge variant={h.dueDate < today ? "danger" : h.dueDate === today ? "warning" : "muted"}>
                    {h.dueDate < today ? "Muddati o'tgan" : h.dueDate === today ? "Bugun" : relativeDue(h.dueDate)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function daysUntil(iso: string) {
  const a = new Date(todayISO() + "T00:00:00");
  const b = new Date(iso + "T00:00:00");
  return (b.getTime() - a.getTime()) / 86400000;
}

function relativeDue(iso: string) {
  const d = daysUntil(iso);
  return d <= 1 ? "Ertaga" : `${Math.round(d)} kun`;
}

/* ---------------------------------- */
/* Parent                             */
/* ---------------------------------- */

function ParentDashboard() {
  const session = useAuthStore((s) => s.session)!;
  const { parents, students, classes, attendance, grades, payments, homework, notifications, subjects } = useDataStore();
  const me = parents.find((p) => p.id === session.user.refId) ?? parents[0]!;
  const children = students.filter((s) => me.childrenIds.includes(s.id));
  const today = todayISO();
  const now = new Date();
  const wd = (now.getDay() + 6) % 7;
  const monthKey = today.slice(0, 7);

  return (
    <div className="mt-6 space-y-6">
      <div className="stagger grid gap-4 md:grid-cols-2">
        {children.map((child) => {
          const cls = classes.find((c) => c.id === child.groupId);
          const pay = payments.find((p) => p.studentId === child.id && p.month === monthKey);
          const todayAtt = attendance.find((a) => a.studentId === child.id && a.date === today);
          const childGrades = grades.filter((g) => g.studentId === child.id);
          return (
            <Card key={child.id} className="card-hover">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(child.lastName, child.firstName)} hue={child.hue} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{fullName(child.lastName, child.firstName)}</p>
                    <p className="text-muted-foreground text-sm">{cls?.name} guruh · {child.code}</p>
                  </div>
                  <Link href={`/app/students/${child.id}`}>
                    <Button variant="outline" size="sm">Profil</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/60 px-2 py-2">
                    <p className="num text-lg font-bold">{child.attendanceRate}%</p>
                    <p className="text-muted-foreground text-[10px]">Davomat</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 px-2 py-2">
                    <p className="num text-lg font-bold">{child.avgGrade}</p>
                    <p className="text-muted-foreground text-[10px]">O‘rtacha</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 px-2 py-2">
                    <p className="num text-lg font-bold">{childGrades.filter((g) => g.value >= 9).length}</p>
                    <p className="text-muted-foreground text-[10px]">9+ baho</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {todayAtt ? (
                    <Badge variant={ATTENDANCE_META[todayAtt.status].tone === "default" ? "default" : ATTENDANCE_META[todayAtt.status].tone}>
                      Bugun: {ATTENDANCE_META[todayAtt.status].label}
                    </Badge>
                  ) : null}
                  {pay ? (
                    <Badge variant={PAYMENT_META[pay.status].tone === "default" ? "default" : PAYMENT_META[pay.status].tone}>
                      To‘lov: {PAYMENT_META[pay.status].label}
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">Bugungi jadval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {children[0]
              ? classes
                  .find((c) => c.id === children[0]!.groupId)
                  ?.schedule.filter((s) => s.day === wd)
                  .sort((a, b) => a.start.localeCompare(b.start))
                  .slice(0, 6)
                  .map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
                      <span className="num w-14 text-sm font-bold text-primary">{s.start}</span>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-sm font-medium">{subjectName(subjects, s.subjectId)}</p>
                        <p className="text-muted-foreground text-xs">{s.room}-xona</p>
                      </div>
                    </div>
                  ))
              : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center">
            <CardTitle className="text-[15px]">E'lonlar va xabarlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="flex items-start gap-2.5">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/40" : "bg-primary"}`} />
                <div className="min-w-0 leading-snug">
                  <p className="line-clamp-1 text-[13px] font-medium">{n.title}</p>
                  <p className="text-muted-foreground line-clamp-2 text-xs">{n.body}</p>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Uy vazifalar</span>
              <Badge variant="info" className="num">
                {homework.filter((h) => children.some((c) => c.groupId === h.classId)).length} ta
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
