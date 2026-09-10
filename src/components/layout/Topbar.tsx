"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  Command,
  LogOut,
  Menu,
  Moon,
  School,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useUIStore } from "@/stores/useUIStore";
import { useDataStore } from "@/stores/useDataStore";
import { ROLE_LABELS, SCHOOL_NAME } from "@/lib/auth";

const SCHOOLS = [
  { id: "sch_01", name: "Ziyo Academy", city: "Toshkent" },
  { id: "sch_02", name: "Ziyo Academy — Filial 1", city: "Toshkent, Yunusobod" },
];

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setNotificationPanel = useUIStore((s) => s.setNotificationPanel);
  const unread = useDataStore((s) => s.notifications.filter((n) => !n.read).length);
  const [school, setSchool] = React.useState(SCHOOLS[0]!);

  if (!session) return null;

  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:px-6">
        {onMenu ? (
          <Button variant="ghost" size="icon" className="size-10 lg:hidden" onClick={onMenu} aria-label="Menyu">
            <Menu />
          </Button>
        ) : null}

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-10 flex-1 items-center gap-2.5 rounded-xl border bg-card/70 px-3.5 text-sm text-muted-foreground shadow-xs transition-all hover:border-ring/40 hover:bg-card sm:max-w-md"
          aria-label="Global qidiruv"
        >
          <Search className="size-4" />
          <span className="flex-1 truncate text-left">Qidirish: o‘quvchi, guruh, o‘qituvchi…</span>
          <kbd className="hidden items-center gap-0.5 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:flex">
            <Command className="size-3" />K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* School selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden h-10 gap-2 md:flex">
                <Building2 className="size-4 text-primary" />
                <span className="max-w-36 truncate text-left font-medium">{school.name}</span>
                <ChevronDown className="size-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2">
                <School className="size-4" /> Maktabni tanlang
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SCHOOLS.map((s) => (
                <DropdownMenuItem key={s.id} onClick={() => setSchool(s)}>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-muted-foreground text-xs">{s.city}</p>
                  </div>
                  {school.id === s.id ? <Check className="text-primary" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme */}
          <Button variant="ghost" size="icon" className="size-10" onClick={toggleTheme} aria-label="Mavzuni almashtirish">
            {theme === "light" ? <Moon /> : <Sun />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative size-10"
            onClick={() => setNotificationPanel(true)}
            aria-label={`Bildirishnomalar${unread ? ` — ${unread} o'qilmagan` : ""}`}
          >
            <Bell />
            {unread > 0 ? (
              <span className="absolute top-2 right-2 flex size-2">
                <span className="bg-danger absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                <span className="bg-danger relative inline-flex size-2 rounded-full" />
              </span>
            ) : null}
          </Button>

          <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-accent"
                aria-label="Profil menyu"
              >
                <Avatar name={session.user.name} hue={session.user.avatarHue} size="md" />
                <div className="hidden text-left leading-tight md:block">
                  <p className="max-w-36 truncate text-[13px] font-semibold">{session.user.name}</p>
                  <p className="text-muted-foreground text-[11px]">{ROLE_LABELS[session.user.role]}</p>
                </div>
                <ChevronDown className="text-muted-hidden hidden size-3.5 opacity-50 md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5 py-1">
                  <span className="text-sm font-semibold">{session.user.name}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {session.user.phone} · {SCHOOL_NAME}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/app/settings")}>
                <UserRound /> Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/app/settings")}>
                <Settings /> Sozlamalar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                <LogOut /> Chiqish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
