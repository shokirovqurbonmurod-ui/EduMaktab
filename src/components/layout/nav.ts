import type { LucideIcon } from "lucide-react";
import {
  Award,
  Banknote,
  Bell,
  BookOpenCheck,
  FileCheck2,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  Gauge,
  HeartHandshake,
  Home,
  Layers,
  LineChart,
  MessageCircle,
  Receipt,
  Settings,
  Sparkles,
  Target,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  page: string; // key for role permissions
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Asosiy",
    items: [
      { href: "/app/dashboard", label: "Bosh sahifa", icon: Home, page: "dashboard" },
      { href: "/app/analytics", label: "Analitika", icon: LineChart, page: "analytics" },
      { href: "/app/ai", label: "SchoolOS AI", icon: Sparkles, page: "ai" },
    ],
  },
  {
    title: "O'quv jarayoni",
    items: [
      { href: "/app/students", label: "O'quvchilar", icon: Users, page: "students" },
      { href: "/app/teachers", label: "O'qituvchilar", icon: UsersRound, page: "teachers" },
      { href: "/app/classes", label: "Guruhlar", icon: Layers, page: "classes" },
      { href: "/app/attendance", label: "Davomat", icon: ClipboardCheck, page: "attendance" },
      { href: "/app/schedule", label: "Jadval", icon: CalendarDays, page: "schedule" },
      { href: "/app/grades", label: "Baholar", icon: Award, page: "grades" },
      { href: "/app/homework", label: "Uy vazifalar", icon: BookOpenCheck, page: "homework" },
      { href: "/app/exams", label: "Imtihonlar", icon: FileCheck2, page: "exams" },
    ],
  },
  {
    title: "Moliya va CRM",
    items: [
      { href: "/app/payments", label: "To'lovlar", icon: Wallet, page: "payments" },
      { href: "/app/expenses", label: "Xarajatlar", icon: Receipt, page: "expenses" },
      { href: "/app/salaries", label: "Maoshlar", icon: Banknote, page: "salaries" },
      { href: "/app/crm", label: "CRM (Qabul)", icon: Target, page: "crm" },
    ],
  },
  {
    title: "Aloqa",
    items: [
      { href: "/app/parents", label: "Ota-onalar", icon: HeartHandshake, page: "parents" },
      { href: "/app/messages", label: "Xabarlar", icon: MessageCircle, page: "messages" },
      { href: "/app/calendar", label: "Kalendar", icon: Calendar, page: "calendar" },
      { href: "/app/notifications", label: "Bildirishnomalar", icon: Bell, page: "notifications" },
    ],
  },
  {
    title: "Tizim",
    items: [
      { href: "/app/kpi", label: "KPI", icon: Gauge, page: "kpi" },
      { href: "/app/settings", label: "Sozlamalar", icon: Settings, page: "settings" },
    ],
  },
];

export const MOBILE_TABS: { href: string; label: string; icon: LucideIcon; page: string }[] = [
  { href: "/app/dashboard", label: "Bosh sahifa", icon: Home, page: "dashboard" },
  { href: "/app/students", label: "O'quvchilar", icon: Users, page: "students" },
  { href: "/app/schedule", label: "Jadval", icon: CalendarDays, page: "schedule" },
  { href: "/app/messages", label: "Xabarlar", icon: MessageCircle, page: "messages" },
];
