#!/usr/bin/env node
/**
 * Deep Code Indexer - Model Context Protocol (MCP) Server
 * 
 * High-performance symbol graph and AST codebase memory engine.
 * Powered by Node.js 22 native `node:sqlite` DatabaseSync.
 * 
 * Provides instant sub-millisecond symbol lookups, outline extractions,
 * and dependency impact analysis across massive codebases without prompt saturation.
 */

const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { DatabaseSync } = require('node:sqlite');

const SERVER_NAME = 'deep-code-indexer';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// Database storage file in user home directory
const DB_DIR = path.join(os.homedir(), '.gemini', 'cache');
if (!fs.existsSync(DB_DIR)) {
  try { fs.mkdirSync(DB_DIR, { recursive: true }); } catch (_) {}
}
const DB_FILE = path.join(DB_DIR, 'symbol_graph.sqlite');

// Initialize database schema
const db = new DatabaseSync(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL, -- 'function', 'class', 'interface', 'type', 'variable'
    line_number INTEGER NOT NULL,
    signature TEXT,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sym_name ON symbols (name);
  CREATE INDEX IF NOT EXISTS idx_sym_file ON symbols (file_path);

  CREATE TABLE IF NOT EXISTS file_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file TEXT NOT NULL,
    imported_target TEXT NOT NULL,
    symbol_name TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_dep_target ON file_dependencies (imported_target);
  CREATE INDEX IF NOT EXISTS idx_dep_symbol ON file_dependencies (symbol_name);
`);

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out',
  '.dart_tool', 'venv', '.venv', '__pycache__', '.gemini',
  'coverage', 'vendor', '.idea', '.vscode', 'tmp'
]);

const SUPPORTED_EXTS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.py', '.dart', '.go', '.rs', '.java', '.cs',
  '.cpp', '.h', '.hpp', '.c', '.sql', '.vue', '.svelte'
]);

function extractSymbolsFromContent(content, filePath, relPath) {
  const symbols = [];
  const dependencies = [];
  const lines = content.split('\n');

  // Regex extractors for major languages
  const patterns = [
    // TypeScript / JavaScript / Dart classes
    { regex: /^\s*(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_]+)/, kind: 'class' },
    // TypeScript interfaces
    { regex: /^\s*(?:export\s+)?interface\s+([A-Za-z0-9_]+)/, kind: 'interface' },
    // TypeScript type aliases
    { regex: /^\s*(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=/, kind: 'type' },
    // Functions (JS/TS/Dart/Go)
    { regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/, kind: 'function' },
    // Const arrow functions
    { regex: /^\s*(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?=>/, kind: 'function' },
    // Python def & class
    { regex: /^\s*def\s+([A-Za-z0-9_]+)\s*\(/, kind: 'function' },
    { regex: /^\s*class\s+([A-Za-z0-9_]+)(?:\([^)]*\))?:/, kind: 'class' },
    // Go func
    { regex: /^\s*func\s+(?:\([^)]*\)\s+)?([A-Za-z0-9_]+)\s*\(/, kind: 'function' },
    // Rust fn & struct & enum
    { regex: /^\s*(?:pub\s+)?fn\s+([A-Za-z0-9_]+)\s*\(/, kind: 'function' },
    { regex: /^\s*(?:pub\s+)?struct\s+([A-Za-z0-9_]+)/, kind: 'class' },
    { regex: /^\s*(?:pub\s+)?enum\s+([A-Za-z0-9_]+)/, kind: 'type' }
  ];

  // Import detectors
  const importRegexes = [
    /import\s+.*\s+from\s+['"]([^'"]+)['"]/,
    /from\s+([A-Za-z0-9_.]+)\s+import\s+([A-Za-z0-9_,\s]+)/,
    /require\(['"]([^'"]+)['"]\)/
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (const p of patterns) {
      const match = line.match(p.regex);
      if (match && match[1]) {
        symbols.push({
          file_path: filePath,
          relative_path: relPath,
          name: match[1],
          kind: p.kind,
          line_number: lineNum,
          signature: line.trim().slice(0, 140)
        });
        break;
      }
    }

    for (const impRegex of importRegexes) {
      const impMatch = line.match(impRegex);
      if (impMatch && impMatch[1]) {
        dependencies.push({
          source_file: relPath,
          imported_target: impMatch[1],
          symbol_name: impMatch[2] ? impMatch[2].trim() : null
        });
      }
    }
  }

  return { symbols, dependencies };
}

function scanDirRecursive(dir, baseDir, fileList = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirRecursive(fullPath, baseDir, fileList);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTS.has(ext)) {
          fileList.push({
            fullPath,
            relPath: path.relative(baseDir, fullPath).replace(/\\/g, '/')
          });
        }
      }
    }
  } catch (_) {}
  return fileList;
}

const TOOLS = [
  {
    name: 'index_workspace',
    description: 'Scans and indexes all source code files in a workspace directory into the embedded symbol graph (classes, functions, interfaces, types, and dependencies).',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_path: {
          type: 'string',
          description: 'Absolute or relative path to the workspace root to index'
        }
      },
      required: ['workspace_path']
    }
  },
  {
    name: 'lookup_symbol',
    description: 'Fast sub-millisecond lookup for any class, function, interface, or type by name across the indexed codebase. Returns exact file locations, line numbers, and signatures.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the function, class, or symbol to locate (e.g. "authMiddleware", "UserDTO", "calculateTax")'
        },
        kind: {
          type: 'string',
          enum: ['function', 'class', 'interface', 'type', 'any'],
          default: 'any',
          description: 'Filter by symbol kind (optional)'
        },
        limit: {
          type: 'integer',
          default: 10,
          description: 'Maximum number of matches to return'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'get_file_outline',
    description: 'Returns the structural outline (all classes, functions, interfaces, methods with line numbers) of a file without polluting context with full file contents.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Relative or absolute path of the file to inspect'
        }
      },
      required: ['file_path']
    }
  },
  {
    name: 'analyze_symbol_impact',
    description: 'Performs pre-refactoring impact analysis. Lists all files and imports that depend on or reference a given symbol name.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol_name: {
          type: 'string',
          description: 'Name of the symbol being modified or refactored'
        }
      },
      required: ['symbol_name']
    }
  }
];

const toolHandlers = {
  async index_workspace({ workspace_path }) {
    const root = path.resolve(workspace_path);
    if (!fs.existsSync(root)) {
      throw new Error(`Workspace path does not exist: "${root}"`);
    }

    const startTime = process.hrtime.bigint();
    const files = scanDirRecursive(root, root);
    const now = Date.now();

    const insertSymbol = db.prepare(`
      INSERT INTO symbols (file_path, relative_path, name, kind, line_number, signature, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertDep = db.prepare(`
      INSERT INTO file_dependencies (source_file, imported_target, symbol_name)
      VALUES (?, ?, ?)
    `);

    // Clean previous entries for files in this workspace
    db.prepare("DELETE FROM symbols WHERE file_path LIKE ?").run(`${root}%`);
    db.prepare("DELETE FROM file_dependencies WHERE source_file IN (SELECT relative_path FROM symbols WHERE file_path LIKE ?)").run(`${root}%`);

    let symbolCount = 0;
    let depCount = 0;

    for (const f of files) {
      try {
        const content = fs.readFileSync(f.fullPath, 'utf8');
        const { symbols, dependencies } = extractSymbolsFromContent(content, f.fullPath, f.relPath);

        for (const s of symbols) {
          insertSymbol.run(s.file_path, s.relative_path, s.name, s.kind, s.line_number, s.signature, now);
          symbolCount++;
        }
        for (const d of dependencies) {
          insertDep.run(d.source_file, d.imported_target, d.symbol_name);
          depCount++;
        }
      } catch (_) {}
    }

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;

    return {
      workspace: root,
      files_scanned: files.length,
      symbols_indexed: symbolCount,
      dependencies_mapped: depCount,
      duration_ms: Number(durationMs.toFixed(2)),
      message: `Successfully indexed ${symbolCount} symbols across ${files.length} files in ${durationMs.toFixed(1)}ms.`
    };
  },

  async lookup_symbol({ name, kind = 'any', limit = 10 }) {
    let query = "SELECT relative_path, name, kind, line_number, signature FROM symbols WHERE name LIKE ? ";
    const params = [`%${name}%`];

    if (kind !== 'any') {
      query += "AND kind = ? ";
      params.push(kind);
    }
    query += "ORDER BY (name = ?) DESC, name ASC LIMIT ?";
    params.push(name, limit);

    const rows = db.prepare(query).all(...params);
    return {
      searched_term: name,
      matches_found: rows.length,
      symbols: rows
    };
  },

  async get_file_outline({ file_path }) {
    const clean = file_path.replace(/\\/g, '/');
    const rows = db.prepare(`
      SELECT name, kind, line_number, signature 
      FROM symbols 
      WHERE relative_path LIKE ? OR file_path LIKE ? 
      ORDER BY line_number ASC
    `).all(`%${clean}%`, `%${clean}%`);

    return {
      file: file_path,
      symbol_count: rows.length,
      outline: rows
    };
  },

  async analyze_symbol_impact({ symbol_name }) {
    // 1. Definition locations
    const definitions = db.prepare(`
      SELECT relative_path, kind, line_number, signature 
      FROM symbols 
      WHERE name = ?
    `).all(symbol_name);

    // 2. Usages / imports
    const references = db.prepare(`
      SELECT DISTINCT source_file, imported_target 
      FROM file_dependencies 
      WHERE symbol_name LIKE ? OR imported_target LIKE ?
    `).all(`%${symbol_name}%`, `%${symbol_name}%`);

    return {
      symbol: symbol_name,
      definitions_count: definitions.length,
      definitions,
      impacted_files_count: references.length,
      impacted_files: references,
      recommendation: references.length > 0 
        ? `⚠️ Modifying "${symbol_name}" impacts ${references.length} dependent files. Ensure caller contracts and types remain compatible.`
        : `✅ No direct imports found for "${symbol_name}". Safe to modify locally.`
    };
  }
};

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

async function handleMessage(message) {
  const { id, method, params } = message;

  if (id === undefined || id === null) return;

  try {
    switch (method) {
      case 'initialize':
        return send({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
          }
        });

      case 'ping':
        return send({ jsonrpc: '2.0', id, result: {} });

      case 'tools/list':
        return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });

      case 'tools/call': {
        const { name, arguments: toolArgs = {} } = params || {};
        const handler = toolHandlers[name];
        if (!handler) {
          return send({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: `Tool not found: "${name}"` }], isError: true }
          });
        }

        try {
          const resultData = await handler(toolArgs);
          return send({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
              isError: false
            }
          });
        } catch (execErr) {
          return send({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: `Error: ${execErr.message}` }], isError: true }
          });
        }
      }

      default:
        return send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (err) {
    return send({ jsonrpc: '2.0', id, error: { code: -32603, message: err.message } });
  }
}

function start() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  console.error(`[${SERVER_NAME}] Starting Symbol Graph Indexer MCP Server v${SERVER_VERSION}...`);
  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try { handleMessage(JSON.parse(trimmed)); } catch (e) {
      console.error(`[${SERVER_NAME}] Parse error: ${e.message}`);
    }
  });
  rl.on('close', () => process.exit(0));
}

start();
