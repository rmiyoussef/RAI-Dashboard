import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  const sess = await auth();
  if (!sess?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { command, cwd } = body;

  if (!command) {
    return NextResponse.json({ error: "Command required" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    return NextResponse.json({
      output: stdout || stderr,
      error: stderr || null,
    });
  } catch (err: any) {
    return NextResponse.json({
      output: err.stdout || "",
      error: err.stderr || err.message,
    });
  }
}
