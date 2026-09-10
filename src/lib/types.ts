/**
 * SchoolOS — domain models (database-ready).
 *
 * These types mirror the tables a real backend (Postgres/Supabase) would use.
 * Swap the demo data layer (src/lib/demo) for API calls and the rest of the
 * app keeps working unchanged.
 */

/* ---------------------------------- */
/* Identity & access                  */
/* ---------------------------------- */

export type Role =
  | "DIRECTOR"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "ACCOUNTANT"
  | "RECEPTION";

export type Gender = "male" | "female";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  avatarHue: number;
  schoolId: string;
  /** Linked entity, e.g. teacher/student/parent record id */
  refId?: string;
  createdAt: string;
}

export interface Session {
  user: User;
  loginAt: string;
}

export interface School {
  id: string;
  name: string;
  shortName: string;
  address: string;
  city: string;
  phone: string;
  logoHue: number;
}

/* ---------------------------------- */
/* Academics                          */
/* ---------------------------------- */

export type StudentStatus = "active" | "inactive" | "graduated";
export type PaymentStatus = "paid" | "partial" | "debt";

export interface Parent {
  id: string;
  name: string;
  phone: string;
  occupation?: string;
  address?: string;
  childrenIds: string[];
  hue: number;
  status: "active" | "inactive";
  notes?: string;
}

export interface Student {
  id: string;
  code: string; // e.g. SM-2026-0148
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  birthDate: string;
  groupId: string;
  parentIds: string[];
  phone?: string;
  address?: string;
  status: StudentStatus;
  joinDate: string;
  attendanceRate: number; // 0..100
  avgGrade: number; // 0..10
  paymentStatus: PaymentStatus;
  hue: number;
  behaviorScore: number; // 0..100
  certificates: Certificate[];
}

export interface Certificate {
  id: string;
  title: string;
  date: string;
  issuer: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  subjectId: string;
  phone: string;
  email: string;
  hireDate: string;
  status: "active" | "vacation" | "resigned";
  groupsIds: string[];
  monthlySalary: number; // UZS
  kpiScore: number; // 0..100
  rating: number; // 0..5
  attendanceRate: number; // 0..100
  hue: number;
}

export interface ScheduleSlot {
  day: number; // 0 = Dushanba … 5 = Shanba
  start: string;
  end: string;
  subjectId: string;
  teacherId: string;
  room: string;
}

export interface SchoolClass {
  id: string;
  name: string; // "9-A"
  type: "class" | "club";
  teacherId: string;
  studentCount: number;
  room: string;
  attendanceRate: number;
  avgResult: number; // 0..100
  monthlyPayment: number; // per student, UZS
  hue: number;
  schedule: ScheduleSlot[];
  description?: string;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  hue: number;
}

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // yyyy-mm-dd
  status: AttendanceStatus;
  time?: string;
  note?: string;
  method: "manual" | "qr" | "face";
}

export type GradeType = "homework" | "test" | "exam" | "participation";

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  type: GradeType;
  value: number; // 2..10 (Uzbek 10-point scale)
  date: string;
  teacherId: string;
  note?: string;
}

export interface Homework {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  description: string;
  dueDate: string;
  createdAt: string;
  fileName?: string;
  totalStudents: number;
  submittedCount: number;
  submissions: HomeworkSubmission[];
  status: "open" | "grading" | "closed";
}

export interface HomeworkSubmission {
  studentId: string;
  submittedAt: string;
  grade?: number;
  comment?: string;
}

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  date: string;
  durationMin: number;
  questionCount: number;
  maxScore: number;
  status: "scheduled" | "finished";
  results: ExamResult[];
}

export interface ExamResult {
  studentId: string;
  score: number;
  rank: number;
}

/* ---------------------------------- */
/* Finance                            */
/* ---------------------------------- */

export interface Payment {
  id: string;
  studentId: string;
  amount: number; // UZS
  date: string;
  month: string; // "2026-09"
  method: "cash" | "card" | "bank";
  status: PaymentStatus;
  invoiceId?: string;
  note?: string;
}

export interface Invoice {
  id: string;
  number: string;
  studentId: string;
  amount: number;
  issuedAt: string;
  dueDate: string;
  status: "paid" | "partial" | "unpaid" | "overdue";
}

export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "food"
  | "materials"
  | "repairs"
  | "transport"
  | "marketing"
  | "other";

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidBy: string;
  method: "cash" | "card" | "bank";
  note?: string;
}

export interface Salary {
  id: string;
  teacherId: string;
  month: string; // "2026-09"
  base: number;
  bonus: number;
  deduction: number;
  total: number;
  status: "pending" | "approved" | "paid";
  paidAt?: string;
}

export interface CashFlowPoint {
  month: string; // label
  revenue: number;
  expenses: number;
  profit: number;
}

/* ---------------------------------- */
/* CRM                                */
/* ---------------------------------- */

export type LeadStage =
  | "new"
  | "contacted"
  | "demo"
  | "trial"
  | "contract"
  | "accepted"
  | "rejected";

export type LeadSource = "telegram" | "instagram" | "referral" | "site" | "walkin" | "other";

export interface Lead {
  id: string;
  name: string;
  parentName: string;
  phone: string;
  course: string;
  source: LeadSource;
  stage: LeadStage;
  managerId: string;
  nextFollowUp: string;
  value: number; // expected monthly, UZS
  note?: string;
  createdAt: string;
}

/* ---------------------------------- */
/* Communication                      */
/* ---------------------------------- */

export type MessageChannel = "director" | "teachers" | "parents" | "groups";

export interface Message {
  id: string;
  channel: MessageChannel;
  channelId: string; // conversation id
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  sentAt: string;
}

export type NotificationType =
  | "attendance"
  | "finance"
  | "academic"
  | "event"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: string;
  read: boolean;
  actorName?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  type: "exam" | "meeting" | "parent-meeting" | "holiday" | "event" | "payment";
  location?: string;
  allDay?: boolean;
  hue: number;
}

/* ---------------------------------- */
/* KPI                                */
/* ---------------------------------- */

export interface KpiRecord {
  teacherId: string;
  attendance: number;
  progress: number;
  homework: number;
  satisfaction: number;
  exams: number;
  lessonQuality: number;
  total: number; // 0..100
  trend: number; // -10..+10
}

/* ---------------------------------- */
/* Aggregates (for dashboards)        */
/* ---------------------------------- */

export interface KpiSummary {
  students: number;
  teachers: number;
  attendanceToday: number; // %
  revenueMonth: number; // UZS
  debt: number; // UZS
  groups: number;
  lessonsActive: number;
  lessonsWaiting: number;
  issues: number;
}

export type DateRange = "today" | "7d" | "30d" | "3m" | "1y";
