"use client";

import { useSession } from "next-auth/react";
import { useDashboardStore } from "@/store/dashboard";
import { Menu, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DashboardHeader() {
  const { data: session } = useSession();
  const { setSidebarOpen, sidebarOpen, activeSessionCount } = useDashboardStore();
  const user = session?.user as any;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-sidebar px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-muted-foreground hover:text-foreground transition-colors md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AnimatePresence>
            {activeSessionCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs text-green-500"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                {activeSessionCount} active
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {user?.name || "User"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role?.toLowerCase().replace("_", " ") || "user"}
          </p>
        </div>
      </div>
    </header>
  );
}
