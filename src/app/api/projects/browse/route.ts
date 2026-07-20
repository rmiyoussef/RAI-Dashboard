import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const COMMON_ROOTS = [
  "/var/www",
  "/home/rami",
  "/home",
  "/opt",
  "/srv",
];

const CLAUDE_PROJECTS_DIR = path.join(
  process.env.HOME || "/home/rami",
  ".claude",
  "projects"
);

export async function GET() {
  const sess = await auth();
  if (!sess?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects: { name: string; path: string; hasBrain: boolean; source: string }[] = [];
  const seen = new Set<string>();

  // 1. Claude Code projects
  try {
    const entries = await fs.readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // decode ~ path encoding: "-var-www-Foo" -> "/var/www/Foo"
      const p = "/" + entry.name.replace(/-/g, "/");
      // fix double slash at start
      const fixedPath = p.replace(/^\/\//, "/");
      const realPath = fixedPath.replace(/\/+/g, "/");
      if (seen.has(realPath)) continue;
      seen.add(realPath);
      // check if dir exists
      try { await fs.access(realPath); } catch { continue; }
      const hasBrain = await hasFile(realPath, ".brain");
      projects.push({
        name: entry.name.replace(/^-/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        path: realPath,
        hasBrain,
        source: "claude",
      });
    }
  } catch {}

  // 2. Scan common roots for project files (package.json, composer.json, etc.)
  const markers = ["package.json", "composer.json", "Cargo.toml", "go.mod", "pyproject.toml", "requirements.txt", "pubspec.yaml", "Gemfile", "mix.exs", "CMakeLists.txt", ".git"];
  for (const root of COMMON_ROOTS) {
    try {
      await fs.access(root);
      const dirs = await scanDir(root, 2, seen, markers);
      for (const d of dirs) {
        const hasBrain = await hasFile(d, ".brain");
        projects.push({
          name: path.basename(d),
          path: d,
          hasBrain,
          source: "filesystem",
        });
      }
    } catch {}
  }

  // 3. Also check cwd
  const cwd = process.cwd();
  if (!seen.has(cwd)) {
    const hasBrain = await hasFile(cwd, ".brain");
    projects.push({
      name: path.basename(cwd),
      path: cwd,
      hasBrain,
      source: "current",
    });
  }

  projects.sort((a, b) => {
    if (a.source === "current") return -1;
    if (b.source === "current") return 1;
    if (a.hasBrain && !b.hasBrain) return -1;
    if (!a.hasBrain && b.hasBrain) return 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(projects);
}

async function hasFile(dir: string, name: string): Promise<boolean> {
  try {
    await fs.access(path.join(dir, name));
    return true;
  } catch {
    return false;
  }
}

async function scanDir(
  dir: string,
  depth: number,
  seen: Set<string>,
  markers: string[]
): Promise<string[]> {
  if (depth <= 0) return [];
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const fullPath = path.join(dir, entry.name);
      if (seen.has(fullPath)) continue;

      // Check if this is a project (has marker files)
      let isProject = false;
      for (const marker of markers) {
        if (await hasFile(fullPath, marker)) { isProject = true; break; }
      }

      if (isProject) {
        seen.add(fullPath);
        results.push(fullPath);
      } else if (depth > 1) {
        const sub = await scanDir(fullPath, depth - 1, seen, markers);
        results.push(...sub);
      }
    }
  } catch {}
  return results;
}
