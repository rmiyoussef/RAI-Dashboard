import fs from "fs/promises";
import path from "path";
import os from "os";
import { prisma } from "./db";

const CLAUDE_SESSIONS_DIR = path.join(os.homedir(), ".claude", "sessions");
const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");

export async function syncProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Project not found" };

  const results = {
    sessions: 0,
    plans: 0,
    skills: 0,
    memoryFiles: 0,
  };

  // 1. Scan Claude Code session files
  // Directory names use "-" instead of "/", e.g. /var/www/foo → -var-www-foo
  const encodedDir = project.path.replace(/\//g, "-");
  const projectSessionDir = path.join(CLAUDE_PROJECTS_DIR, encodedDir);

  // Try reading the project's session directory in ~/.claude/projects/
  const sessionFiles = await readSessionFiles(projectSessionDir, project);
  results.sessions = sessionFiles;

  // Also scan ~/.claude/sessions/*.json for sessions in this project
  results.sessions += await scanGlobalSessions(project);

  // 2. Scan .brain/ memory files
  const brainDir = path.join(project.path, ".brain");
  results.memoryFiles = await scanBrainMemory(brainDir, project.id);

  // 3. Scan .brain/plans/ files
  results.plans = await scanPlans(brainDir, project.id);

  // 4. Scan .ai/skills/ files
  const aiDir = path.join(project.path, ".ai");
  results.skills = await scanSkills(aiDir, project.id);

  // Mark sessions as CLOSED if they're no longer running (no matching PID)
  const activeSessions = await prisma.session.findMany({
    where: { projectId: project.id, status: "ACTIVE" },
  });
  for (const s of activeSessions) {
    if (s.pid) {
      try {
        process.kill(s.pid, 0); // This checks if process exists
      } catch {
        // Process doesn't exist — mark as CLOSED
        await prisma.session.update({
          where: { id: s.id },
          data: { status: "CLOSED", lastActivityAt: new Date() },
        });
      }
    }
  }

  // Update last synced timestamp
  await prisma.project.update({
    where: { id: project.id },
    data: { lastSyncedAt: new Date() },
  });

  // Re-count for accurate results
  results.sessions = await prisma.session.count({ where: { projectId: project.id } });
  results.memoryFiles = await prisma.memoryFile.count({ where: { projectId: project.id } });
  results.plans = await prisma.plan.count({ where: { projectId: project.id } });
  results.skills = await prisma.skill.count({ where: { projectId: project.id } });

  return results;
}

async function readSessionFiles(
  dir: string,
  project: { id: string; name: string }
): Promise<number> {
  let count = 0;
  try {
    await fs.access(dir);
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.name.endsWith(".jsonl")) continue;

      const sessionId = entry.name.replace(".jsonl", "");
      const filePath = path.join(dir, entry.name);

      try {
        // Upsert session
        await prisma.session.upsert({
          where: { claudeSessionId: sessionId },
          update: { lastActivityAt: new Date() },
          create: {
            claudeSessionId: sessionId,
            projectId: project.id,
            status: "ACTIVE",
            startedAt: new Date(),
            lastActivityAt: new Date(),
          },
        });
        count++;

        // Read logs from the session file
        const content = await fs.readFile(filePath, "utf-8");
        const lines = content.trim().split("\n").filter(Boolean);

        if (lines.length > 0) {
          // Get session record
          const session = await prisma.session.findUnique({
            where: { claudeSessionId: sessionId },
          });
          if (session) {
            for (const line of lines.slice(-20)) {
              try {
                const parsed = JSON.parse(line);
                await prisma.sessionLog.create({
                  data: {
                    sessionId: session.id,
                    type: parsed.type || "info",
                    content: parsed.content || JSON.stringify(parsed),
                    timestamp: parsed.timestamp
                      ? new Date(parsed.timestamp)
                      : new Date(),
                  },
                }).catch(() => {});
              } catch {
                // raw text line
              }
            }
          }
        }
      } catch {}
    }
  } catch {}

  return count;
}

async function scanGlobalSessions(project: {
  id: string;
  path: string;
}): Promise<number> {
  let count = 0;
  try {
    await fs.access(CLAUDE_SESSIONS_DIR);
    const entries = await fs.readdir(CLAUDE_SESSIONS_DIR);

    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue;
      const filePath = path.join(CLAUDE_SESSIONS_DIR, entry);

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const meta = JSON.parse(content);

        if (meta.cwd && meta.cwd === project.path) {
          await prisma.session.upsert({
            where: { claudeSessionId: meta.sessionId },
            update: {
              status: meta.status === "idle" ? "IDLE" : "ACTIVE",
              pid: meta.pid,
              name: meta.name,
              lastActivityAt: meta.updatedAt
                ? new Date(meta.updatedAt)
                : new Date(),
            },
            create: {
              claudeSessionId: meta.sessionId,
              projectId: project.id,
              pid: meta.pid,
              status: "ACTIVE",
              name: meta.name,
              startedAt: meta.startedAt
                ? new Date(meta.startedAt)
                : new Date(),
              lastActivityAt: meta.updatedAt
                ? new Date(meta.updatedAt)
                : new Date(),
            },
          });
          count++;
        }
      } catch {}
    }
  } catch {}

  return count;
}

async function scanBrainMemory(
  brainDir: string,
  projectId: string
): Promise<number> {
  let count = 0;
  const catalog: Record<string, string> = {
    decisions: "DECISIONS",
    lessons: "LESSONS",
    sessions: "SESSIONS",
    architecture: "ARCHITECTURE",
    business: "BUSINESS",
    tasks: "TASKS",
    tests: "TESTS",
  };

  // Try both .brain/memory/ and .brain/ (different project layouts)
  const possibleRoots = [
    path.join(brainDir, "memory"),
    brainDir,
  ];

  for (const root of possibleRoots) {
    for (const [dirName, category] of Object.entries(catalog)) {
      const dirPath = path.join(root, dirName);
      try {
        await fs.access(dirPath);
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (!file.endsWith(".md")) continue;
          const content = await fs.readFile(path.join(dirPath, file), "utf-8");
          try {
            await prisma.memoryFile.upsert({
              where: {
                projectId_category_filename: {
                  projectId,
                  category: category as any,
                  filename: file,
                },
              },
              update: { content, updatedAt: new Date() },
              create: {
                projectId,
                category: category as any,
                filename: file,
                content,
              },
            });
            count++;
          } catch {}
        }
      } catch {}
    }
  }

  // Read guidelines.md at both possible locations
  for (const root of possibleRoots) {
    try {
      const content = await fs.readFile(path.join(root, "guidelines.md"), "utf-8");
      await prisma.memoryFile.upsert({
        where: {
          projectId_category_filename: {
            projectId,
            category: "GUIDELINES",
            filename: "guidelines.md",
          },
        },
        update: { content },
        create: {
          projectId,
          category: "GUIDELINES",
          filename: "guidelines.md",
          content,
        },
      });
      count++;
      break;
    } catch {}
  }

  // Read INDEX.md at brain root
  try {
    const content = await fs.readFile(path.join(brainDir, "INDEX.md"), "utf-8");
    await prisma.memoryFile.upsert({
      where: {
        projectId_category_filename: {
          projectId,
          category: "GUIDELINES",
          filename: "INDEX.md",
        },
      },
      update: { content },
      create: {
        projectId,
        category: "GUIDELINES",
        filename: "INDEX.md",
        content,
      },
    });
    count++;
  } catch {}

  return count;
}

async function scanPlans(
  brainDir: string,
  projectId: string
): Promise<number> {
  let count = 0;
  const plansDir = path.join(brainDir, "plans");
  try {
    await fs.access(plansDir);
    const files = await fs.readdir(plansDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await fs.readFile(path.join(plansDir, file), "utf-8");
      try {
        await prisma.plan.upsert({
          where: { projectId_filename: { projectId, filename: file } },
          update: { content, updatedAt: new Date() },
          create: { projectId, filename: file, content },
        });
        count++;
      } catch {}
    }
  } catch {}
  return count;
}

async function scanSkills(
  aiDir: string,
  projectId: string
): Promise<number> {
  let count = 0;
  // Scan .ai/skills/
  const skillsDir = path.join(aiDir, "skills");
  try {
    await fs.access(skillsDir);
    const files = await fs.readdir(skillsDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await fs.readFile(path.join(skillsDir, file), "utf-8");
      try {
        await prisma.skill.upsert({
          where: { projectId_filename: { projectId, filename: file } },
          update: { content, updatedAt: new Date() },
          create: { projectId, filename: file, content, category: "ai" },
        });
        count++;
      } catch {}
    }
  } catch {}

  // Also scan .brain/skills/
  const brainSkillsDir = path.join(aiDir.replace(".ai", ".brain"), "skills");
  try {
    await fs.access(brainSkillsDir);
    const files = await fs.readdir(brainSkillsDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await fs.readFile(path.join(brainSkillsDir, file), "utf-8");
      try {
        await prisma.skill.upsert({
          where: { projectId_filename: { projectId, filename: file } },
          update: { content, updatedAt: new Date() },
          create: { projectId, filename: file, content, category: "brain" },
        });
        count++;
      } catch {}
    }
  } catch {}

  return count;
}
