"use client";

import { useEffect, useRef, useCallback } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { useToast } from "@/components/ui/use-toast";

interface WatcherEvent {
  type: string;
  [key: string]: any;
}

export function useRealtime() {
  const {
    setSessionCount,
    setActiveSessionCount,
    setProjectCount,
  } = useDashboardStore();
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/events");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: WatcherEvent = JSON.parse(event.data);

        switch (data.type) {
          case "stats:updated":
            setSessionCount(data.stats.totalSessions);
            setActiveSessionCount(data.stats.activeSessions);
            setProjectCount(data.stats.projects);
            break;
          case "session:started":
            toast({
              title: "Session started",
              description: `${data.name || "New session"} — project updated`,
              variant: "default",
            });
            break;
          case "session:ended":
            toast({
              title: "Session ended",
              description: `Session in project closed`,
              variant: "default",
            });
            break;
          case "sync:complete":
            toast({
              title: `Sync: ${data.projectName}`,
              description: `${data.stats?.sessions || 0} sessions, ${data.stats?.memoryFiles || 0} memory`,
              variant: "success",
            });
            break;
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      // Reconnect after 3s
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [setSessionCount, setActiveSessionCount, setProjectCount, toast]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);
}
