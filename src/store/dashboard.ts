import { create } from "zustand";

export interface DashboardState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  sessionCount: number;
  setSessionCount: (count: number) => void;
  activeSessionCount: number;
  setActiveSessionCount: (count: number) => void;
  projectCount: number;
  setProjectCount: (count: number) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  sessionCount: 0,
  setSessionCount: (count) => set({ sessionCount: count }),
  activeSessionCount: 0,
  setActiveSessionCount: (count) => set({ activeSessionCount: count }),
  projectCount: 0,
  setProjectCount: (count) => set({ projectCount: count }),
}));
