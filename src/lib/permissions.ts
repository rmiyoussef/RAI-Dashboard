import { auth } from "./auth";

export type TabId =
  | "DASHBOARD"
  | "PROJECTS"
  | "SESSIONS"
  | "MEMORY"
  | "PLANS"
  | "SKILLS"
  | "USERS"
  | "TERMINAL"
  | "SETTINGS";

export async function checkPermission(
  tabId: TabId,
  action: "read" | "write" = "read"
): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const user = session.user as any;

  // Super admin has full access
  if (user.role === "SUPER_ADMIN") return true;

  // Check specific permission
  const perm = user.permissions?.find(
    (p: any) => p.tabId === tabId
  );
  if (!perm) return false;

  return action === "read" ? perm.canRead : perm.canWrite;
}

export function hasPermission(
  user: any,
  tabId: TabId,
  action: "read" | "write" = "read"
): boolean {
  if (user?.role === "SUPER_ADMIN") return true;
  if (!user?.permissions) return false;

  const perm = user.permissions.find((p: any) => p.tabId === tabId);
  if (!perm) return false;

  return action === "read" ? perm.canRead : perm.canWrite;
}

export function tabLabel(tabId: TabId): string {
  const labels: Record<TabId, string> = {
    DASHBOARD: "Dashboard",
    PROJECTS: "Projects",
    SESSIONS: "Sessions",
    MEMORY: "Memory",
    PLANS: "Plans",
    SKILLS: "Skills",
    USERS: "Users",
    TERMINAL: "Terminal",
    SETTINGS: "Settings",
  };
  return labels[tabId];
}
