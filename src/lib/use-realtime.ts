"use client";

import { useEffect, useState, useRef } from "react";
import { useDashboardStore } from "@/store/dashboard";

export interface RealtimeStats {
  projects: number;
  activeSessions: number;
  totalSessions: number;
  memoryFiles: number;
  skills: number;
  plans: number;
}

export function useRealtimeStats(): { stats: RealtimeStats; loading: boolean } {
  const [stats, setStats] = useState<RealtimeStats>({
    projects: 0, activeSessions: 0, totalSessions: 0,
    memoryFiles: 0, skills: 0, plans: 0,
  });
  const [loading, setLoading] = useState(true);
  const {
    setSessionCount,
    setActiveSessionCount,
    setProjectCount,
  } = useDashboardStore();

  useEffect(() => {
    // Initial fetch
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
        setSessionCount(data.totalSessions);
        setActiveSessionCount(data.activeSessions);
        setProjectCount(data.projects);
      })
      .catch(() => setLoading(false));

    // SSE connection for live updates
    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "stats:updated") {
          setStats(data.stats);
          setLoading(false);
          setSessionCount(data.stats.totalSessions);
          setActiveSessionCount(data.stats.activeSessions);
          setProjectCount(data.stats.projects);
        }
      } catch {}
    };
    es.onerror = () => {
      // Will auto-reconnect
    };

    return () => es.close();
  }, [setSessionCount, setActiveSessionCount, setProjectCount]);

  return { stats, loading };
}
