#!/usr/bin/env node
/**
 * task-orchestrator: PreInvocation Hook
 * Reminds the agent about pending tasks in TASKS.md
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

async function main() {
  let inputData = '';
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) { inputData += line; }

  let payload = {};
  try { payload = JSON.parse(inputData); } catch (_) {}

  const workspacePaths = payload.workspacePaths || [];
  let tasksContent = null;
  let tasksFilePath = null;

  for (const wsPath of workspacePaths) {
    const candidates = [
      path.join(wsPath, 'TASKS.md'),
      path.join(wsPath, 'TODO.md'),
      path.join(wsPath, '.agents', 'TASKS.md')
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        tasksContent = fs.readFileSync(candidate, 'utf-8');
        tasksFilePath = candidate;
        break;
      }
    }
    if (tasksContent) break;
  }

  if (!tasksContent) {
    process.stdout.write(JSON.stringify({ injectSteps: [] }));
    return;
  }

  const pendingTasks = (tasksContent.match(/- \[ \]/g) || []).length;
  const doneTasks = (tasksContent.match(/- \[x\]/gi) || []).length;

  if (pendingTasks === 0) {
    process.stdout.write(JSON.stringify({ injectSteps: [] }));
    return;
  }

  const message = `[TASK TRACKER] Active task list detected at ${tasksFilePath}: ${doneTasks} completed, ${pendingTasks} pending. Work through tasks systematically, marking each \`- [ ]\` as \`- [x]\` when done. Ask the user which task to tackle next if unclear.`;

  process.stdout.write(JSON.stringify({
    injectSteps: [{ ephemeralMessage: message }]
  }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ injectSteps: [] }));
});
