import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sessions: { orderBy: { startedAt: "desc" }, take: 20 },
      plans: { orderBy: { updatedAt: "desc" } },
      skills: true,
      memoryFiles: { orderBy: { updatedAt: "desc" }, take: 20 },
      _count: { select: { sessions: true, plans: true, skills: true, memoryFiles: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const project = await prisma.project.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
