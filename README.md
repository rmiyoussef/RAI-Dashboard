# RAI-Dashboard

Engineering Session Monitor — manage Claude Code sessions, memory, plans, and skills across projects.

**Version:** v0.1.0.

Built with **Next.js 16**, **React 19**, **Prisma + libSQL**, and **NextAuth v5**.

## Quick Start

```bash
# One-command setup
bash setup.sh

# Or step-by-step:
npm install
npm run db:push
npm run seed
```

```bash
# Terminal 1: dev server
npm run dev

# Terminal 2: session watcher
npm run watch
```

**Login:** `admin@rai-dashboard.com` / `admin123`

## Features

- **Real-time session tracking** — auto-discovers active Claude Code processes
- **Project management** — browse, sync, and monitor projects
- **Memory & plans** — view Claude's persistent memory and plan files
- **Skills browser** — inspect available skills per project
- **Terminal access** — in-browser terminal for each session
- **User management** — role-based access control (SUPER_ADMIN, USER)
- **Live dashboard** — SSE-powered stats and activity feed

## Architecture

```
src/
  app/           — Next.js App Router: pages + API routes
  components/    — UI components (shadcn/ui + Radix)
  lib/           — auth, db, permissions, sync, watcher
  store/         — Zustand state management
  proxy.ts       — auth gate (Next.js 16 proxy)
scripts/
  session-watcher.ts  — daemon polling ~/.claude/sessions/ every 3s
  seed.ts             — admin user seed
prisma/
  schema.prisma       — SQLite schema via libSQL adapter
```

## Scripts

| Command | Purpose |
|---------|---------|
| `bash setup.sh` | One-shot: deps, schema, seed, env |
| `bash update.sh` | Pull latest, update deps, push schema |
| `npm run dev` | Next.js dev server (port 3000) |
| `npm run watch` | Session watcher daemon (WS:3001 / HTTP:3002) |
| `npm run seed` | Create admin user |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |

## Session Watcher

A daemon (`scripts/session-watcher.ts`) polls `~/.claude/sessions/` every 3s to discover running Claude Code sessions. It:

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

## Versioning

Version tracked in `VERSION`. Auto-bumped on each push.

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
