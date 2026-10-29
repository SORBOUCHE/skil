#!/usr/bin/env node
/**
 * context-memory-manager: Session Start Hook
 * Reads project context files from the workspace and injects them
 * into the agent's context at the start of every session.
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const CONTEXT_FILES = [
  'PROJECT_CONTEXT.md',
  'ARCHITECTURE.md',
  'ADR.md',
  '.agents/PROJECT_CONTEXT.md',
  'docs/ARCHITECTURE.md',
  'CONTEXT.md'
];

async function main() {
  let inputData = '';
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    inputData += line;
  }

  let payload = {};
  try {
    payload = JSON.parse(inputData);
  } catch (_) {}

  const workspacePaths = payload.workspacePaths || [];
  const foundFiles = [];

  for (const wsPath of workspacePaths) {
    for (const fileName of CONTEXT_FILES) {
      const fullPath = path.join(wsPath, fileName);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.trim().length > 0) {
            foundFiles.push({ path: fullPath, name: fileName, content });
          }
        } catch (_) {}
      }
    }
  }

  if (foundFiles.length === 0) {
    process.stdout.write(JSON.stringify({ injectSteps: [] }));
    return;
  }

  const sections = foundFiles.map(f =>
    `### 📄 ${f.name}\n\n${f.content.slice(0, 4000)}`
  ).join('\n\n---\n\n');

  const message = `[MEMORY LOADED] I have loaded your project context files at session start:\n\n${sections}\n\nI will use this context throughout our session.`;

  process.stdout.write(JSON.stringify({
    injectSteps: [
      { ephemeralMessage: message }
    ]
  }));
}

main().catch(err => {
  process.stdout.write(JSON.stringify({ injectSteps: [] }));
});
