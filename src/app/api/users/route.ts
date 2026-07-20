import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const sess = await auth();
  if (!sess?.user || (sess.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { permissions: true },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const sess = await auth();
  if (!sess?.user || (sess.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, password, name, role } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      name,
      role: role || "USER",
    },
  });

  // Create default permissions for new user
  const tabs = ["DASHBOARD", "PROJECTS", "SESSIONS", "MEMORY", "PLANS", "SKILLS", "TERMINAL"] as const;
  await prisma.userPermission.createMany({
    data: tabs.map((tabId) => ({
      userId: user.id,
      tabId: tabId as any,
      canRead: true,
      canWrite: false,
    })),
  });

  const created = await prisma.user.findUnique({
    where: { id: user.id },
    include: { permissions: true },
  });

  return NextResponse.json(created, { status: 201 });
}
