import type { Role, User } from "./types";

/**
 * Mock authentication layer.
 *
 * SECURITY: No plaintext passwords live in this file. Demo accounts are
 * verified against SHA-256 digests. In production this module is replaced
 * 1:1 by JWT / NextAuth / Supabase Auth — the app only depends on the
 * `login()` contract and the `Role` type.
 */

export const SCHOOL_ID = "sch_01";

export const SCHOOL_NAME = "Ziyo Academy";

/** SHA-256 of the shared demo password (documented in README for the demo). */
const DEMO_PASSWORD_HASH =
  "588c55f3ce2b8569b153c5abbf13f9f74308b88a20017cc699b835cc93195d16";

export interface DemoAccount {
  phone: string;
  role: Role;
  userId: string;
  label: string;
  hue: number;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { phone: "+998900000001", role: "DIRECTOR", userId: "usr_director", label: "Direktor", hue: 258 },
  { phone: "+998900000002", role: "TEACHER", userId: "usr_teacher", label: "O‘qituvchi", hue: 152 },
  { phone: "+998900000003", role: "STUDENT", userId: "usr_student", label: "O‘quvchi", hue: 24 },
  { phone: "+998900000004", role: "PARENT", userId: "usr_parent", label: "Ota-ona", hue: 200 },
];

export const ROLE_LABELS: Record<Role, string> = {
  DIRECTOR: "Direktor",
  ADMIN: "Administrator",
  TEACHER: "O‘qituvchi",
  STUDENT: "O‘quvchi",
  PARENT: "Ota-ona",
  ACCOUNTANT: "Buxgalter",
  RECEPTION: "Qabul",
};

/** Normalize a phone: +998 90 000 00 01 / 998900000001 -> 998900000001 */
export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("7")) d = d.slice(1);
  if (!d.startsWith("998") && d.length === 9) d = "998" + d;
  return d;
}

export function formatPhone(digits: string): string {
  if (digits.length === 13 && digits.startsWith("998")) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  return digits;
}

/**
 * Async password verification via Web Crypto (SHA-256), mirroring how a real
 * backend verifies a hash. Works in all modern browsers.
 */
export async function verifyDemoPassword(password: string): Promise<boolean> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === DEMO_PASSWORD_HASH;
}

export function demoUserFor(account: DemoAccount): User {
  const names: Record<Role, string> = {
    DIRECTOR: "Dilshod Karimov",
    ADMIN: "Dilshod Karimov",
    TEACHER: "Madina Yusupova",
    STUDENT: "Aziz Rahimov",
    PARENT: "Nodira Rahimova",
    ACCOUNTANT: "Gulnora Saidova",
    RECEPTION: "Shahzoda Alimov",
  };
  return {
    id: account.userId,
    name: names[account.role],
    phone: formatPhone(account.phone),
    role: account.role,
    avatarHue: account.hue,
    schoolId: SCHOOL_ID,
    refId:
      account.role === "TEACHER"
        ? "tch_01"
        : account.role === "STUDENT"
          ? "stu_core_0001"
          : account.role === "PARENT"
            ? "par_core_0001"
            : undefined,
    createdAt: "2024-09-01",
  };
}

/** Role-based navigation & page access. The sidebar and the route guard read from here. */
export const ROLE_PAGES: Record<Role, string[]> = {
  DIRECTOR: [
    "dashboard", "students", "teachers", "classes", "attendance", "schedule", "grades",
    "homework", "exams", "payments", "expenses", "salaries", "crm", "parents",
    "messages", "notifications", "analytics", "kpi", "calendar", "settings", "ai",
  ],
  ADMIN: [
    "dashboard", "students", "teachers", "classes", "attendance", "schedule", "grades",
    "homework", "exams", "payments", "expenses", "salaries", "crm", "parents",
    "messages", "notifications", "analytics", "kpi", "calendar", "settings",
  ],
  ACCOUNTANT: [
    "dashboard", "payments", "expenses", "salaries", "analytics", "kpi",
    "messages", "notifications", "calendar", "settings",
  ],
  RECEPTION: [
    "dashboard", "students", "classes", "attendance", "schedule", "crm",
    "messages", "notifications", "calendar", "settings",
  ],
  TEACHER: [
    "dashboard", "classes", "attendance", "schedule", "grades", "homework",
    "exams", "messages", "notifications", "calendar", "settings", "ai",
  ],
  STUDENT: [
    "dashboard", "schedule", "grades", "homework", "exams", "payments",
    "messages", "notifications", "calendar", "settings", "ai",
  ],
  PARENT: [
    "dashboard", "attendance", "schedule", "grades", "homework", "payments",
    "messages", "notifications", "calendar", "settings",
  ],
};

export function canAccess(role: Role, page: string): boolean {
  return ROLE_PAGES[role].includes(page);
}
