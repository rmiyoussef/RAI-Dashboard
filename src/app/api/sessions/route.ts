import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where = projectId ? { projectId } : {};

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: 50,
    include: {
      project: { select: { name: true, path: true } },
      _count: { select: { logs: true } },
    },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { claudeSessionId, projectId, pid, name } = body;

  if (!claudeSessionId || !projectId) {
    return NextResponse.json({ error: "claudeSessionId and projectId required" }, { status: 400 });
  }

  try {
    const session = await prisma.session.create({
      data: { claudeSessionId, projectId, pid, name, status: "ACTIVE" },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Session already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
