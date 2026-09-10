"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  height?: number;
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  height = 280,
}: ChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex-row items-center">
        <div className="grid gap-1">
          <CardTitle className="text-[15px]">{title}</CardTitle>
          {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
        </div>
        {action ? <CardAction className="self-center">{action}</CardAction> : null}
      </CardHeader>
      <CardContent style={{ minHeight: height }} className={cn("px-2", bodyClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function RangeChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-xl p-1" role="tablist" aria-label="Davr filtri">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
            value === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
