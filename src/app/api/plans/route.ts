import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where = projectId ? { projectId } : {};
  const plans = await prisma.plan.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { project: { select: { name: true } } },
  });

  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, filename, content } = body;

  if (!projectId || !filename) {
    return NextResponse.json({ error: "projectId and filename required" }, { status: 400 });
  }

  try {
    const plan = await prisma.plan.create({
      data: { projectId, filename, content: content || "" },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Plan already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, content } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const plan = await prisma.plan.update({
    where: { id },
    data: { content },
  });

  return NextResponse.json(plan);
}
