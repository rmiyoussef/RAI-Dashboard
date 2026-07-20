# RAI-Dashboard — GETME.md

## Project Identity

| Field | Value |
|-------|-------|
| Name | RAI-Dashboard |
| Version | v0.1.0 |
| Stack | Next.js 16, React 19, Prisma + libSQL, NextAuth v5 |
| DB | SQLite (dev.db) via libSQL adapter |
| Auth | Credentials (NextAuth v5) |
| Real-time | SSE + WebSocket |
| UI | shadcn/ui, Radix, Tailwind CSS, Tailwind v4 |
| State | Zustand |
| Testing | Vitest (unit), Playwright (e2e) |

## Ports

| Port | Service |
|------|---------|
| 3000 | Next.js dev server |
| 3001 | Session watcher WebSocket |
| 3002 | Session watcher HTTP fallback API |

## Quick Start

```bash
npm install              # deps
npm run db:push          # push schema to dev.db
npm run seed             # create admin@rai-dashboard.com / admin123
npm run dev              # start server (terminal 1)
npm run watch            # start session watcher (terminal 2)
```

## Default Credentials

- **Email:** admin@rai-dashboard.com
- **Password:** admin123

## Key Files

| File | Purpose |
|------|---------|
| `src/proxy.ts` | Auth gate (Next.js 16 proxy, replaces middleware) |
| `src/lib/db.ts` | Prisma client with libSQL adapter |
| `src/lib/auth.ts` | NextAuth v5 config |
| `src/lib/watcher.ts` | In-app session watcher (SSE) |
| `scripts/session-watcher.ts` | Standalone daemon (WebSocket + HTTP) |
| `prisma/schema.prisma` | DB schema (SQLite) |
| `scripts/seed.ts` | Admin user seed |
| `VERSION` | Current version |
| `.claude/memory/guidelines.md` | Debug guide |

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/stats` | GET | ✅ | Dashboard stats |
| `/api/sessions` | GET/POST | ✅ | List/create sessions |
| `/api/sessions/[id]` | GET/PUT/DELETE | ✅ | Session CRUD |
| `/api/projects` | GET/POST | ✅ | Project list/create |
| `/api/projects/[id]` | GET/PUT/DELETE | ✅ | Project CRUD |
| `/api/projects/browse` | GET | ✅ | Browse cwd projects |
| `/api/memory` | GET/POST | ✅ | Memory files |
| `/api/plans` | GET/POST | ✅ | Plans |
| `/api/skills` | GET/POST | ✅ | Skills |
| `/api/activities` | GET | ✅ | Activity feed |
| `/api/events` | GET | ✅ | SSE stream |
| `/api/users` | GET/POST | ✅ | User management |
| `/api/auth/*` | * | ❌ | NextAuth routes |

## Session Watcher Flow

```
Claude writes ~/.claude/sessions/{pid}.json
  → Watcher polls every 3s
  → Reads cwd, sessionId, pid
  → Looks up / auto-creates Project row
  → Upserts Session (status: ACTIVE/IDLE/CLOSED)
  → Reads ~/.claude/projects/{dir}/{sessionId}.jsonl for logs
  → Broadcasts via WS:3001 or HTTP:3002
```

## Architecture

```
src/
  app/           — routes (pages + API)
  components/    — UI (dashboard/, layout/, ui/)
  lib/           — core (auth, db, watcher, sync, utils)
  store/         — Zustand (dashboard.ts)
  proxy.ts       — auth gate
scripts/
  session-watcher.ts  — daemon
  seed.ts             — user seed
prisma/
  schema.prisma       — DB schema
```

## Contact

Built by **Rami Youssef** — [github.com/rmiyoussef](https://github.com/rmiyoussef)
