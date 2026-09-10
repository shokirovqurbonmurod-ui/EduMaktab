import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ---------------------------------- */
/* Uzbek localization                 */
/* ---------------------------------- */

export const MONTHS_UZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

export const MONTHS_UZ_SHORT = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyn",
  "Iyl",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

export const WEEKDAYS_UZ = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];

export const WEEKDAYS_UZ_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sha", "Ya"];

const nfUZ = new Intl.NumberFormat("uz-UZ");

export function formatNumber(n: number): string {
  return nfUZ.format(Math.round(n));
}

/** Format UZS amounts: 12 500 000 so'm / 1.2 mln so'm */
export function formatUZS(amount: number, opts: { compact?: boolean } = {}): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (opts.compact) {
    if (abs >= 1_000_000_000) return `${sign}${nfUZ.format(Math.round((abs / 1_000_000_000) * 10) / 10)} mlrd so'm`;
    if (abs >= 1_000_000) return `${sign}${nfUZ.format(Math.round((abs / 1_000_000) * 10) / 10)} mln so'm`;
    if (abs >= 1_000) return `${sign}${nfUZ.format(Math.round(abs / 1000) / 1)} ming so'm`;
  }
  return `${sign}${nfUZ.format(abs)} so'm`;
}

export function formatUZSCompact(amount: number): string {
  return formatUZS(amount, { compact: true });
}

/** ISO date-time or "HH:mm" -> "14:05" (local time) */
export function formatTimeUZ(value: string): string {
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** yyyy-mm-dd -> "10.09.2026" */
export function formatDateUZ(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

/** yyyy-mm-dd -> "10-sentabr" */
export function formatDateShortUZ(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d}-${MONTHS_UZ[(m - 1 + 12) % 12].toLowerCase()}`;
}

/** Local-timezone ISO date (UTC-safe — Uzbekistan is UTC+5). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Pure day-of-week for "yyyy-mm-dd" (no Date construction): 0=Sun … 6=Sat. */
export function weekdayOfISO(iso: string): number {
  const [y0, m, d] = iso.split("-").map(Number);
  let y = y0!;
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  if (m! < 3) y -= 1;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m! - 1]! + d!) % 7;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** "2026-09" -> "Sentabr 2026" */
export function formatMonthUZ(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS_UZ[(m - 1 + 12) % 12]} ${y}`;
}

export function formatPercent(v: number, digits = 1): string {
  const s = Number.isInteger(v) ? String(v) : v.toFixed(digits);
  return `${s}%`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function fullName(first: string, last: string, middle?: string): string {
  return [last, first, middle].filter(Boolean).join(" ");
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function relativeDayUZ(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Bugun";
  if (iso === addDaysISO(today, 1)) return "Ertaga";
  if (iso === addDaysISO(today, -1)) return "Kecha";
  return formatDateShortUZ(iso);
}
