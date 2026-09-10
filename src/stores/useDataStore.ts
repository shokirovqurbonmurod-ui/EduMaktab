import { create } from "zustand";
import type {
  AppNotification,
  AttendanceRecord,
  AttendanceStatus,
  CalendarEvent,
  Exam,
  Expense,
  Grade,
  Homework,
  Lead,
  LeadStage,
  Message,
  Payment,
  Parent,
  Salary,
  SchoolClass,
  Student,
  Teacher,
  User,
} from "@/lib/types";
import { getDemoData, resetDemoData, type DemoData } from "@/lib/demo";
import { uid } from "@/lib/utils";

/**
 * Client-side "database" for the demo.
 *
 * Every collection mirrors a backend table (see src/lib/types.ts). All
 * mutations go through the actions below — when a real API is connected,
 * these actions become fetch calls and the UI stays untouched.
 */

interface DataState extends DemoData {
  /* Students */
  upsertStudent: (s: Student) => void;
  setStudentStatus: (id: string, status: Student["status"]) => void;
  /* Attendance */
  setAttendance: (studentId: string, date: string, status: AttendanceStatus, method?: AttendanceRecord["method"]) => void;
  setAttendanceMany: (ids: string[], date: string, status: AttendanceStatus) => void;
  /* Grades */
  addGrade: (g: Grade) => void;
  /* Homework */
  addHomework: (h: Homework) => void;
  gradeSubmission: (hwId: string, studentId: string, grade: number) => void;
  submitHomework: (hwId: string, studentId: string) => void;
  /* Exams */
  addExam: (e: Exam) => void;
  /* Finance */
  addPayment: (p: Payment) => void;
  addExpense: (e: Expense) => void;
  setSalaryStatus: (id: string, status: Salary["status"]) => void;
  /* CRM */
  addLead: (l: Lead) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  moveLead: (id: string, stage: LeadStage) => void;
  /* Comms */
  addMessage: (m: Message) => void;
  addNotification: (n: AppNotification) => void;
  markNotification: (id: string) => void;
  markAllNotifications: () => void;
  /* Calendar */
  addCalendarEvent: (e: CalendarEvent) => void;
  removeCalendarEvent: (id: string) => void;
  /* Teachers & classes */
  addTeacher: (t: Teacher) => void;
  addClass: (c: SchoolClass) => void;
  addParent: (p: Parent) => void;
  /* System */
  resetDemo: () => void;
}

function initial(): DemoData {
  return getDemoData();
}

export const useDataStore = create<DataState>()((set) => ({
  ...initial(),

  upsertStudent: (s) =>
    set((st) => {
      const exists = st.students.some((x) => x.id === s.id);
      return {
        students: exists ? st.students.map((x) => (x.id === s.id ? s : x)) : [s, ...st.students],
      };
    }),

  setStudentStatus: (id, status) =>
    set((st) => ({ students: st.students.map((s) => (s.id === id ? { ...s, status } : s)) })),

  setAttendance: (studentId, date, status, method = "manual") =>
    set((st) => {
      const i = st.attendance.findIndex((a) => a.studentId === studentId && a.date === date);
      if (i >= 0) {
        const next = [...st.attendance];
        next[i] = { ...next[i], status, method };
        return { attendance: next };
      }
      return { attendance: [...st.attendance, { id: uid("att"), studentId, date, status, method }] };
    }),

  setAttendanceMany: (ids, date, status) =>
    set((st) => {
      const idSet = new Set(ids);
      let changed = 0;
      const next = st.attendance.map((a) => {
        if (a.date === date && idSet.has(a.studentId)) {
          changed++;
          return { ...a, status, method: "manual" as const };
        }
        return a;
      });
      const existing = new Set(st.attendance.filter((a) => a.date === date).map((a) => a.studentId));
      for (const id of ids) {
        if (!existing.has(id)) next.push({ id: uid("att"), studentId: id, date, status, method: "manual" });
      }
      void changed;
      return { attendance: next };
    }),

  addGrade: (g) => set((st) => ({ grades: [g, ...st.grades] })),

  addHomework: (h) => set((st) => ({ homework: [h, ...st.homework] })),

  gradeSubmission: (hwId, studentId, grade) =>
    set((st) => ({
      homework: st.homework.map((h) =>
        h.id === hwId
          ? {
              ...h,
              submissions: h.submissions.map((s) => (s.studentId === studentId ? { ...s, grade } : s)),
            }
          : h,
      ),
    })),

  submitHomework: (hwId, studentId) =>
    set((st) => ({
      homework: st.homework.map((h) => {
        if (h.id !== hwId || h.submissions.some((s) => s.studentId === studentId)) return h;
        return {
          ...h,
          submittedCount: Math.min(h.totalStudents, h.submittedCount + 1),
          submissions: [
            ...h.submissions,
            { studentId, submittedAt: new Date().toISOString().slice(0, 10) },
          ],
        };
      }),
    })),

  addExam: (e) => set((st) => ({ exams: [e, ...st.exams] })),

  addPayment: (p) =>
    set((st) => {
      const students = st.students.map((s) =>
        s.id === p.studentId ? { ...s, paymentStatus: p.status } : s,
      );
      return { payments: [p, ...st.payments], students };
    }),

  addExpense: (e) => set((st) => ({ expenses: [e, ...st.expenses] })),

  setSalaryStatus: (id, status) =>
    set((st) => ({
      salaries: st.salaries.map((s) =>
        s.id === id ? { ...s, status, paidAt: status === "paid" ? new Date().toISOString().slice(0, 10) : s.paidAt } : s,
      ),
    })),

  addLead: (l) => set((st) => ({ leads: [l, ...st.leads] })),
  updateLead: (id, patch) =>
    set((st) => ({ leads: st.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  moveLead: (id, stage) =>
    set((st) => ({ leads: st.leads.map((l) => (l.id === id ? { ...l, stage } : l)) })),

  addMessage: (m) => set((st) => ({ messages: [...st.messages, m] })),

  addNotification: (n) => set((st) => ({ notifications: [n, ...st.notifications] })),
  markNotification: (id) =>
    set((st) => ({ notifications: st.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllNotifications: () =>
    set((st) => ({ notifications: st.notifications.map((n) => ({ ...n, read: true })) })),

  addCalendarEvent: (e) => set((st) => ({ calendar: [...st.calendar, e] })),
  removeCalendarEvent: (id) => set((st) => ({ calendar: st.calendar.filter((e) => e.id !== id) })),

  addTeacher: (t) => set((st) => ({ teachers: [t, ...st.teachers] })),
  addClass: (c) =>
    set((st) => ({
      classes: [c, ...st.classes],
      teachers: st.teachers.map((t) => (t.id === c.teacherId ? { ...t, groupsIds: [...t.groupsIds, c.id] } : t)),
    })),
  addParent: (p) => set((st) => ({ parents: [p, ...st.parents] })),

  resetDemo: () => set(() => ({ ...resetDemoData() } as Partial<DataState>)),
}));

/** Convenience selector: staff members usable as CRM managers. */
export function useManagers(): User[] {
  return useDataStore((s) => s.staff);
}

export function useDataSnapshot(): DemoData {
  return useDataStore() as unknown as DemoData;
}
