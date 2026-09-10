"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Layers,
  Search,
  Users,
  UsersRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useDataStore } from "@/stores/useDataStore";
import { useUIStore } from "@/stores/useUIStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { fullName } from "@/lib/utils";
import { canAccess } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Result {
  id: string;
  kind: "student" | "teacher" | "class";
  title: string;
  subtitle: string;
  href: string;
  hue?: number;
}

export function CommandSearch() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const router = useRouter();
  const role = useAuthStore((s) => s.session?.user.role) ?? "DIRECTOR";
  const { students, teachers, classes } = useDataStore();
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const results = React.useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase();
    const out: Result[] = [];
    if (canAccess(role, "students")) {
      for (const s of students) {
        const name = fullName(s.lastName, s.firstName);
        if (!query || name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)) {
          out.push({ id: s.id, kind: "student", title: name, subtitle: s.code, href: `/app/students/${s.id}`, hue: s.hue });
          if (out.length > 24) break;
        }
      }
    }
    if (canAccess(role, "teachers")) {
      for (const t of teachers) {
        const name = fullName(t.lastName, t.firstName);
        if (!query || name.toLowerCase().includes(query)) {
          out.push({ id: t.id, kind: "teacher", title: name, subtitle: "O‘qituvchi", href: `/app/teachers/${t.id}`, hue: t.hue });
          if (out.length > 30) break;
        }
      }
    }
    if (canAccess(role, "classes")) {
      for (const c of classes) {
        if (!query || c.name.toLowerCase().includes(query)) {
          out.push({ id: c.id, kind: "class", title: c.name, subtitle: `${c.studentCount} o‘quvchi · ${c.room}`, href: "/app/classes", hue: c.hue });
        }
      }
    }
    return out.slice(0, 12);
  }, [q, students, teachers, classes, role]);

  React.useEffect(() => setActive(0), [q]);

  const kindMeta: Record<Result["kind"], { label: string; icon: React.ReactNode }> = {
    student: { label: "O‘quvchi", icon: <Users /> },
    teacher: { label: "O‘qituvchi", icon: <UsersRound /> },
    class: { label: "Guruh", icon: <Layers /> },
  };

  const openResult = (r: Result) => {
    setOpen(false);
    router.push(r.href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[12dvh] translate-y-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Global qidiruv</DialogTitle>
          <DialogDescription>O‘quvchilar, o‘qituvchilar va guruhlarni qidiring</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && results[active]) {
                openResult(results[active]);
              }
            }}
            placeholder="O‘quvchi, o‘qituvchi yoki guruh qidiring…"
            className="h-12 pl-10 text-base"
          />
        </div>
        <div className="scrollbar-none -mx-2 max-h-[50dvh] space-y-1 overflow-y-auto px-2 py-1" role="listbox">
          {results.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              “{q}” bo‘yicha natija topilmadi
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.kind}_${r.id}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => openResult(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  i === active ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                {r.kind === "class" ? (
                  <span className="brand-gradient-soft flex size-9 items-center justify-center rounded-xl text-primary [&_svg]:size-4">
                    <Layers />
                  </span>
                ) : (
                  <Avatar name={r.title} hue={r.hue} size="sm" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">{r.subtitle}</span>
                </span>
                <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium uppercase">
                  {kindMeta[r.kind].icon}
                  {kindMeta[r.kind].label}
                </span>
              </button>
            ))
          )}
        </div>
        <p className="text-muted-hidden text-muted-foreground flex items-center gap-2 text-[11px]">
          <CalendarDays className="size-3" />
          <kbd className="rounded border bg-muted px-1">↑↓</kbd> tanlash ·{" "}
          <kbd className="rounded border bg-muted px-1">↵</kbd> ochish
        </p>
      </DialogContent>
    </Dialog>
  );
}
