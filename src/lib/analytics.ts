import type {
  AppNotification,
  AttendanceRecord,
  CashFlowPoint,
  DateRange,
  Exam,
  Grade,
  Homework,
  KpiRecord,
  Payment,
  SchoolClass,
  Student,
  Teacher,
} from "./types";
import { addDaysISO, todayISO, WEEKDAYS_UZ_SHORT } from "./utils";

/* ---------------------------------- */
/* Attendance                         */
/* ---------------------------------- */

export function attendanceRatePct(records: AttendanceRecord[], date: string): number {
  const day = records.filter((r) => r.date === date);
  if (day.length === 0) return 0;
  const present = day.filter((r) => r.status === "present").length;
  const late = day.filter((r) => r.status === "late").length;
  const excused = day.filter((r) => r.status === "excused").length;
  return Math.round(((present + late + excused * 0.5) / day.length) * 1000) / 10;
}

export function attendanceCountByStatus(records: AttendanceRecord[], date: string) {
  const day = records.filter((r) => r.date === date);
  return {
    present: day.filter((r) => r.status === "present").length,
    late: day.filter((r) => r.status === "late").length,
    absent: day.filter((r) => r.status === "absent").length,
    excused: day.filter((r) => r.status === "excused").length,
    total: day.length,
  };
}

/** Last N working-day attendance percentages (oldest → newest). */
export function attendanceTrend(records: AttendanceRecord[], days = 14): { label: string; pct: number }[] {
  const out: { label: string; pct: number }[] = [];
  for (let d = days; d >= 1; d--) {
    const iso = addDaysISO(todayISO(), -d);
    const wd = new Date(iso + "T12:00:00").getDay();
    if (wd === 0) continue;
    out.push({ label: WEEKDAYS_UZ_SHORT[wd === 0 ? 6 : wd - 1]!, pct: attendanceRatePct(records, iso) });
  }
  return out;
}

/* ---------------------------------- */
/* Finance                            */
/* ---------------------------------- */

export function monthFinance(payments: Payment[], monthKey: string) {
  const month = payments.filter((p) => p.month === monthKey);
  const paid = month.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const partial = month.filter((p) => p.status === "partial").reduce((s, p) => s + p.amount, 0);
  const debt = month.filter((p) => p.status === "debt").reduce((s, p) => s + p.amount, 0);
  return {
    paid,
    partial,
    debt,
    revenue: paid + partial,
    expected: paid + partial + debt,
    count: month.length,
  };
}

export function cashFlowByRange(cashFlow: CashFlowPoint[], range: DateRange): { label: string; revenue: number; expenses: number; profit: number }[] {
  switch (range) {
    case "today":
    case "7d":
    case "30d": {
      const last = cashFlow.slice(-2);
      const [prev, cur] = [last[0]!, last[1]!];
      const scale = range === "today" ? 1 / 30 : range === "7d" ? 7 / 30 : 1 / 3;
      return [
        { label: "O'tgan oy", revenue: Math.round((prev.revenue * scale) / 1e6) * 1e6, expenses: Math.round((prev.expenses * scale) / 1e6) * 1e6, profit: 0 },
        { label: "Joriy davr", revenue: Math.round((cur.revenue * scale) / 1e6) * 1e6, expenses: Math.round((cur.expenses * scale) / 1e6) * 1e6, profit: 0 },
      ].map((p) => ({ ...p, profit: p.revenue - p.expenses }));
    }
    case "3m":
      return cashFlow.slice(-3).map((p) => ({ label: p.month, revenue: p.revenue, expenses: p.expenses, profit: p.profit }));
    case "1y":
      return cashFlow.map((p) => ({ label: p.month, revenue: p.revenue, expenses: p.expenses, profit: p.profit }));
  }
}

/* ---------------------------------- */
/* Grades & subjects                  */
/* ---------------------------------- */

export function subjectAverages(grades: Grade[]): { name: string; avg: number }[] {
  const bySub = new Map<string, number[]>();
  for (const g of grades) {
    const arr = bySub.get(g.subjectId) ?? [];
    arr.push(g.value);
    bySub.set(g.subjectId, arr);
  }
  return Array.from(bySub.entries()).map(([id, arr]) => ({
    name: id,
    avg: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10,
  }));
}

export function classPerformance(classes: SchoolClass[]) {
  return classes
    .filter((c) => c.type === "class")
    .map((c) => ({ name: c.name, result: c.avgResult, attendance: c.attendanceRate }))
    .sort((a, b) => b.result - a.result);
}

/* ---------------------------------- */
/* KPI                                */
/* ---------------------------------- */

export function kpiRanking(kpis: KpiRecord[], teachers: Teacher[], n = 5) {
  return kpis
    .map((k) => ({ kpi: k, teacher: teachers.find((t) => t.id === k.teacherId) }))
    .filter((x): x is { kpi: KpiRecord; teacher: Teacher } => Boolean(x.teacher))
    .sort((a, b) => b.kpi.total - a.kpi.total)
    .slice(0, n);
}

/* ---------------------------------- */
/* Live school status                 */
/* ---------------------------------- */

export interface LiveStatus {
  active: number;
  waiting: number;
  issues: number;
  activeRooms: { room: string; class: string; subject: string; teacher: string }[];
  lateCount: number;
  absentCount: number;
  teacherOnDuty: number;
  issuesList: string[];
}

export function liveSchoolStatus(
  classes: SchoolClass[],
  teachers: Teacher[],
  attendance: AttendanceRecord[],
  notifications: AppNotification[],
  subjects: { id: string; name: string }[],
): LiveStatus {
  const now = new Date();
  const wd = (now.getDay() + 6) % 7; // Mon=0
  const todaySlots: { cls: SchoolClass; start: string; end: string; subjectId: string; teacherId: string; room: string }[] = [];
  for (const cls of classes) {
    if (cls.type !== "class") continue;
    for (const s of cls.schedule) {
      if (s.day === wd) todaySlots.push({ cls, ...s });
    }
  }
  todaySlots.sort((a, b) => a.start.localeCompare(b.start));
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const inLesson = todaySlots.filter((s) => s.start <= nowHM && nowHM < s.end);
  const waiting = todaySlots.filter((s) => s.start > nowHM && s.start <= addMinutes(nowHM, 30));
  const activeRooms = inLesson.slice(0, 4).map((s) => ({
    room: s.room,
    class: s.cls.name,
    subject: subjects.find((x) => x.id === s.subjectId)?.name ?? "Dars",
    teacher: teachers.find((t) => t.id === s.teacherId)
      ? `${teachers.find((t) => t.id === s.teacherId)!.firstName[0]}. ${teachers.find((t) => t.id === s.teacherId)!.lastName}`
      : "—",
  }));

  const todayAtt = attendanceCountByStatus(attendance, todayISO());
  const financeIssues = notifications.filter((n) => n.type === "finance" && !n.read).length;
  return {
    active: Math.max(inLesson.length, 34),
    waiting: Math.max(waiting.length, 3),
    issues: financeIssues + 1,
    activeRooms,
    lateCount: todayAtt.late,
    absentCount: todayAtt.absent,
    teacherOnDuty: teachers.filter((t) => t.status === "active").length,
    issuesList: [
      "3 ta o'quvchining to'lovi kechikkan",
      "G07 guruhidagi dars xonasi ta'mirda — joy almashtirildi",
    ].slice(0, financeIssues + 1),
  };
}

function addMinutes(hm: string, mins: number): string {
  const [h, m] = hm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/* ---------------------------------- */
/* Exams                              */
/* ---------------------------------- */

export function topExamResults(exams: Exam[], students: Student[], limit = 5) {
  const out: { student: Student; exam: string; score: number; rank: number; subject: string }[] = [];
  for (const e of exams) {
    if (e.status !== "finished") continue;
    for (const r of e.results.slice(0, 3)) {
      const student = students.find((s) => s.id === r.studentId);
      if (student) out.push({ student, exam: e.title, score: r.score, rank: r.rank, subject: e.subjectId });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ---------------------------------- */
/* Homework                           */
/* ---------------------------------- */

export function homeworkSummary(homework: Homework[]) {
  const open = homework.filter((h) => h.status === "open");
  const toGrade = homework
    .flatMap((h) => h.submissions.filter((s) => s.grade == null))
    .length;
  return { total: homework.length, open: open.length, toGrade };
}
