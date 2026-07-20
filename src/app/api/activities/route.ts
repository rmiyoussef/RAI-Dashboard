import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sess = await auth();
  if (!sess?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Combine recent sessions and logs as activity feed
  const recentSessions = await prisma.session.findMany({
    take: 10,
    orderBy: { startedAt: "desc" },
    include: { project: { select: { name: true } } },
  });

  const activities = recentSessions.map((s) => ({
    id: s.id,
    type: s.status === "ACTIVE" ? "session_start" : "session_end",
    content: `Session ${s.name || s.claudeSessionId.slice(0, 8)} in ${s.project.name}`,
    timestamp: s.startedAt.toISOString(),
  }));

  return NextResponse.json(activities);
}
