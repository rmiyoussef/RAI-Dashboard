"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Clock,
  XCircle,
  ExternalLink,
  Search,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

interface Session {
  id: string;
  claudeSessionId: string;
  name: string | null;
  status: "ACTIVE" | "IDLE" | "CLOSED";
  pid: number | null;
  startedAt: string;
  lastActivityAt: string;
  project: { name: string; path: string };
  _count: { logs: number };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = sessions.filter(
    (s) =>
      (s.name || s.claudeSessionId).toLowerCase().includes(search.toLowerCase()) ||
      s.project.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Activity className="h-4 w-4 text-green-500" />;
      case "IDLE":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "CLOSED":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const activeCount = sessions.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor Claude Code sessions across all projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              {activeCount} active
            </span>
          )}
          <button
            onClick={fetchSessions}
            className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No sessions found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length === 0
              ? "Add a project to start monitoring Claude Code sessions"
              : "No sessions match your search"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Link
                  href={`/sessions/${session.id}`}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      {statusIcon(session.status)}
                      {session.status === "ACTIVE" && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {session.name || session.claudeSessionId.slice(0, 16)}...
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{session.project.name}</span>
                        <span>·</span>
                        <span>{session._count.logs} logs</span>
                        {session.pid && (
                          <>
                            <span>·</span>
                            <span>PID {session.pid}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="hidden sm:block">
                      {timeAgo(session.lastActivityAt)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        session.status === "ACTIVE"
                          ? "bg-green-500/10 text-green-500"
                          : session.status === "IDLE"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {session.status.toLowerCase()}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
