/**
 * Session Watcher Daemon
 *
 * Polls ~/.claude/sessions/*.json every 3 seconds to discover Claude Code
 * processes and sync them with the RAI-Dashboard database + WebSocket.
 *
 * Usage: npx tsx scripts/session-watcher.ts
 * Run alongside: npm run dev
 */

import { createClient } from "@libsql/client";
import { readdirSync, readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

// ─── Config ────────────────────────────────────────────────────────────

const CLAUDE_SESSIONS_DIR = `${homedir()}/.claude/sessions`;
const CLAUDE_PROJECTS_DIR = `${homedir()}/.claude/projects`;
const POLL_INTERVAL = 3000;
const WS_PORT = 3001;

const db = createClient({ url: "file:./dev.db" });

// ─── Types ─────────────────────────────────────────────────────────────

interface ClaudeSessionFile {
  pid: number;
  sessionId: string;
  cwd: string;
  startedAt: number;
  name?: string;
  status?: string;
  updatedAt?: number;
  waitingFor?: string;
}

interface SessionRecord {
  id: string;
  claudeSessionId: string;
  projectId: string;
  pid: number | null;
  status: string;
  name: string | null;
  startedAt: string;
  lastActivityAt: string;
  projectName?: string;
}

// ─── In-memory state ──────────────────────────────────────────────────

const knownSessionIds = new Set<string>();
const knownLogLineCounts = new Map<string, number>();

// ─── WebSocket Server ──────────────────────────────────────────────────

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`🔌 WebSocket server running on ws://localhost:${WS_PORT}`);

wss.on("connection", (ws) => {
  console.log("  ↳ Client connected");
  // Send current state immediately
  collectAllData().then((msgs) => {
    for (const msg of msgs) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    }
  });
  ws.on("close", () => console.log("  ↳ Client disconnected"));
  ws.on("error", () => {});
});

function broadcast(message: Record<string, any>) {
  const payload = JSON.stringify(message);
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      count++;
    }
  });
  if (count > 0 && process.env.DEBUG) {
    console.log(`  📡 ${message.type} → ${count} client(s)`);
  }
}

function mapStatus(claudeStatus: string | undefined): string {
  switch (claudeStatus) {
    case "busy":
    case "active":
      return "ACTIVE";
    case "waiting":
    case "idle":
      return "IDLE";
    case "closed":
      return "CLOSED";
    default:
      return "ACTIVE"; // if process is alive, it's active
  }
}

// ─── Data Collection ──────────────────────────────────────────────────

async function collectAllData() {
  return [
    { type: "sessions", data: await getSessionsData() },
    { type: "stats", data: await getStatsData() },
    { type: "activities", data: await getActivitiesData() },
  ];
}

function readClaudeSessionFiles(): Map<string, ClaudeSessionFile> {
  const sessions = new Map<string, ClaudeSessionFile>();
  try {
    const files = readdirSync(CLAUDE_SESSIONS_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const content = readFileSync(`${CLAUDE_SESSIONS_DIR}/${file}`, "utf8");
        const data = JSON.parse(content) as ClaudeSessionFile;
        if (data.sessionId && data.cwd) {
          sessions.set(data.sessionId, data);
        }
      } catch {}
    }
  } catch {}
  return sessions;
}

function getProjectDirName(path: string): string {
  // Claude encodes "/var/www/Foo" as "-var-www-Foo": every "/" becomes "-"
  return path.replace(/\//g, "-");
}

function readSessionLogs(sessionId: string, cwd: string) {
  const projectDir = getProjectDirName(cwd);
  const logPath = `${CLAUDE_PROJECTS_DIR}/${projectDir}/${sessionId}.jsonl`;
  if (!existsSync(logPath)) return { lines: 0, latestEntries: [] as any[] };

  try {
    const content = readFileSync(logPath, "utf8");
    const allLines = content.split("\n").filter(Boolean);
    const totalLines = allLines.length;
    const lastCount = knownLogLineCounts.get(sessionId) || 0;
    const newLines = allLines.slice(lastCount);
    knownLogLineCounts.set(sessionId, totalLines);

    const latestEntries: { type: string; content: string; timestamp: string }[] = [];
    for (const line of newLines) {
      try {
        const entry = JSON.parse(line);
        const ts = entry.timestamp || new Date().toISOString();
        if (entry.type === "user") {
          const txt = extractUserMessage(entry);
          if (txt) latestEntries.push({ type: "user", content: txt, timestamp: ts });
        } else if (entry.type === "assistant") {
          const tool = extractToolName(entry);
          if (tool) latestEntries.push({ type: "assistant", content: `Using: ${tool}`, timestamp: ts });
        }
      } catch {}
    }
    return { lines: totalLines, latestEntries };
  } catch {
    return { lines: 0, latestEntries: [] };
  }
}

function extractUserMessage(entry: any): string | null {
  try {
    const msg = entry.message;
    if (!msg || msg.role !== "user") return null;
    const content = msg.content;
    if (typeof content === "string") return content.substring(0, 200);
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "text") return part.text.substring(0, 200);
      }
    }
    return null;
  } catch {
    return null;
  }
}

function extractToolName(entry: any): string | null {
  try {
    const msg = entry.message;
    if (!msg || msg.role !== "assistant") return null;
    const content = msg.content;
    if (!Array.isArray(content)) return null;
    for (const part of content) {
      if (part.type === "tool_use" && part.name) return part.name;
    }
    return null;
  } catch {
    return null;
  }
}

async function ensureProjectId(cwd: string): Promise<string | null> {
  try {
    const r = await db.execute("SELECT id FROM Project WHERE path = ?", [cwd]);
    if (r.rows.length > 0) return r.rows[0].id as string;
    // Try parent dirs
    const parts = cwd.split("/");
    for (let i = parts.length - 1; i > 0; i--) {
      const parentPath = parts.slice(0, i).join("/") || "/";
      const pr = await db.execute("SELECT id FROM Project WHERE path = ?", [parentPath]);
      if (pr.rows.length > 0) return pr.rows[0].id as string;
    }
    // Auto-create project if no match found
    const projectName = cwd.split("/").filter(Boolean).pop() || cwd;
    const projectId = genCuid();
    await db.execute(
      "INSERT INTO Project (id, name, path, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))",
      [projectId, projectName, cwd]
    );
    console.log(`  ↳ Auto-created project: ${projectName} (${cwd})`);
    return projectId;
  } catch (err) {
    console.error(`  ⚠ Failed to ensure project for ${cwd}:`, err);
    return null;
  }
}

async function upsertSession(data: ClaudeSessionFile, projectId: string) {
  try {
    const existing = await db.execute("SELECT id FROM Session WHERE claudeSessionId = ?", [data.sessionId]);
    const now = new Date().toISOString();
    const startedAt = new Date(data.startedAt).toISOString();
    const lastActivity = data.updatedAt ? new Date(data.updatedAt).toISOString() : now;

    let dbId: string;
    if (existing.rows.length > 0) {
      dbId = existing.rows[0].id as string;
      await db.execute(
        "UPDATE Session SET pid = ?, status = ?, lastActivityAt = ?, name = ?, projectId = ? WHERE id = ?",
        [data.pid, mapStatus(data.status), lastActivity, data.name || null, projectId, dbId]
      );
    } else {
      dbId = genCuid();
      await db.execute(
        "INSERT INTO Session (id, claudeSessionId, projectId, pid, status, name, startedAt, lastActivityAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [dbId, data.sessionId, projectId, data.pid, mapStatus(data.status), data.name || null, startedAt, lastActivity]
      );
      console.log(`  ↳ New session: ${data.name || data.sessionId.slice(0, 8)} (${data.cwd})`);
    }
    return dbId;
  } catch (err) {
    return null;
  }
}

async function insertLogs(sessionId: string, dbSessionId: string, entries: any[]) {
  let count = 0;
  for (const entry of entries) {
    try {
      await db.execute(
        "INSERT INTO SessionLog (id, sessionId, type, content, timestamp) VALUES (?, ?, ?, ?, ?)",
        [genCuid(), dbSessionId, entry.type, entry.content, entry.timestamp]
      );
      count++;
    } catch {}
  }
  return count;
}

async function closeDeadSessions(activePids: Set<number>) {
  try {
    const active = await db.execute("SELECT id, pid, claudeSessionId FROM Session WHERE status = 'ACTIVE'");
    for (const row of active.rows) {
      const pid = row.pid as number | null;
      if (pid === null) continue;
      if (!activePids.has(pid)) {
        await db.execute(
          "UPDATE Session SET status = 'CLOSED', lastActivityAt = ? WHERE id = ?",
          [new Date().toISOString(), row.id as string]
        );
        console.log(`  ↳ Session closed: ${(row.claudeSessionId as string).slice(0, 8)}...`);
      }
    }
  } catch {}
}

async function getSessionsData(): Promise<SessionRecord[]> {
  try {
    const r = await db.execute(`
      SELECT s.*, p.name as projectName
      FROM Session s
      JOIN Project p ON s.projectId = p.id
      ORDER BY s.lastActivityAt DESC
      LIMIT 50
    `);
    return r.rows as any[];
  } catch {
    return [];
  }
}

async function getStatsData() {
  try {
    const [projects, activeSessions, totalSessions, memoryFiles, skills, plans] = await Promise.all([
      db.execute("SELECT COUNT(*) as cnt FROM Project"),
      db.execute("SELECT COUNT(*) as cnt FROM Session WHERE status = 'ACTIVE'"),
      db.execute("SELECT COUNT(*) as cnt FROM Session"),
      db.execute("SELECT COUNT(*) as cnt FROM MemoryFile"),
      db.execute("SELECT COUNT(*) as cnt FROM Skill"),
      db.execute("SELECT COUNT(*) as cnt FROM Plan"),
    ]);
    return {
      projects: (projects.rows[0] as any)?.cnt || 0,
      activeSessions: (activeSessions.rows[0] as any)?.cnt || 0,
      totalSessions: (totalSessions.rows[0] as any)?.cnt || 0,
      memoryFiles: (memoryFiles.rows[0] as any)?.cnt || 0,
      skills: (skills.rows[0] as any)?.cnt || 0,
      plans: (plans.rows[0] as any)?.cnt || 0,
    };
  } catch {
    return { projects: 0, activeSessions: 0, totalSessions: 0, memoryFiles: 0, skills: 0, plans: 0 };
  }
}

async function getActivitiesData() {
  try {
    const r = await db.execute(`
      SELECT s.id, s.status, s.name, s.claudeSessionId, s.startedAt, p.name as projectName
      FROM Session s
      JOIN Project p ON s.projectId = p.id
      ORDER BY s.lastActivityAt DESC
      LIMIT 10
    `);
    return r.rows.map((row: any) => ({
      id: row.id,
      type: row.status === "ACTIVE" ? "session_start" : "session_end",
      content: `Session ${row.name || row.claudeSessionId.slice(0, 8)} in ${row.projectName}`,
      timestamp: row.startedAt,
    }));
  } catch {
    return [];
  }
}

// ─── Polling Loop ──────────────────────────────────────────────────────

let _cuidCounter = 0;
function genCuid(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substr(2, 6);
  return `c${ts}${rand}${(_cuidCounter++ % 36).toString(36)}`;
}

async function poll() {
  const claudeSessions = readClaudeSessionFiles();
  const activePids = new Set<number>();

  for (const [sessionId, data] of claudeSessions) {
    // Check if process is alive
    try {
      process.kill(data.pid, 0);
    } catch {
      if (!knownSessionIds.has(sessionId)) continue;
    }

    activePids.add(data.pid);

    const projectId = await ensureProjectId(data.cwd);
    if (!projectId) continue;

    const dbSessionId = await upsertSession(data, projectId);
    if (!dbSessionId) continue;

    knownSessionIds.add(sessionId);

    const logResult = readSessionLogs(sessionId, data.cwd);
    if (logResult.latestEntries.length > 0) {
      const count = await insertLogs(sessionId, dbSessionId, logResult.latestEntries);
      if (count > 0) {
        broadcast({ type: "session_logs", data: { sessionId, dbSessionId, logs: logResult.latestEntries } });
      }
    }
  }

  await closeDeadSessions(activePids);

  // Broadcast full state
  const [sessionsData, statsData, activitiesData] = await Promise.all([
    getSessionsData(),
    getStatsData(),
    getActivitiesData(),
  ]);
  broadcast({ type: "sessions", data: sessionsData });
  broadcast({ type: "stats", data: statsData });
  broadcast({ type: "activities", data: activitiesData });
}

// ─── HTTP fallback API ──────────────────────────────────────────────────

const httpServer = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    if (req.url === "/api/sessions" && req.method === "GET") {
      res.end(JSON.stringify(await getSessionsData()));
      return;
    }
    if (req.url === "/api/stats" && req.method === "GET") {
      res.end(JSON.stringify(await getStatsData()));
      return;
    }
    if (req.url === "/api/activities" && req.method === "GET") {
      res.end(JSON.stringify(await getActivitiesData()));
      return;
    }
    const logMatch = req.url?.match(/^\/api\/sessions\/([^/]+)\/logs$/);
    if (logMatch && req.method === "GET") {
      const r = await db.execute(
        "SELECT * FROM SessionLog WHERE sessionId = ? ORDER BY timestamp ASC LIMIT 200",
        [logMatch[1]]
      );
      res.end(JSON.stringify(r.rows));
      return;
    }
  } catch {}

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

httpServer.listen(3002, () => {
  console.log(`🌐 HTTP fallback API: http://localhost:3002`);
});

// ─── Start ─────────────────────────────────────────────────────────────

console.log("");
console.log("╔══════════════════════════════════════════╗");
console.log("║   RAI-Dashboard Session Watcher v1.0     ║");
console.log("╚══════════════════════════════════════════╝");
console.log("");
console.log(`📁 Watching: ${CLAUDE_SESSIONS_DIR}`);
console.log(`🔌 WS: ws://localhost:${WS_PORT}`);
console.log(`⏱  Poll: every ${POLL_INTERVAL}ms`);
console.log("");

poll();
setInterval(poll, POLL_INTERVAL);

process.on("SIGINT", () => { console.log("\n👋 Shutting down..."); wss.close(); process.exit(0); });
process.on("SIGTERM", () => { console.log("\n👋 Shutting down..."); wss.close(); process.exit(0); });
