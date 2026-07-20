import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncProject } from "@/lib/sync";
import { NextResponse } from "next/server";

export async function GET() {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sessions: true, plans: true, skills: true, memoryFiles: true } },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, path, description } = body;

  if (!name || !path) {
    return NextResponse.json({ error: "Name and path are required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.create({
      data: { name, path, description },
      include: {
        _count: { select: { sessions: true, plans: true, skills: true, memoryFiles: true } },
      },
    });

    // Auto-sync from disk
    syncProject(project.id).catch((err) =>
      console.error("Auto-sync failed:", err)
    );

    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A project with this path already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
