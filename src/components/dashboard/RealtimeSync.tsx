"use client";

import { useEffect } from "react";
import { useRealtimeStats } from "@/lib/use-realtime";
import { useDashboardStore } from "@/store/dashboard";

/**
 * Mounted once in the dashboard layout.
 * Keeps the zustand store in sync with WebSocket data so the
 * sidebar badge and header always show live counts.
 */
export function RealtimeSync() {
  const { stats } = useRealtimeStats();
  const { setSessionCount, setActiveSessionCount, setProjectCount } = useDashboardStore();

  useEffect(() => {
    setSessionCount(stats.totalSessions);
    setActiveSessionCount(stats.activeSessions);
    setProjectCount(stats.projects);
  }, [stats, setSessionCount, setActiveSessionCount, setProjectCount]);

  return null;
}
