import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, path: true } },
      logs: { orderBy: { timestamp: "desc" }, take: 100 },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const session = await prisma.session.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
