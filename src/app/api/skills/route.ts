import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where = projectId ? { projectId } : {};
  const skills = await prisma.skill.findMany({
    where,
    orderBy: [{ category: "asc" }, { filename: "asc" }],
    include: { project: { select: { name: true } } },
  });

  return NextResponse.json(skills);
}

export async function POST(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, filename, content, category } = body;

  if (!projectId || !filename) {
    return NextResponse.json({ error: "projectId and filename required" }, { status: 400 });
  }

  try {
    const skill = await prisma.skill.create({
      data: { projectId, filename, content: content || "", category: category || "general" },
    });
    return NextResponse.json(skill, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Skill already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, filename, content, category } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const data: any = {};
  if (content !== undefined) data.content = content;
  if (filename !== undefined) data.filename = filename;
  if (category !== undefined) data.category = category;

  const skill = await prisma.skill.update({ where: { id }, data });
  return NextResponse.json(skill);
}

export async function DELETE(req: Request) {
  const sess = await auth();
  if (!sess?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.skill.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
