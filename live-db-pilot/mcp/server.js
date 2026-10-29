#!/usr/bin/env node
/**
 * Live DB Pilot - Model Context Protocol (MCP) Server
 * 
 * Embedded zero-dependency database inspection & query execution engine.
 * Powered by Node.js 22 native `node:sqlite` DatabaseSync.
 * 
 * Protocol: JSON-RPC 2.0 over stdio
 */

const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SERVER_NAME = 'live-db-pilot';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

function resolveDb(dbPath) {
  if (dbPath === ':memory:') return ':memory:';
  const resolved = path.resolve(dbPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Database file not found: "${resolved}"`);
  }
  return resolved;
}

const TOOLS = [
  {
    name: 'sqlite_inspect_tables',
    description: 'Inspect all tables, columns, data types, primary keys, and indexes in a local SQLite database file.',
    inputSchema: {
      type: 'object',
      properties: {
        db_path: {
          type: 'string',
          description: 'Absolute or relative path to the SQLite .db/.sqlite file (or ":memory:")'
        }
      },
      required: ['db_path']
    }
  },
  {
    name: 'sqlite_execute_query',
    description: 'Execute a SQL query against a local SQLite database. Default mode is read-only (SELECT queries only). Set read_only to false to run mutations.',
    inputSchema: {
      type: 'object',
      properties: {
        db_path: {
          type: 'string',
          description: 'Path to SQLite database file'
        },
        query: {
          type: 'string',
          description: 'SQL statement to execute (e.g. "SELECT * FROM users LIMIT 10")'
        },
        read_only: {
          type: 'boolean',
          default: true,
          description: 'Prevent data modifications (defaults to true for safety)'
        }
      },
      required: ['db_path', 'query']
    }
  },
  {
    name: 'sqlite_explain_query',
    description: 'Run EXPLAIN QUERY PLAN on a query to analyze execution performance, detect full table scans, and evaluate index usage.',
    inputSchema: {
      type: 'object',
      properties: {
        db_path: {
          type: 'string',
          description: 'Path to SQLite database file'
        },
        query: {
          type: 'string',
          description: 'SQL query to explain'
        }
      },
      required: ['db_path', 'query']
    }
  },
  {
    name: 'sql_generate_indexes',
    description: 'Generates optimal index creation DDL statements based on filtering columns, sorting criteria, and table schema.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table'
        },
        filter_columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns used in WHERE equality and range filters'
        },
        sort_columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns used in ORDER BY clauses'
        }
      },
      required: ['table_name', 'filter_columns']
    }
  }
];

const toolHandlers = {
  async sqlite_inspect_tables({ db_path }) {
    const resolved = resolveDb(db_path);
    const db = new DatabaseSync(resolved);
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      const results = [];

      for (const t of tables) {
        const tableName = t.name;
        const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
        const indexes = db.prepare(`PRAGMA index_list("${tableName}")`).all();
        let rowCount = 0;
        try {
          const countRow = db.prepare(`SELECT COUNT(*) as c FROM "${tableName}"`).get();
          rowCount = countRow ? countRow.c : 0;
        } catch (_) {}

        results.push({
          table: tableName,
          estimated_rows: rowCount,
          columns: columns.map(c => ({
            name: c.name,
            type: c.type,
            nullable: c.notnull === 0,
            primary_key: c.pk === 1,
            default_value: c.dflt_value
          })),
          indexes: indexes.map(i => ({
            name: i.name,
            unique: i.unique === 1
          }))
        });
      }

      return {
        database: resolved,
        table_count: results.length,
        tables: results
      };
    } finally {
      db.close();
    }
  },

  async sqlite_execute_query({ db_path, query, read_only = true }) {
    const trimmed = query.trim().toUpperCase();
    if (read_only) {
      const destructiveKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'REPLACE'];
      for (const kw of destructiveKeywords) {
        if (trimmed.startsWith(kw)) {
          throw new Error(`Execution blocked: Query starts with ${kw} but read_only mode is enabled. Set read_only: false to execute mutations.`);
        }
      }
    }

    const resolved = resolveDb(db_path);
    const db = new DatabaseSync(resolved);
    const startTime = process.hrtime.bigint();
    try {
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN')) {
        const stmt = db.prepare(query);
        const rows = stmt.all();
        const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
        return {
          query,
          row_count: rows.length,
          duration_ms: Number(durationMs.toFixed(2)),
          rows: rows.slice(0, 100)
        };
      } else {
        db.exec(query);
        const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
        return {
          query,
          success: true,
          duration_ms: Number(durationMs.toFixed(2)),
          message: 'Statement executed successfully.'
        };
      }
    } finally {
      db.close();
    }
  },

  async sqlite_explain_query({ db_path, query }) {
    const resolved = resolveDb(db_path);
    const db = new DatabaseSync(resolved);
    try {
      const plan = db.prepare(`EXPLAIN QUERY PLAN ${query}`).all();
      const hasFullScan = plan.some(p => (p.detail || '').includes('SCAN TABLE'));
      const usedIndexes = plan.filter(p => (p.detail || '').includes('USING INDEX')).map(p => p.detail);

      return {
        query,
        query_plan: plan,
        analysis: {
          has_full_table_scan: hasFullScan,
          warning: hasFullScan ? '⚠️ Query performs a FULL TABLE SCAN! Adding an index is recommended.' : '✅ Query utilizes indexes effectively.',
          index_details: usedIndexes
        }
      };
    } finally {
      db.close();
    }
  },

  async sql_generate_indexes({ table_name, filter_columns, sort_columns = [] }) {
    const allCols = [...filter_columns, ...sort_columns.filter(c => !filter_columns.includes(c))];
    const indexName = `idx_${table_name}_${allCols.join('_')}`.toLowerCase();
    const ddl = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table_name} (${allCols.join(', ')});`;

    return {
      table: table_name,
      suggested_index_name: indexName,
      ddl,
      rationale: `Places equality/filtering columns (${filter_columns.join(', ')}) first, followed by sorting columns (${sort_columns.join(', ') || 'none'}) for maximum B-Tree lookup performance.`
    };
  }
};

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

async function handleMessage(message) {
  const { id, method, params } = message;

  if (id === undefined || id === null) {
    if (method === 'notifications/initialized') {
      console.error(`[${SERVER_NAME}] Initialized.`);
    }
    return;
  }

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
            result: {
              content: [{ type: 'text', text: `Error: ${execErr.message}` }],
              isError: true
            }
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
  console.error(`[${SERVER_NAME}] Starting Native Database MCP Server v${SERVER_VERSION}...`);
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
