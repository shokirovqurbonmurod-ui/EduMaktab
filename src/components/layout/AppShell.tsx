"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { NotificationPanel } from "./NotificationPanel";
import { CommandSearch } from "./CommandSearch";
import { Toaster } from "@/components/ui/sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

/**
 * The protected app chrome: sidebar + glass topbar + iOS bottom nav +
 * global overlays. Pages render inside <main> with a transition wrapper.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="app-glow min-h-dvh">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />

      {/* Mobile nav drawer (reuses desktop sidebar) */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigatsiya</SheetTitle>
          </SheetHeader>
          <div className="min-h-full">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className={cn(collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]", "transition-[padding] duration-300")}>
        <Topbar onMenu={() => setMobileNavOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 pt-5 pb-28 sm:px-6 lg:pt-7 lg:pb-12">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
      </div>

      <MobileNav />
      <NotificationPanel />
      <CommandSearch />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter" aria-live="polite">
      {children}
    </div>
  );
}

export { Logo };
