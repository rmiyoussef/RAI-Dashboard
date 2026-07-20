import { auth } from "@/lib/auth";
import { ensureWatcherRunning, subscribe, type WatcherEvent } from "@/lib/watcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const sess = await auth();
  if (!sess?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Ensure background watcher is running (server-side singleton)
  ensureWatcherRunning();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

      const unsub = subscribe((event: WatcherEvent) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch {
          // stream closed
        }
      });

      // Keep-alive ping every 30s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(`: keepalive\n\n`);
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(keepAlive);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
