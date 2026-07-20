"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Plus,
  Save,
  Trash2,
  Edit3,
  Search,
  Code,
  FileJson,
  FileCode,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface Skill {
  id: string;
  filename: string;
  content: string;
  category: string;
  updatedAt: string;
  createdAt: string;
  project: { name: string };
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSkills();
  }, []);

  async function fetchSkills() {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      setSkills(data);
    } catch (err) {
      console.error("Failed to fetch skills", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSkill() {
    if (!selectedSkill) return;
    try {
      const res = await fetch("/api/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSkill.id,
          content: editContent,
          category: editCategory,
        }),
      });
      const updated = await res.json();
      setSkills((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setSelectedSkill(updated);
      toast({ title: "Skill saved", variant: "success" });
    } catch {
      toast({ title: "Failed to save skill", variant: "destructive" });
    }
  }

  async function deleteSkill(id: string) {
    try {
      await fetch(`/api/skills?id=${id}`, { method: "DELETE" });
      setSkills((prev) => prev.filter((s) => s.id !== id));
      if (selectedSkill?.id === id) setSelectedSkill(null);
      toast({ title: "Skill deleted", variant: "success" });
    } catch {
      toast({ title: "Failed to delete skill", variant: "destructive" });
    }
    setDeleteConfirm(null);
  }

  const categories = [...new Set(skills.map((s) => s.category))];
  const filtered = skills.filter(
    (s) =>
      s.filename.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage engineering skills and domain knowledge
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
      </motion.div>

      <div className="flex gap-4 h-[calc(100%-4rem)]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-3 overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat}>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 px-1">
                  {cat}
                </h4>
                {filtered
                  .filter((s) => s.category === cat)
                  .map((skill) => (
                    <div key={skill.id} className="group relative">
                      <button
                        onClick={() => {
                          setSelectedSkill(skill);
                          setEditContent(skill.content);
                          setEditCategory(skill.category);
                        }}
                        className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          selectedSkill?.id === skill.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent text-muted-foreground"
                        }`}
                      >
                        <Code className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{skill.filename}</span>
                      </button>
                      {deleteConfirm === skill.id ? (
                        <div className="absolute right-0 top-0 flex gap-1 bg-background border border-border rounded-lg p-1 shadow-lg">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-[10px] hover:bg-accent rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deleteSkill(skill.id)}
                            className="px-2 py-1 text-[10px] text-destructive hover:bg-destructive/10 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(skill.id);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          {selectedSkill ? (
            <>
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedSkill.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    in {selectedSkill.project.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-28 rounded-md border border-input bg-background px-2 py-1 text-xs"
                    placeholder="category"
                  />
                  <button
                    onClick={saveSkill}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </button>
                </div>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 w-full bg-background p-4 text-sm font-mono focus:outline-none resize-none"
                placeholder="Skill content..."
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
              <Wrench className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Select a skill</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a skill to view or edit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
