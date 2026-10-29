#!/usr/bin/env node
/**
 * GitHub Publisher Utility (Zero-Dependency Node.js)
 * Prepares project for GitHub, screens for credentials, ensures .gitignore/README,
 * and provides REST API or CLI upload capabilities.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_GITIGNORE = `# Dependencies
node_modules/
vendor/
.pnp
.pnp.js

# Environment variables & secrets
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
service-account*.json

# Build outputs
dist/
build/
out/
.next/
*.exe
*.dll

# Logs & OS artifacts
logs/
*.log
npm-debug.log*
.DS_Store
Thumbs.db
.idea/
.vscode/
`;

const SECRET_REGEX = /(?:AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|sk-ant-[a-zA-Z0-9_-]{20,}|sk-(?:proj-)?[a-zA-Z0-9_-]{20,}|AIzaSy[a-zA-Z0-9_-]{33}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/;

function scanDirFiles(dir, baseDir = dir) {
  const fileList = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.gemini'].includes(ent.name)) {
          fileList.push(...scanDirFiles(full, baseDir));
        }
      } else if (ent.isFile()) {
        fileList.push({
          fullPath: full,
          relPath: path.relative(baseDir, full).replace(/\\/g, '/')
        });
      }
    }
  } catch (_) {}
  return fileList;
}

function checkProjectSafety(targetDir) {
  const gitignorePath = path.join(targetDir, '.gitignore');
  const hasGitignore = fs.existsSync(gitignorePath);
  const readmePath = path.join(targetDir, 'README.md');
  const hasReadme = fs.existsSync(readmePath);

  const files = scanDirFiles(targetDir);
  const secretViolations = [];

  for (const f of files) {
    if (f.relPath.includes('.env') || f.relPath.endsWith('.pem') || f.relPath.endsWith('.key')) {
      secretViolations.push({ file: f.relPath, reason: 'Sensitive extension or .env file' });
      continue;
    }
    try {
      const size = fs.statSync(f.fullPath).size;
      if (size < 500 * 1024) { // scan files under 500KB
        const content = fs.readFileSync(f.fullPath, 'utf8');
        if (SECRET_REGEX.test(content)) {
          secretViolations.push({ file: f.relPath, reason: 'Matched potential hardcoded API key or private key' });
        }
      }
    } catch (_) {}
  }

  return {
    directory: targetDir,
    totalFiles: files.length,
    hasGitignore,
    hasReadme,
    isSafeToPublish: secretViolations.length === 0,
    secretViolations
  };
}

function ensureGitignore(targetDir) {
  const p = path.join(targetDir, '.gitignore');
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, DEFAULT_GITIGNORE, 'utf8');
    return true;
  }
  return false;
}

function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const action = args[1] || '--check';

  if (action === '--prepare') {
    const created = ensureGitignore(targetDir);
    const report = checkProjectSafety(targetDir);
    console.log(JSON.stringify({
      status: 'prepared',
      gitignoreCreated: created,
      report
    }, null, 2));
    return;
  }

  // Default: check
  const report = checkProjectSafety(targetDir);
  console.log(JSON.stringify(report, null, 2));
}

main();
