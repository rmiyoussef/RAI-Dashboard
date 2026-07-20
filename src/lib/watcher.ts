import fs from "fs";
import path from "path";
import os from "os";
import { prisma } from "./db";
import { syncProject } from "./sync";

const CLAUDE_SESSIONS_DIR = path.join(os.homedir(), ".claude", "sessions");
const POLL_INTERVAL = 5000; // 5s

type EventCallback = (event: WatcherEvent) => void;

export type WatcherEvent =
  | { type: "session:started"; sessionId: string; projectId: string; name: string }
  | { type: "session:ended"; sessionId: string; projectId: string }
  | { type: "session:updated"; sessionId: string; projectId: string; status: string }
  | { type: "sync:complete"; projectId: string; projectName: string; stats: any }
  | { type: "stats:updated"; stats: any }
  | { type: "error"; message: string };

const subscribers = new Set<EventCallback>();

let pollTimer: ReturnType<typeof setInterval> | null = null;
let knownSessions = new Map<string, number>(); // sessionId -> pid

export function subscribe(cb: EventCallback) {
  subscribers.add(cb);
  if (subscribers.size === 1) startPolling();
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) stopPolling();
  };
}

function broadcast(event: WatcherEvent) {
  for (const cb of subscribers) cb(event);
}

function startPolling() {
  pollLoop(); // immediate first run
  pollTimer = setInterval(pollLoop, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

async function pollLoop() {
  try {
    await scanSessions();
    await broadcastStats();
  } catch {}
}

async function scanSessions() {
  try {
    await fs.promises.access(CLAUDE_SESSIONS_DIR);
    const entries = await fs.promises.readdir(CLAUDE_SESSIONS_DIR);
    const currentIds = new Set<string>();

    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue;
      const pid = parseInt(entry.replace(".json", ""), 10);
      if (isNaN(pid)) continue;

      try {
        const content = await fs.promises.readFile(path.join(CLAUDE_SESSIONS_DIR, entry), "utf-8");
        const meta = JSON.parse(content);
        const sessionId = meta.sessionId;
        if (!sessionId) continue;
        currentIds.add(sessionId);

        // Find matching project — with auto-create fallback
        let project = await prisma.project.findFirst({
          where: { path: meta.cwd || "" },
        });
        if (!project) {
          const cwd = meta.cwd || "";
          const projectName = cwd.split("/").filter(Boolean).pop() || cwd;
          project = await prisma.project.create({
            data: { name: projectName, path: cwd },
          });
          console.log(`[watcher] Auto-created project: ${projectName} (${cwd})`);
        }

        const wasKnown = knownSessions.has(sessionId);
        const oldPid = knownSessions.get(sessionId);

        if (!wasKnown) {
          // New session
          await prisma.session.upsert({
            where: { claudeSessionId: sessionId },
            update: { pid, status: "ACTIVE", lastActivityAt: new Date() },
            create: {
              claudeSessionId: sessionId,
              projectId: project.id,
              pid,
              name: meta.name,
              status: "ACTIVE",
              startedAt: meta.startedAt ? new Date(meta.startedAt) : new Date(),
              lastActivityAt: new Date(),
            },
          });
          knownSessions.set(sessionId, pid);
          broadcast({
            type: "session:started",
            sessionId,
            projectId: project.id,
            name: meta.name || sessionId.slice(0, 8),
          });
        } else if (oldPid !== pid) {
          // Session updated (new PID)
          await prisma.session.update({
            where: { claudeSessionId: sessionId },
            data: { pid, status: "ACTIVE", lastActivityAt: new Date() },
          });
          knownSessions.set(sessionId, pid);
        }

        // Update lastActivityAt periodically
        await prisma.session.updateMany({
          where: { claudeSessionId: sessionId },
          data: { lastActivityAt: new Date() },
        });
      } catch {}
    }

    // Mark sessions gone from disk as CLOSED
    for (const [sessionId, pid] of knownSessions) {
      if (!currentIds.has(sessionId)) {
        const session = await prisma.session.findUnique({
          where: { claudeSessionId: sessionId },
        });
        if (session && session.status !== "CLOSED") {
          await prisma.session.update({
            where: { claudeSessionId: sessionId },
            data: { status: "CLOSED", lastActivityAt: new Date() },
          });
          broadcast({
            type: "session:ended",
            sessionId,
            projectId: session.projectId,
          });
          knownSessions.delete(sessionId);
        }
      }
    }
  } catch {}
}

async function broadcastStats() {
  try {
    const [projects, activeSessions, totalSessions, memoryFiles, skills, plans] = await Promise.all([
      prisma.project.count(),
      prisma.session.count({ where: { status: "ACTIVE" } }),
      prisma.session.count(),
      prisma.memoryFile.count(),
      prisma.skill.count(),
      prisma.plan.count(),
    ]);
    broadcast({
      type: "stats:updated",
      stats: { projects, activeSessions, totalSessions, memoryFiles, skills, plans },
    });
  } catch {}
}

// Start watching automatically on import (singleton)
let started = false;
export function ensureWatcherRunning() {
  if (started) return;
  started = true;
  startPolling();
}
