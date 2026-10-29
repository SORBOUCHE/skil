#!/usr/bin/env node
/**
 * Speculative Subagent Swarm - Matrix Planner & Collision Guard
 * Analyzes planned subagent tasks and enforces path isolation to prevent merge conflicts.
 */
const fs = require('fs');
const path = require('path');

function planSwarm(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(manifestPath, 'utf8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    console.error(`Error: Invalid JSON manifest: ${err.message}`);
    process.exit(1);
  }

  const tasks = config.tasks || [];
  const assignedPaths = new Map();
  const collisions = [];

  for (const t of tasks) {
    const agentName = t.agent || t.role || 'unnamed-agent';
    const writePaths = t.writePaths || [];

    for (const p of writePaths) {
      const normalized = path.normalize(p).toLowerCase();
      if (assignedPaths.has(normalized)) {
        collisions.push({
          path: p,
          agent1: assignedPaths.get(normalized),
          agent2: agentName
        });
      } else {
        assignedPaths.set(normalized, agentName);
      }
    }
  }

  const isSafe = collisions.length === 0;

  const result = {
    totalTasks: tasks.length,
    parallelizable: isSafe,
    safeConcurrency: isSafe ? tasks.length : 1,
    collisions,
    dispatchPlan: tasks.map(t => ({
      agent: t.agent || t.role,
      role: t.role,
      workspace: t.workspace || 'branch',
      model: t.model || 'inherit',
      writePaths: t.writePaths,
      summary: t.prompt ? t.prompt.substring(0, 100) + '...' : ''
    }))
  };

  console.log(JSON.stringify(result, null, 2));
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Generate an example template if no file passed
    const example = {
      project: "Full-Stack Feature Epic",
      tasks: [
        {
          agent: "Backend Architect",
          role: "Backend API Specialist",
          workspace: "branch",
          writePaths: ["src/api/", "src/models/"],
          prompt: "Implement the /api/v1/billing routes and Prisma schema models."
        },
        {
          agent: "Frontend Engineer",
          role: "Frontend UI Specialist",
          workspace: "branch",
          writePaths: ["src/frontend/components/billing/", "src/frontend/pages/"],
          prompt: "Build billing dashboard UI components matching the OpenAPI 3.1 specification."
        },
        {
          agent: "QA & E2E Tester",
          role: "Automated Test Engineer",
          workspace: "branch",
          writePaths: ["tests/e2e/billing.spec.ts"],
          prompt: "Write Playwright journey tests covering checkout and invoice download."
        }
      ]
    };
    console.log(JSON.stringify(example, null, 2));
    return;
  }

  planSwarm(args[0]);
}

main();
