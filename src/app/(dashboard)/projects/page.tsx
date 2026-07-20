"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Edit3,
  Activity,
  FileText,
  Brain,
  Wrench,
  MoreHorizontal,
  Terminal,
  FolderOpen,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, timeAgo } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  path: string;
  description: string | null;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  _count: {
    sessions: number;
    plans: number;
    skills: number;
    memoryFiles: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      toast({ title: "Failed to load projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(id: string) {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Project deleted", variant: "success" });
    } catch {
      toast({ title: "Failed to delete project", variant: "destructive" });
    }
    setDeleteConfirm(null);
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your engineering projects
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Project List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse"
            >
              <div className="h-5 w-3/4 rounded bg-muted mb-3" />
              <div className="h-3 w-full rounded bg-muted mb-2" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add a project to start monitoring Claude Code sessions
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add your first project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="group relative rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300"
              >
                {/* Delete confirm */}
                {deleteConfirm === project.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/95 backdrop-blur-sm">
                    <div className="text-center p-4">
                      <p className="text-sm font-medium mb-3">
                        Delete {project.name}?
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-semibold text-sm hover:text-primary transition-colors"
                      >
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        {project.isActive ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Active
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            Inactive
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/projects/${project.id}/sync`, { method: "POST" });
                          const data = await res.json();
                          toast({ title: "Synced", description: `${data.sessions || 0} sessions, ${data.memoryFiles || 0} memory files, ${data.skills || 0} skills, ${data.plans || 0} plans`, variant: "success" });
                          fetchProjects();
                        } catch {
                          toast({ title: "Sync failed", variant: "destructive" });
                        }
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                      title="Sync from disk"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditProject(project)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(project.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3 line-clamp-2 font-mono">
                  {project.path}
                </p>

                {project.description && (
                  <p className="text-xs text-muted-foreground/70 mb-3 line-clamp-1">
                    {project.description}
                  </p>
                )}

                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${project._count.sessions > 0 ? "text-green-500" : ""}`}>{project._count.sessions}</p>
                    <p className="text-[10px] text-muted-foreground">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${project._count.plans > 0 ? "text-blue-500" : ""}`}>{project._count.plans}</p>
                    <p className="text-[10px] text-muted-foreground">Plans</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${project._count.skills > 0 ? "text-purple-500" : ""}`}>{project._count.skills}</p>
                    <p className="text-[10px] text-muted-foreground">Skills</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${project._count.memoryFiles > 0 ? "text-amber-500" : ""}`}>{project._count.memoryFiles}</p>
                    <p className="text-[10px] text-muted-foreground">Memory</p>
                  </div>
                </div>
                {project.lastSyncedAt && (
                  <p className="text-[10px] text-muted-foreground mt-2 text-right">
                    Synced {timeAgo(project.lastSyncedAt)}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onCreated={(project) => {
          setProjects((prev) => [project, ...prev]);
          setShowAddDialog(false);
          toast({ title: "Project created", variant: "success" });
        }}
      />

      {/* Edit Project Dialog */}
      {editProject && (
        <EditProjectDialog
          project={editProject}
          onClose={() => setEditProject(null)}
          onUpdated={(updated) => {
            setProjects((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
            setEditProject(null);
            toast({ title: "Project updated", variant: "success" });
          }}
        />
      )}
    </div>
  );
}

function AddProjectDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [browseResults, setBrowseResults] = useState<any[]>([]);
  const [browsing, setBrowsing] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);

  // Browse available projects
  async function handleBrowse() {
    setBrowsing(true);
    try {
      const res = await fetch("/api/projects/browse");
      const data = await res.json();
      setBrowseResults(data);
      setShowBrowser(true);
    } catch {
      setError("Failed to scan directories");
    } finally {
      setBrowsing(false);
    }
  }

  function selectProject(p: { name: string; path: string }) {
    setName(p.name);
    setPath(p.path);
    setShowBrowser(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, path, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const project = await res.json();
      onCreated(project);
      setName("");
      setPath("");
      setDescription("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
            <DialogDescription>
              Add a new project to monitor Claude Code sessions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="My Project"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Path</label>
                <button
                  type="button"
                  onClick={handleBrowse}
                  disabled={browsing}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {browsing ? "Scanning..." : "Browse projects →"}
                </button>
              </div>
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                required
                placeholder="/var/www/my-project"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional description..."
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Browser dialog */}
      <Dialog open={showBrowser} onOpenChange={(open) => !open && setShowBrowser(false)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Project</DialogTitle>
            <DialogDescription>
              Choose from detected projects across your system
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {browseResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {browsing ? "Scanning..." : "No projects found. Type the path manually."}
              </div>
            ) : (
              <div className="space-y-1 pb-4">
                {browseResults.map((p) => (
                  <button
                    key={p.path}
                    type="button"
                    onClick={() => selectProject(p)}
                    className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors group"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      p.hasBrain ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{p.path}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.hasBrain && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-medium">
                          Brain
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground capitalize">{p.source}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditProjectDialog({
  project,
  onClose,
  onUpdated,
}: {
  project: Project;
  onClose: () => void;
  onUpdated: (project: Project) => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      onUpdated(data);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
