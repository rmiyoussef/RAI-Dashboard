import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    projects,
    activeSessions,
    totalSessions,
    memoryFiles,
    skills,
    plans,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.session.count({ where: { status: "ACTIVE" } }),
    prisma.session.count(),
    prisma.memoryFile.count(),
    prisma.skill.count(),
    prisma.plan.count(),
  ]);

  return NextResponse.json({
    projects,
    activeSessions,
    totalSessions,
    memoryFiles,
    skills,
    plans,
  });
}
