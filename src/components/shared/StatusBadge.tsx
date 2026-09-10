"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, LeadStage, PaymentStatus, StudentStatus } from "@/lib/types";

type Tone = "success" | "warning" | "danger" | "info" | "muted" | "default";

export function StatusBadge({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <Badge variant={tone === "default" ? "default" : tone} className={cn("gap-1.5", className)}>
      {dot ? (
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
            tone === "danger" && "bg-danger",
            tone === "info" && "bg-info",
            tone === "muted" && "bg-muted-foreground",
            tone === "default" && "bg-primary-foreground",
          )}
        />
      ) : null}
      {children}
    </Badge>
  );
}

export const ATTENDANCE_META: Record<AttendanceStatus, { label: string; tone: Tone; emoji: string }> = {
  present: { label: "Keldi", tone: "success", emoji: "🟢" },
  late: { label: "Kechikdi", tone: "warning", emoji: "🟡" },
  absent: { label: "Kelmagan", tone: "danger", emoji: "🔴" },
  excused: { label: "Sababli", tone: "info", emoji: "🔵" },
};

export const PAYMENT_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  paid: { label: "To‘langan", tone: "success" },
  partial: { label: "Qisman", tone: "warning" },
  debt: { label: "Qarzdor", tone: "danger" },
};

export const STUDENT_STATUS_META: Record<StudentStatus, { label: string; tone: Tone }> = {
  active: { label: "Faol", tone: "success" },
  inactive: { label: "Nofaol", tone: "muted" },
  graduated: { label: "Bitiruvchi", tone: "info" },
};

export const LEAD_STAGE_META: Record<LeadStage, { label: string; tone: Tone }> = {
  new: { label: "Yangi lid", tone: "info" },
  contacted: { label: "Bog‘lanildi", tone: "default" },
  demo: { label: "Demo dars", tone: "warning" },
  trial: { label: "Sinov", tone: "default" },
  contract: { label: "Shartnoma", tone: "default" },
  accepted: { label: "Qabul qilindi", tone: "success" },
  rejected: { label: "Rad etildi", tone: "danger" },
};

export const EXPENSE_CATEGORIES: Record<string, { label: string; tone: Tone }> = {
  rent: { label: "Ijara", tone: "default" },
  utilities: { label: "Kommunal", tone: "info" },
  food: { label: "Oshxona", tone: "warning" },
  materials: { label: "Materiallar", tone: "success" },
  repairs: { label: "Ta’mir", tone: "muted" },
  transport: { label: "Transport", tone: "info" },
  marketing: { label: "Reklama", tone: "default" },
  other: { label: "Boshqa", tone: "muted" },
};
