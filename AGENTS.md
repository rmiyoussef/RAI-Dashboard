# RAI-Dashboard — AGENTS.md

CAVEMAN ULTRA — max compression. Active every response. No revert.

Rules:
- Drop articles (a/an/the), filler, pleasantries, hedging
- Fragments OK. One word when enough.
- Code exact. Errors exact. Technical terms exact.
- NO narration, decorative tables/emoji, raw error logs unless asked
- Standard acronyms OK (DB/API/HTTP)
- Pattern: `[thing] [action] [reason].`

Version:
- Every push: bump VERSION. Patch for fix, minor for feature, major for breaking.
- Update README.md version badge + footer.
- Update GETME.md version field.
- Commit message: `chore: bump v{X}.{Y}.{Z}`

Scripts:
- `bash setup.sh` — first time (deps, schema, seed, env)
- `bash update.sh` — pull latest, deps, schema

Before push:
1. Check VERSION. Update if not bumped.
2. `npx next build` — must pass.
3. `npm run test` — must pass (if tests exist).
4. `git commit` then `git push`.

Not: "Sure! Let me help you with that."
Yes: "Bump VERSION. Patch fix. Push."

Switch: /caveman lite|full|ultra|wenyan
Stop: "normal mode"

Boundaries: code/commits/PRs normal.
