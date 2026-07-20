"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Terminal as TerminalIcon,
  FolderKanban,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  path: string;
}

export default function TerminalPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function runCommand() {
    if (!command.trim() || !selectedProject) return;

    setRunning(true);
    setOutput((prev) => [
      ...prev,
      `$ ${command}`,
    ]);

    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          cwd: selectedProject.path,
        }),
      });
      const data = await res.json();
      if (data.output) {
        setOutput((prev) => [...prev, data.output]);
      }
      if (data.error) {
        setOutput((prev) => [...prev, `Error: ${data.error}`]);
      }
    } catch (err: any) {
      setOutput((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setRunning(false);
      setCommand("");
    }
  }

  function clearOutput() {
    setOutput([]);
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Terminal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run commands in project directories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearOutput}
            className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-accent transition-colors"
            title="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOutput([])}
            className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-accent transition-colors"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <div className="flex gap-4 h-[calc(100%-4rem)]">
        {/* Project selector sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Projects
          </h3>
          <div className="space-y-1">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedProject?.id === p.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-muted-foreground"
                }`}
              >
                <FolderKanban className="h-4 w-4 shrink-0" />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Terminal */}
        <div className="flex-1 rounded-xl border border-border bg-black overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <TerminalIcon className="h-3.5 w-3.5" />
              {selectedProject ? (
                <span className="text-zinc-400">{selectedProject.path}</span>
              ) : (
                <span>Select a project</span>
              )}
            </div>
          </div>

          {/* Output */}
          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm"
          >
            {output.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                <TerminalIcon className="h-8 w-8 mb-2" />
                <p className="text-sm">Select a project and run a command</p>
              </div>
            ) : (
              output.map((line, i) => (
                <div
                  key={i}
                  className={`py-0.5 ${
                    line.startsWith("$")
                      ? "text-green-400"
                      : line.startsWith("Error")
                      ? "text-red-400"
                      : "text-zinc-300"
                  }`}
                >
                  {line}
                </div>
              ))
            )}
            {running && (
              <div className="flex items-center gap-2 text-zinc-500 mt-2">
                <span className="h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
                Running...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 p-3">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm font-mono">$</span>
              <input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runCommand();
                }}
                placeholder={selectedProject ? "Enter command..." : "Select a project first"}
                disabled={!selectedProject || running}
                className="flex-1 bg-transparent text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
              />
              <button
                onClick={runCommand}
                disabled={!selectedProject || running || !command.trim()}
                className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20 disabled:opacity-30 transition-colors"
              >
                <Play className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
