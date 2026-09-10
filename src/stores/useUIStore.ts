import { create } from "zustand";

interface UIState {
  notificationPanelOpen: boolean;
  setNotificationPanel: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (open: boolean) => void;
  /** Demo flags — Settings → "Demo holatlari" */
  latency: number;
  setLatency: (ms: number) => void;
  forceError: boolean;
  setForceError: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  notificationPanelOpen: false,
  setNotificationPanel: (notificationPanelOpen) => set({ notificationPanelOpen }),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  mobileMoreOpen: false,
  setMobileMoreOpen: (mobileMoreOpen) => set({ mobileMoreOpen }),
  latency: 450,
  setLatency: (latency) => set({ latency }),
  forceError: false,
  setForceError: (forceError) => set({ forceError }),
}));
