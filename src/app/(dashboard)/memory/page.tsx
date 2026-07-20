"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Search,
  FileText,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Edit3,
  Plus,
  Save,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface MemoryNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: MemoryNode[];
}

const categories = [
  { id: "DECISIONS", label: "Decisions", icon: FileText },
  { id: "LESSONS", label: "Lessons", icon: FileText },
  { id: "SESSIONS", label: "Sessions", icon: FileText },
  { id: "ARCHITECTURE", label: "Architecture", icon: FileText },
  { id: "BUSINESS", label: "Business", icon: FileText },
  { id: "GUIDELINES", label: "Guidelines", icon: FileText },
  { id: "TASKS", label: "Tasks", icon: FileText },
  { id: "TESTS", label: "Tests", icon: FileText },
];

export default function MemoryPage() {
  const [memoryTree, setMemoryTree] = useState<MemoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // For this demo, show DB-stored memory files grouped by category
  const [dbFiles, setDbFiles] = useState<any[]>([]);

  useEffect(() => {
    fetchMemory();
  }, []);

  async function fetchMemory() {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      setDbFiles(data);
    } catch (err) {
      console.error("Failed to fetch memory", err);
    } finally {
      setLoading(false);
    }
  }

  const grouped = categories
    .map((cat) => ({
      ...cat,
      files: dbFiles.filter((f: any) => f.category === cat.id),
    }))
    .filter((g) => g.files.length > 0 || search === "");

  const filtered = search
    ? grouped
        .map((g) => ({
          ...g,
          files: g.files.filter(
            (f: any) =>
              f.filename.toLowerCase().includes(search.toLowerCase()) ||
              (f.content || "").toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((g) => g.files.length > 0)
    : grouped;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Memory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse project brain memory — decisions, lessons, sessions, and more
        </p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search memory files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="h-4 w-24 rounded bg-muted mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No memory files</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Memory files appear here as sessions and decisions are recorded
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filtered.map((group, gi) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                  <group.icon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{group.label}</h3>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {group.files.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.files.map((file: any) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedFile({ path: file.id, name: file.filename });
                        setFileContent(file.content || "");
                        setEditing(false);
                      }}
                      className="w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                    >
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{file.filename}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                        {file.updatedAt ? formatDate(file.updatedAt).split(",")[0] : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* File Editor Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedFile(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-3xl max-h-[80vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{selectedFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(!editing)}
                  className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  {editing ? "Preview" : "Edit"}
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setEditing(false);
                  }}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {editing ? (
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full h-[400px] rounded-lg border border-input bg-background p-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/80">
                  {fileContent || "Empty file"}
                </pre>
              )}
            </div>
            {editing && (
              <div className="flex justify-end gap-2 p-4 border-t border-border">
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-input px-4 py-2 text-xs font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    toast({ title: "File saved", variant: "success" });
                    setEditing(false);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <Save className="h-3 w-3 inline mr-1" />
                  Save
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
