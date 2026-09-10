"use client";

import * as React from "react";
import {
  CloudOff,
  Inbox,
  PackageOpen,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ---------------------------------- */
/* Loading (skeleton) states          */
/* ---------------------------------- */

export function PageSkeleton({ rows = 8, withCards = true }: { rows?: number; withCards?: boolean }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Yuklanmoqda">
      {withCards ? (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : null}
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-9 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/* ---------------------------------- */
/* Empty states                       */
/* ---------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <div className="brand-gradient-soft flex size-14 items-center justify-center rounded-2xl text-primary [&_svg]:size-7">
        {icon ?? <PackageOpen />}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function NoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<Inbox />}
      title="Hech narsa topilmadi"
      description={
        query
          ? `“${query}” bo‘yicha natija yo‘q. Qidiruv so‘zini o‘zgartirib ko‘ring.`
          : "Ushbu filtr kombinatsiyasiga mos natijalar yo‘q. Filtrlarni o‘zgartirib ko‘ring."
      }
    />
  );
}

/* ---------------------------------- */
/* Error states                       */
/* ---------------------------------- */

export function ErrorState({
  title = "Xatolik yuz berdi",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-danger/30 bg-danger-soft/40 px-6 py-14 text-center"
      role="alert"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger [&_svg]:size-7">
        <CloudOff />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          <RefreshCcw />
          Qayta urinish
        </Button>
      ) : null}
    </div>
  );
}
