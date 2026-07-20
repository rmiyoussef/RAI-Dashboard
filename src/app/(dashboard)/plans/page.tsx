"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Save,
  Trash2,
  Search,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface Plan {
  id: string;
  filename: string;
  content: string;
  updatedAt: string;
  createdAt: string;
  project: { name: string };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editContent, setEditContent] = useState("");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      console.error("Failed to fetch plans", err);
    } finally {
      setLoading(false);
    }
  }

  async function savePlan() {
    if (!selectedPlan) return;
    try {
      const res = await fetch("/api/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPlan.id, content: editContent }),
      });
      const updated = await res.json();
      setPlans((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setSelectedPlan(updated);
      toast({ title: "Plan saved", variant: "success" });
    } catch {
      toast({ title: "Failed to save plan", variant: "destructive" });
    }
  }

  const filtered = plans.filter(
    (p) =>
      p.filename.toLowerCase().includes(search.toLowerCase()) ||
      p.project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and edit engineering plans
          </p>
        </div>
        <button
          onClick={async () => {
            toast({ title: "Coming soon", description: "Create plan from template" });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </button>
      </motion.div>

      <div className="flex gap-4 h-[calc(100%-4rem)]">
        {/* Sidebar */}
        <div className="w-64 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            {filtered.map((plan) => (
              <button
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan);
                  setEditContent(plan.content);
                }}
                className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedPlan?.id === plan.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-muted-foreground"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{plan.filename}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {formatDate(plan.updatedAt).split(",")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          {selectedPlan ? (
            <>
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedPlan.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    in {selectedPlan.project.name}
                  </span>
                </div>
                <button
                  onClick={savePlan}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </button>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 w-full bg-background p-4 text-sm font-mono focus:outline-none resize-none"
                placeholder="Plan content goes here..."
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Select a plan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a plan from the sidebar to view or edit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
