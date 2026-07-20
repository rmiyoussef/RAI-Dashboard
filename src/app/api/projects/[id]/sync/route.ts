import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { syncProject } from "@/lib/sync";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sess = await auth();
  if (!sess?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await syncProject(id);

  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
