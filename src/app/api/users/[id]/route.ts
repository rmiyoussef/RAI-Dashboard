import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  if (!sess?.user || (sess.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password) {
    data.hashedPassword = await bcrypt.hash(body.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { permissions: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  if (!sess?.user || (sess.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Don't allow deleting yourself
  if (id === (sess.user as any).id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  if (!sess?.user || (sess.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Update permissions
  if (body.permissions) {
    // Delete existing permissions and recreate
    await prisma.userPermission.deleteMany({ where: { userId: id } });
    await prisma.userPermission.createMany({
      data: body.permissions.map((p: any) => ({
        userId: id,
        tabId: p.tabId,
        canRead: p.canRead,
        canWrite: p.canWrite,
      })),
    });
  }

  if (body.name || body.role !== undefined || body.isActive !== undefined || body.password) {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.role !== undefined) data.role = body.role;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.password) {
      data.hashedPassword = await bcrypt.hash(body.password, 12);
    }
    await prisma.user.update({ where: { id }, data });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { permissions: true },
  });

  return NextResponse.json(user);
}
