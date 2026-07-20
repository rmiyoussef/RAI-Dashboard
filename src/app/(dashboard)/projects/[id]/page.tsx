"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FolderKanban,
  Activity,
  FileText,
  Brain,
  Wrench,
  RefreshCw,
  Trash2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProjectDetail {
  id: string;
  name: string;
  path: string;
  description: string | null;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  sessions: any[];
  plans: any[];
  skills: any[];
  memoryFiles: any[];
  _count: {
    sessions: number;
    plans: number;
    skills: number;
    memoryFiles: number;
  };
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProject();
  }, [id]);

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.error("Failed to fetch project", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch(`/api/projects/${id}/sync`, { method: "POST" });
      const data = await res.json();
      toast({
        title: "Sync complete",
        description: `${data.sessions || 0} sessions, ${data.memoryFiles || 0} memory, ${data.skills || 0} skills, ${data.plans || 0} plans`,
        variant: "success",
      });
      fetchProject();
    } catch {
      toast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete() {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      toast({ title: "Project deleted", variant: "success" });
      router.push("/projects");
    } catch {
      toast({ title: "Failed to delete project", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FolderKanban className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">Project not found</h3>
        <Link href="/projects" className="text-sm text-primary mt-2">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link
          href="/projects"
          className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{project.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">
            {project.path}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </motion.div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-2xl font-bold">{project._count.sessions}</span>
          </div>
          <p className="text-xs text-muted-foreground">Sessions</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-2xl font-bold">{project._count.plans}</span>
          </div>
          <p className="text-xs text-muted-foreground">Plans</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-1">
            <Wrench className="h-4 w-4" />
            <span className="text-2xl font-bold">{project._count.skills}</span>
          </div>
          <p className="text-xs text-muted-foreground">Skills</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Brain className="h-4 w-4" />
            <span className="text-2xl font-bold">{project._count.memoryFiles}</span>
          </div>
          <p className="text-xs text-muted-foreground">Memory Files</p>
        </div>
      </div>

      {project.lastSyncedAt && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last synced {timeAgo(project.lastSyncedAt)}
        </p>
      )}

      {/* Sessions */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-500" />
          Sessions ({project.sessions.length})
        </h2>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {project.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              No sessions yet. Click Sync to scan for Claude Code sessions.
            </p>
          ) : (
            project.sessions.slice(0, 10).map((s: any) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    s.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                  }`}>
                    {s.status}
                  </span>
                  <span className="text-sm">{s.name || s.claudeSessionId?.slice(0, 12)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(s.startedAt)}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Plans & Skills Quick View */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Plans
          </h2>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {project.plans.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">No plans</p>
            ) : (
              project.plans.map((p: any) => (
                <div key={p.id} className="p-3 flex items-center justify-between">
                  <span className="text-sm">{p.filename}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(p.updatedAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-purple-500" />
            Skills
          </h2>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {project.skills.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">No skills</p>
            ) : (
              project.skills.map((s: any) => (
                <div key={s.id} className="p-3 flex items-center justify-between">
                  <span className="text-sm">{s.filename}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold mb-2">Delete Project?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete "{project.name}" and all its sessions, plans, skills, and memory files from the dashboard.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
