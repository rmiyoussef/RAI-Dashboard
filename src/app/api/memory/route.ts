import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    // Get project-specific memory files from DB
    const files = await prisma.memoryFile.findMany({
      orderBy: [{ category: "asc" }, { filename: "asc" }],
      include: { project: { select: { name: true } } },
    });
    return NextResponse.json(files);
  }

  // Try to load from .brain directory on disk
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const brainPath = path.join(project.path, ".brain");
  try {
    await fs.access(brainPath);
    const files = await loadMemoryTree(brainPath);
    return NextResponse.json(files);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

interface MemoryNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: MemoryNode[];
}

async function loadMemoryTree(dir: string): Promise<MemoryNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodes: MemoryNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const children = await loadMemoryTree(fullPath);
      nodes.push({ name: entry.name, path: fullPath, type: "directory", children });
    } else if (entry.name.endsWith(".md")) {
      nodes.push({ name: entry.name, path: fullPath, type: "file" });
    }
  }

  return nodes.sort((a, b) => a.name.localeCompare(b.name));
}

export async function POST(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, category, filename, content } = body;

  if (!projectId || !filename) {
    return NextResponse.json({ error: "projectId and filename required" }, { status: 400 });
  }

  const memoryFile = await prisma.memoryFile.upsert({
    where: { projectId_category_filename: { projectId, category, filename } },
    update: { content },
    create: { projectId, category, filename, content },
  });

  return NextResponse.json(memoryFile, { status: 201 });
}
