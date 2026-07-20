"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Shield,
  User as UserIcon,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface Permission {
  id: string;
  tabId: string;
  canRead: boolean;
  canWrite: boolean;
}

interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  permissions: Permission[];
}

const ALL_TABS = [
  "DASHBOARD",
  "PROJECTS",
  "SESSIONS",
  "MEMORY",
  "PLANS",
  "SKILLS",
  "TERMINAL",
  "SETTINGS",
];

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const isAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (isAdmin) fetchUsers();
    else setLoading(false);
  }, [isAdmin]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(user: AppUser) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast({ title: `User ${updated.isActive ? "enabled" : "disabled"}`, variant: "success" });
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">Access Denied</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Only super admins can manage users
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users and permissions
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Role</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Created</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      user.role === "SUPER_ADMIN" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                    }`}>
                      {user.role === "SUPER_ADMIN" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                      {user.role.toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      {user.isActive ? (
                        <><ToggleRight className="h-4 w-4 text-green-500" /> Active</>
                      ) : (
                        <><ToggleLeft className="h-4 w-4 text-muted-foreground" /> Disabled</>
                      )}
                    </button>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setEditUser(user)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Dialog */}
      {showAdd && (
        <UserFormDialog
          onClose={() => setShowAdd(false)}
          onCreated={(u) => {
            setUsers((prev) => [u, ...prev]);
            setShowAdd(false);
            toast({ title: "User created", variant: "success" });
          }}
        />
      )}

      {/* Edit User Dialog */}
      {editUser && (
        <UserEditDialog
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={(u) => {
            setUsers((prev) => prev.map((p) => (p.id === u.id ? u : p)));
            setEditUser(null);
            toast({ title: "User updated", variant: "success" });
          }}
        />
      )}
    </div>
  );
}

function UserFormDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (u: AppUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const user = await res.json();
      onCreated(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold mb-4">Add User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function UserEditDialog({
  user,
  onClose,
  onUpdated,
}: {
  user: AppUser;
  onClose: () => void;
  onUpdated: (u: AppUser) => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(user.permissions);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          password: password || undefined,
          permissions: permissions.map((p) => ({
            tabId: p.tabId,
            canRead: p.canRead,
            canWrite: p.canWrite,
          })),
        }),
      });
      const updated = await res.json();
      onUpdated(updated);
    } catch { /* handled */ } finally {
      setSaving(false);
    }
  }

  function togglePerm(tabId: string, field: "canRead" | "canWrite") {
    setPermissions((prev) =>
      prev.map((p) => (p.tabId === tabId ? { ...p, [field]: !p[field] } : p))
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="USER">User</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">New Password (leave blank to keep)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Permissions</label>
            <div className="space-y-1 rounded-lg border border-input p-3">
              {ALL_TABS.map((tab) => {
                const perm = permissions.find((p) => p.tabId === tab) || { tabId: tab, canRead: false, canWrite: false };
                return (
                  <div key={tab} className="flex items-center justify-between py-1">
                    <span className="text-xs font-medium w-24">{tab}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perm.canRead}
                          onChange={() => togglePerm(tab, "canRead")}
                          className="rounded border-input"
                        />
                        Read
                      </label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perm.canWrite}
                          onChange={() => togglePerm(tab, "canWrite")}
                          className="rounded border-input"
                        />
                        Write
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
