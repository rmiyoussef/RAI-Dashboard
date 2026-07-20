# RAI-Dashboard

**Engineering Session Monitor for Claude Code.**

A real-time dashboard that discovers, tracks, and manages Claude Code sessions across your projects. Instead of guessing what Claude is doing, you see everything live — active sessions, project memory, plans, skills, and terminal output.

```
curl -fsSL https://raw.githubusercontent.com/rmiyoussef/RAI-Dashboard/master/setup.sh | bash
```

---

## Why?

Claude Code runs in the terminal — headless, session by session. You don't know which projects are active, what's running, or whether a session is stuck until you check every terminal window.

RAI-Dashboard fixes this. It turns Claude's invisible session layer into a **live engineering console** that:

- **Discovers** every running Claude session automatically — no config needed
- **Tracks** sessions in real-time through a WebSocket daemon
- **Monitors** project memory, plans, skills, and activity in one place
- **Manages** users, permissions, and access across your team
- **Connects** to live terminals — see what Claude is doing without SSH
- **Syncs** project memory across AI tools (Claude, Cursor, Windsurf, Copilot)
- **Runs** on your machine — no cloud, no data leakage

---

## How It Works

RAI-Dashboard sits alongside your projects. A **session watcher daemon** polls `~/.claude/sessions/` every 3 seconds, discovers live Claude processes, and pushes updates to the dashboard via WebSocket + SSE.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Your Machine                           │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐   │
│  │  Claude Code  │    │     RAI-Dashboard            │   │
│  │  Session A    │    │                              │   │
│  │  (PID 10792)  │    │  ┌────────────────────────┐  │   │
│  ├──────────────┤    │  │   Next.js 16 Server     │  │   │
│  │  Claude Code  │    │  │   (localhost:3000)      │  │   │
│  │  Session B    │    │  │                        │  │   │
│  │  (PID 10797)  │    │  │  ┌──────┐  ┌───────┐  │  │   │
│  ├──────────────┤    │  │  │Pages │  │ API   │  │  │   │
│  │  Claude Code  │    │  │  │(SSR) │  │Routes │  │  │   │
│  │  Session C    │    │  │  └──────┘  └───────┘  │  │   │
│  └──────────────┘    │  └────────────────────────┘  │   │
│         │            │                              │   │
│         ▼            │  ┌────────────────────────┐  │   │
│  ┌──────────────┐    │  │  Session Watcher        │  │   │
│  │~/.claude/    │◄───┼──┤  (poll every 3s)        │  │   │
│  │ sessions/    │    │  │  WS:3001 | HTTP:3002    │  │   │
│  │ {pid}.json   │───►│  └────────────────────────┘  │   │
│  └──────────────┘    │                              │   │
│                      │  ┌────────────────────────┐  │   │
│  ┌──────────────┐    │  │  SQLite (dev.db)       │  │   │
│  │~/.claude/    │◄───┼──┤                        │  │   │
│  │ projects/    │    │  │  Projects              │  │   │
│  │ {logs}.jsonl │───►│  │  Sessions              │  │   │
│  └──────────────┘    │  │  Users / Permissions   │  │   │
│                      │  └────────────────────────┘  │   │
└─────────────────────────────────────────────────────────┘
```

### The Dashboard

When you open `http://localhost:3000`, you see:

| Section | What It Shows |
|---------|---------------|
| **Stats Grid** | Live counts: projects, active sessions, total sessions, memory files, skills, plans |
| **Activity Feed** | Recent session starts, ends, and log entries |
| **System Status** | Database health, watcher state, terminal service |
| **Sessions** | Full session list with status (ACTIVE / IDLE / CLOSED), PIDs, project names |
| **Projects** | Browse all tracked projects with sync status |
| **Memory** | View Claude's persistent memory files per project |
| **Plans** | Read plan files Claude writes during engineering |
| **Skills** | Browse available skills per project |
| **Terminal** | Live in-browser terminal for any active session |
| **Users** | Manage team access with role-based permissions |

---

## Quick Start

### Install

```bash
# Clone + one-command setup
git clone https://github.com/rmiyoussef/RAI-Dashboard.git
cd RAI-Dashboard
bash setup.sh
```

Or step-by-step:

```bash
npm install
npx prisma db push
npm run seed                     # creates admin@rai-dashboard.com / admin123
```

### Run

```bash
# Terminal 1 — dev server
npm run dev                      # → http://localhost:3000

# Terminal 2 — session watcher (auto-discovers Claude sessions)
npm run watch                    # → WS:3001 / HTTP:3002
```

### Login

| Field | Value |
|-------|-------|
| URL | `http://localhost:3000` |
| Email | `admin@rai-dashboard.com` |
| Password | `admin123` |

---

## Project Structure

```
RAI-Dashboard/
├── src/
│   ├── app/                    ← Routes (pages + API)
│   │   ├── (dashboard)/        ← Protected pages
│   │   │   ├── page.tsx        ← Dashboard home (stats, activity)
│   │   │   ├── sessions/       ← Session list + detail
│   │   │   ├── projects/       ← Project CRUD
│   │   │   ├── memory/         ← Memory files
│   │   │   ├── plans/          ← Plan files
│   │   │   ├── skills/         ← Skills browser
│   │   │   ├── terminal/       ← Live terminal
│   │   │   ├── users/          ← User management
│   │   │   └── settings/       ← Dashboard settings
│   │   ├── api/                ← REST API routes
│   │   │   ├── stats/          ← Dashboard stats
│   │   │   ├── sessions/       ← Session CRUD + logs
│   │   │   ├── projects/       ← Project CRUD + sync
│   │   │   ├── memory/         ← Memory file CRUD
│   │   │   ├── events/         ← SSE stream (live updates)
│   │   │   └── auth/           ← NextAuth v5
│   │   ├── login/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── dashboard/          ← DashboardHome, ActivityFeed, RealtimeSync
│   │   ├── layout/             ← Sidebar, DashboardHeader
│   │   └── ui/                 ← shadcn/ui (button, card, dialog, etc.)
│   ├── lib/
│   │   ├── auth.ts             ← NextAuth v5 config
│   │   ├── db.ts               ← Prisma + libSQL adapter
│   │   ├── watcher.ts          ← In-app session watcher (SSE)
│   │   ├── permissions.ts      ← Role-based access control
│   │   └── sync.ts             ← Project sync logic
│   ├── store/dashboard.ts      ← Zustand state
│   └── proxy.ts                ← Auth gate (Next.js 16 proxy)
├── scripts/
│   ├── session-watcher.ts      ← Standalone daemon (WS + HTTP)
│   └── seed.ts                 ← User seeder
├── prisma/schema.prisma        ← SQLite schema
├── GETME.md                    ← Quick reference
├── VERSION                     ← Version tracking
├── setup.sh                    ← One-shot install
└── update.sh                   ← Pull + update
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19, Tailwind CSS v4, Radix UI, shadcn/ui |
| **Database** | SQLite via Prisma + libSQL adapter |
| **Auth** | NextAuth v5 (Credentials provider) |
| **State** | Zustand v5 |
| **Real-time** | Server-Sent Events + WebSocket |
| **Charts** | Recharts |
| **Terminal** | xterm.js + @xterm/addon-fit |
| **Animation** | Framer Motion |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |

---

## API Routes

All API routes (except `/api/auth/*`) require authentication. The proxy gate redirects unauthenticated requests to `/login`.

| Route | Purpose |
|-------|---------|
| `GET /api/stats` | Dashboard counts (projects, sessions, memory, skills, plans) |
| `GET /api/sessions` | List sessions (last 50, newest first) |
| `POST /api/sessions` | Create session (claudeSessionId, projectId, pid) |
| `GET /api/sessions/[id]` | Session detail with logs |
| `GET /api/sessions/[id]/logs` | Session log entries |
| `GET /api/projects` | List all projects |
| `POST /api/projects` | Create project |
| `DELETE /api/projects/[id]` | Remove project + cascade sessions |
| `GET /api/projects/browse` | Browse filesystem for project dirs |
| `GET /api/projects/[id]/sync` | Sync project files |
| `GET /api/memory` | List memory files |
| `POST /api/memory` | Create memory entry |
| `GET /api/plans` | List plan files |
| `GET /api/skills` | List skills |
| `GET /api/activities` | Recent activity feed |
| `GET /api/events` | SSE stream for live dashboard updates |
| `GET /api/users` | List users (admin only) |
| `POST /api/users` | Create user (admin only) |

---

## Session Watcher

The watcher daemon (`scripts/session-watcher.ts`) is the core discovery engine.

### Discovery Flow

```
~/.claude/sessions/{pid}.json    ← Claude writes metadata here
         │
         ▼
Watcher polls every 3s
         │
         ├─► Read pid.json → sessionId, cwd, status, name
         │
         ├─► Lookup project by cwd path
         │      └─► Not found → auto-create Project row
         │
         ├─► Upsert Session
         │      └─► Map status: busy/active → ACTIVE
         │         waiting/idle → IDLE
         │         closed → CLOSED
         │
         ├─► Read ~/.claude/projects/{dir}/{id}.jsonl for logs
         │      └─► Parse user messages + tool calls
         │
         ├─► Kill stale: close sessions with dead PIDs
         │
         └─► Broadcast full state via WS:3001 + HTTP:3002
```

### Dual Watcher Mode

| Watcher | When It Runs | DB Client |
|---------|-------------|-----------|
| **Daemon** (`scripts/session-watcher.ts`) | `npm run watch` (dedicated terminal) | `@libsql/client` (raw SQL) |
| **In-app** (`src/lib/watcher.ts`) | When browser tab has dashboard open | Prisma adapter |

Both write to the same `dev.db`. The daemon provides WS + HTTP fallback; the in-app watcher feeds the SSE stream.

---

## Database Schema

```prisma
model User        { id, email, hashedPassword, name, role (SUPER_ADMIN|USER), permissions }
model Session     { id, claudeSessionId (unique), projectId, pid, status (ACTIVE|IDLE|CLOSED), logs }
model Project     { id, name, path (unique), sessions, plans, skills, memoryFiles }
model SessionLog  { id, sessionId, type, content, timestamp }
model Plan        { id, projectId, filename, content }
model Skill       { id, projectId, filename, content, category }
model MemoryFile  { id, projectId, category, filename, content }
model UserPermission { userId, tabId, canRead, canWrite }
```

---

## Version Roadmap

| Version | Focus | Status |
|---------|-------|--------|
| v0.1 | **Initial Release** — dashboard, session discovery, watcher daemon | ✅ Live |
| v0.2 | **Multi-project sync** — auto-create projects from Claude cwd | ✅ Live |
| v0.3 | **Real-time SSE** — live dashboard updates without refresh | ✅ Live |
| v0.4 | **Session logs & activity feed** — see what Claude is doing live | ✅ Live |
| v0.5 | **Terminal access** — in-browser xterm per session | ✅ Live |
| v0.6 | **User management** — roles, permissions, tab-level access | ✅ Live |
| v0.7 | **RAI-Engineering integration** — Brain agents, caveman, memory | ✅ Live |
| v0.8 | **E2E testing** — Playwright test suite | ✅ Live |
| v1.0 | **Stable** — production-ready, documented, versioned | 🔲 Planned |

---

## Development

```bash
# Clone
git clone git@github.com:rmiyoussef/RAI-Dashboard.git
cd RAI-Dashboard

# Install + setup
bash setup.sh

# Run
npm run dev        # Terminal 1: http://localhost:3000
npm run watch      # Terminal 2: session watcher

# Test
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright E2E

# Build
npx next build     # Production build
```

---

## Built With

- [Next.js](https://nextjs.org/) — v16, App Router, Turbopack
- [React](https://react.dev/) — v19
- [Prisma](https://www.prisma.io/) + [libSQL](https://libsql.org/) — database
- [NextAuth.js](https://next-auth.js.org/) — authentication
- [shadcn/ui](https://ui.shadcn.com/) — component system
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Zustand](https://zustand-demo.pmnd.rs/) — state management
- [Recharts](https://recharts.org/) — charts
- [xterm.js](https://xtermjs.org/) — terminal emulator

---

<div align="center">
  <br>
  <sub>
    Built with ❤️ by
    <a href="https://github.com/rmiyoussef">
      <b>Rami Youssef</b>
    </a>
    <br>
    <small>RAI-Dashboard — v0.1.0</small>
  </sub>
  <br>
</div>

---

## License

MIT — see [LICENSE](LICENSE) for details.
