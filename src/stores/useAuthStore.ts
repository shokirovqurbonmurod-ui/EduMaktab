import { create } from "zustand";
import type { Session, User } from "@/lib/types";

/**
 * Mock auth store. The login flow (src/app/login) verifies the demo password
 * via SHA-256 (Web Crypto) and then stores a session object.
 *
 * Production swap: replace this store's implementation with NextAuth / JWT /
 * Supabase Auth — the rest of the app only reads `session` and `role`.
 *
 * "Meni eslab qolish" (remember me) → localStorage, otherwise sessionStorage.
 */

const KEY = "schoolos.session";

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  session: Session | null;
  hydrated: boolean;
  login: (user: User, remember: boolean) => void;
  logout: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: loadSession(),
  hydrated: typeof window !== "undefined",
  login: (user, remember) => {
    const session: Session = { user, loginAt: new Date().toISOString() };
    set({ session, hydrated: true });
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(KEY);
      (remember ? window.localStorage : window.sessionStorage).setItem(KEY, JSON.stringify(session));
    }
  },
  logout: () => {
    set({ session: null });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEY);
      window.sessionStorage.removeItem(KEY);
    }
  },
  markHydrated: () => set({ hydrated: true }),
}));
