#!/bin/bash
# Start both the Next.js dev server and the session watcher
echo "🚀 Starting RAI-Dashboard..."
echo ""

# Start watcher in background
echo "📡 Starting session watcher..."
npx tsx --no-warnings scripts/session-watcher.ts &
WATCHER_PID=$!
echo "   Watcher PID: $WATCHER_PID"

# Start Next.js dev server
echo "🌐 Starting Next.js dev server..."
npm run dev

# Cleanup on exit
kill $WATCHER_PID 2>/dev/null
