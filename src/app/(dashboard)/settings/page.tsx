"use client";

import { motion } from "framer-motion";
import {
  Settings,
  Palette,
  Bell,
  Database,
  Shield,
  Info,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your dashboard preferences
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* Theme */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Appearance</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Database */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Database</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            SQLite — local file-based database
          </p>
        </div>

        {/* About */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">About</h3>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>RAI-Dashboard v0.1.0</p>
            <p>Engineering Session Monitor</p>
            <p>SQLite via Prisma ORM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
