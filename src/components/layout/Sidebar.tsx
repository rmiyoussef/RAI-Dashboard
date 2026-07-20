"use client";

import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Activity,
  Brain,
  FileText,
  Wrench,
  Users,
  Terminal,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Menu,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "@/store/dashboard";
import { Avatar } from "@/components/ui/avatar";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tabId: "DASHBOARD" },
  { href: "/projects", label: "Projects", icon: FolderKanban, tabId: "PROJECTS" },
  { href: "/sessions", label: "Sessions", icon: Activity, tabId: "SESSIONS", countKey: "sessionCount" as const },
  { href: "/memory", label: "Memory", icon: Brain, tabId: "MEMORY" },
  { href: "/plans", label: "Plans", icon: FileText, tabId: "PLANS" },
  { href: "/skills", label: "Skills", icon: Wrench, tabId: "SKILLS" },
  { href: "/terminal", label: "Terminal", icon: Terminal, tabId: "TERMINAL" },
  { href: "/users", label: "Users", icon: Users, tabId: "USERS", adminOnly: true },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings, tabId: "SETTINGS" },
];

function SidebarItem({
  item,
  collapsed,
  isActive,
  onClose,
}: {
  item: (typeof navItems)[number];
  collapsed: boolean;
  isActive: boolean;
  onClose?: () => void;
}) {
  const count = item.countKey
    ? useDashboardStore((s) =>
        item.countKey === "sessionCount" ? s.sessionCount : 0
      )
    : null;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {count !== null && count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-lg bg-primary/10 -z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, toggleSidebar } = useDashboardStore();
  const user = session?.user as any;
  const isAdmin = user?.role === "SUPER_ADMIN";

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 240 : 64,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "relative z-50 flex flex-col border-r border-border bg-sidebar",
          "fixed inset-y-0 left-0 md:relative",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PanelLeft className="h-4 w-4" />
            </div>
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-semibold truncate"
                >
                  RAI-Dashboard
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                collapsed={!sidebarOpen}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              />
            ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3 space-y-1">
          {bottomItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              collapsed={!sidebarOpen}
              isActive={pathname === item.href}
            />
          ))}

          {/* User & Logout */}
          <div className={cn("pt-2 border-t border-border mt-2", !sidebarOpen && "flex justify-center")}>
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold">
                      {user?.email?.[0]?.toUpperCase() || "A"}
                    </div>
                  </Avatar>
                  <span className="truncate max-w-[120px]">{user?.email}</span>
                </div>
                <button
                  data-testid="logout-btn"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Collapse button */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "flex items-center justify-center w-full rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
              sidebarOpen ? "justify-end px-2" : "px-0"
            )}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
