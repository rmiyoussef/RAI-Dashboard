"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  XCircle,
  ArrowLeft,
  Terminal,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface SessionDetail {
  id: string;
  claudeSessionId: string;
  name: string | null;
  status: string;
  pid: number | null;
  startedAt: string;
  lastActivityAt: string;
  metadata: string | null;
  project: { name: string; path: string };
  logs: { id: string; type: string; content: string; timestamp: string }[];
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 15000);
    return () => clearInterval(interval);
  }, [id]);

  async function fetchSession() {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      const data = await res.json();
      setSession(data);
    } catch (err) {
      console.error("Failed to fetch session", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <XCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">Session not found</h3>
        <Link href="/sessions" className="text-sm text-primary mt-2">
          Back to sessions
        </Link>
      </div>
    );
  }

  const statusConfig = {
    ACTIVE: { icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
    IDLE: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    CLOSED: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted" },
  }[session.status] || { icon: Activity, color: "text-muted-foreground", bg: "bg-muted" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link
          href="/sessions"
          className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">
              {session.name || session.claudeSessionId.slice(0, 16)}...
            </h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3" />
              {session.status.toLowerCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {session.project.name} — started {formatDate(session.startedAt)}
          </p>
        </div>
        <button
          onClick={fetchSession}
          className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Session ID", value: session.claudeSessionId },
          { label: "Project", value: session.project.name },
          { label: "PID", value: session.pid?.toString() || "N/A" },
          { label: "Started", value: formatDate(session.startedAt) },
          { label: "Last Activity", value: formatDate(session.lastActivityAt) },
          { label: "Log Entries", value: session.logs.length.toString() },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium mt-0.5 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          Session Log
        </h2>
        <div className="rounded-xl border border-border bg-card">
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-1 font-mono text-xs">
            {session.logs.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No log entries yet
              </p>
            ) : (
              session.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 py-1 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground shrink-0 w-16">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-foreground break-all">{log.content}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
