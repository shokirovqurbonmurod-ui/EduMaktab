import { cn } from "@/lib/utils";

/** SchoolOS brand mark — abstract open book + knowledge spark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="so-logo-g" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.62 0.2 275)" />
          <stop offset="1" stopColor="oklch(0.55 0.24 305)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="29" height="29" rx="9.5" fill="url(#so-logo-g)" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="9.5" fill="white" opacity="0.06" />
      <path
        d="M8.2 13.2c2.8-1.7 5.6-1.7 7.8 0 2.2-1.7 5-1.7 7.8 0v8.6c-2.8-1.7-5.6-1.7-7.8 0-2.2-1.7-5-1.7-7.8 0v-8.6Z"
        fill="white"
        opacity="0.95"
      />
      <path d="M16 13.2v8.6" stroke="oklch(0.55 0.24 305)" strokeWidth="1.1" opacity="0.35" />
      <circle cx="16" cy="8.6" r="1.7" fill="white" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact ? (
        <div className="leading-none">
          <p className="text-[17px] font-bold tracking-tight">
            School<span className="text-gradient">OS</span>
          </p>
          <p className="text-muted-foreground mt-1 text-[10px] font-medium tracking-wide">
            Maktab boshqaruv tizimi
          </p>
        </div>
      ) : null}
    </div>
  );
}
