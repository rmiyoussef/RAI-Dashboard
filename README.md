# RAI-Dashboard

Engineering Session Monitor — manage Claude Code sessions, memory, plans, and skills across projects.

Built with **Next.js 16**, **React 19**, **Prisma + libSQL**, and **NextAuth v5**.

## Features

- **Real-time session tracking** — auto-discovers active Claude Code processes
- **Project management** — browse, sync, and monitor projects
- **Memory & plans** — view Claude's persistent memory and plan files
- **Skills browser** — inspect available skills per project
- **Terminal access** — in-browser terminal for each session
- **User management** — role-based access control (SUPER_ADMIN, USER)
- **Live dashboard** — SSE-powered stats and activity feed

## Getting Started

```bash
# Install dependencies
npm install

# Push DB schema
npm run db:push

# Seed admin user (admin@rai-dashboard.com / admin123)
npm run seed

# Start dev server
npm run dev

# Start session watcher (separate terminal)
npm run watch
```

## Architecture

```
src/
  app/           — Next.js App Router: pages + API routes
  components/    — UI components (shadcn/ui + Radix)
  lib/           — auth, db, permissions, sync, watcher
  store/         — Zustand state management
  scripts/       — session-watcher daemon, DB seed
  proxy.ts       — auth gate (Next.js 16 proxy)
prisma/
  schema.prisma  — SQLite schema via libSQL adapter
```

## Session Watcher

A daemon script (`scripts/session-watcher.ts`) polls `~/.claude/sessions/` every 3 seconds to discover running Claude Code sessions. It:

- Reads Claude session metadata (PID, cwd, status)
- Auto-creates project records for new directories
- Tails session logs for real-time activity
- Broadcasts via WebSocket (port 3001) + HTTP fallback (port 3002)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS, Radix, shadcn/ui |
| Database | SQLite via Prisma + libSQL adapter |
| Auth | NextAuth v5 (Credentials) |
| State | Zustand |
| Real-time | SSE / WebSocket |
| Charts | Recharts |
| Terminal | xterm.js |

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <br>
  <sub>
    Built with ❤️ by
    <a href="https://github.com/rmiyoussef">
      <b>Rami Youssef</b>
    </a>
    <br>
    <small>RAI-Engineering — v1.1</small>
  </sub>
  <br>
</div>

---
