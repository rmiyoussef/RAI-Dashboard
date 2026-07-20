"use client";

import { motion } from "framer-motion";
import {
  Activity,
  FolderKanban,
  Brain,
  Terminal,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { ActivityFeed } from "./ActivityFeed";
import { useRealtimeStats } from "@/lib/use-realtime";

export function DashboardHome() {
  const { stats, loading } = useRealtimeStats();

  const statCards = [
    {
      label: "Projects",
      value: stats.projects,
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Sessions",
      value: stats.activeSessions,
      icon: Activity,
      color: "text-green-500",
      bg: "bg-green-500/10",
      pulse: true,
    },
    {
      label: "Total Sessions",
      value: stats.totalSessions,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Memory Files",
      value: stats.memoryFiles,
      icon: Brain,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Skills",
      value: stats.skills,
      icon: Terminal,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Plans",
      value: stats.plans,
      icon: TrendingUp,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your engineering sessions and projects
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className={cn("rounded-lg p-2", card.bg)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
              {card.pulse && stats.activeSessions > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <motion.p
                key={loading ? 0 : card.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold"
              >
                {loading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" />
                ) : (
                  card.value
                )}
              </motion.p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            System Status
          </h2>
          <div className="space-y-3">
            {[
              { label: "Database", status: "operational" as const },
              { label: "Session Watcher", status: stats.activeSessions > 0 ? "operational" : "idle" as const },
              { label: "File System", status: "operational" as const },
              { label: "Terminal Service", status: "ready" as const },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      item.status === "operational"
                        ? "bg-green-500"
                        : item.status === "idle"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    )}
                  />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
