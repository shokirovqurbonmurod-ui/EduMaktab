"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterBar({ children, className, activeCount = 0 }: { children: React.ReactNode; className?: string; activeCount?: number }) {
  return (
    <div
      className={cn(
        "scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1 [&>*]:shrink-0",
        className,
      )}
    >
      {activeCount > 0 ? (
        <span className="text-muted-foreground flex items-center gap-1.5 rounded-xl border bg-card px-2.5 py-1.5 text-xs font-medium">
          <SlidersHorizontal className="size-3.5" />
          {activeCount} filtr faol
        </span>
      ) : null}
      {children}
    </div>
  );
}
