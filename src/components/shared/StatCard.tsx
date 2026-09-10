"use client";

import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCountUp } from "@/lib/hooks";
import { cn, formatNumber } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  /** format function; default = integer with spaces */
  format?: (v: number) => string;
  icon: React.ReactNode;
  iconClass?: string;
  delta?: number; // percent
  deltaLabel?: string;
  hint?: string;
  spark?: number[];
  delay?: number;
}

export function StatCard({
  label,
  value,
  format = (v) => formatNumber(v),
  icon,
  iconClass,
  delta,
  deltaLabel = "oldingi davrga nisbatan",
  hint,
  spark,
  delay = 0,
}: StatCardProps) {
  const animated = useCountUp(value);
  return (
    <Card
      className="card-hover relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {spark && spark.length > 1 ? (
        <Sparkline data={spark} />
      ) : null}
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
          <p className="num mt-1.5 text-2xl font-bold tracking-tight sm:text-[28px]">{format(animated)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {delta != null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  delta >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                )}
              >
                {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(delta).toFixed(1)}%
              </span>
            ) : null}
            {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
          </div>
        </div>
        <div
          className={cn(
            "brand-gradient-soft flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary [&_svg]:size-5",
            iconClass,
          )}
        >
          {icon}
        </div>
      </div>
      {deltaLabel ? (
        <p className="text-muted-foreground relative mt-3 text-[11px]">{deltaLabel}</p>
      ) : null}
    </Card>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 200;
  const h = 56;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1]!.split(",").map(Number);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full opacity-40"
      aria-hidden
    >
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill="url(#sparkfill)" />
      <polyline points={pts.join(" ")} fill="none" stroke="var(--chart-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--chart-1)" />
    </svg>
  );
}
