#!/usr/bin/env node
/**
 * GitHub Scout - Model Context Protocol (MCP) Server
 * 
 * Provides tools to search, explore, read, and analyze GitHub repositories
 * and open-source software directly within Antigravity.
 * 
 * Protocol: JSON-RPC 2.0 over stdio
 * Dependencies: Pure Node.js (v18+) standard library with zero external npm dependencies.
 */

const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const SERVER_NAME = 'github-scout';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// Optional GitHub token from environment
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

/**
 * Helper to execute GitHub REST API calls
 */
async function callGitHub(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = {
    'User-Agent': 'Antigravity-GitHub-Scout/1.0.0',
    'Accept': options.raw ? 'application/vnd.github.raw+json' : 'application/vnd.github.v3+json',
    ...(options.headers || {})
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    redirect: 'follow',
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const rateRemaining = response.headers.get('x-ratelimit-remaining');
  if (rateRemaining !== null && parseInt(rateRemaining, 10) < 5) {
    console.error(`[GitHub Scout Warning] GitHub API rate limit almost depleted: ${rateRemaining} requests remaining.`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson = null;
    try {
      errorJson = JSON.parse(errorText);
    } catch (_) {}

    const message = (errorJson && errorJson.message) ? errorJson.message : errorText;
    
    if (response.status === 403 && message.includes('API rate limit exceeded')) {
      throw new Error(`GitHub API rate limit exceeded. Set GITHUB_TOKEN in your environment or plugin configuration for higher limits (5,000 req/hr). Details: ${message}`);
    }
    if (response.status === 404) {
      throw new Error(`Resource not found on GitHub: ${endpoint}`);
    }
    throw new Error(`GitHub API error (${response.status}): ${message}`);
  }

  if (options.raw) {
    return await response.text();
  }
  if (options.buffer) {
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  return await response.json();
}

/**
 * Definitions of all tools provided by GitHub Scout
 */
const TOOLS = [
  {
    name: 'search_repositories',
    description: 'Search for GitHub repositories using keywords, topics, language, and star count filters. Perfect for finding open-source projects, reference implementations, and templates.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g. "auth middleware language:typescript", "rag agent stars:>500", "topic:react-components")'
        },
        sort: {
          type: 'string',
          enum: ['stars', 'forks', 'updated', 'help-wanted-issues'],
          description: 'Sort field. If omitted, results are sorted by best match.'
        },
        order: {
          type: 'string',
          enum: ['desc', 'asc'],
          default: 'desc',
          description: 'Sort order (default: desc).'
        },
        per_page: {
          type: 'integer',
          default: 10,
          description: 'Number of results to return (max 30, default 10).'
        },
        page: {
          type: 'integer',
          default: 1,
          description: 'Page number for pagination.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_repository',
    description: 'Get detailed metadata about a GitHub repository, including description, star count, license, topics, open issues count, default branch, and creation/update dates.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Owner or organization of the repository (e.g. "facebook")'
        },
        repo: {
          type: 'string',
          description: 'Name of the repository (e.g. "react")'
        }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'get_readme',
    description: 'Fetch the raw markdown text of a repository README file to understand its purpose, architecture, features, and setup instructions.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          description: 'Repository name'
        },
        branch: {
          type: 'string',
          description: 'Specific branch or commit ref (optional, defaults to default branch)'
        }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'get_file_contents',
    description: 'Read the contents of a specific file from any GitHub repository without cloning it locally.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          description: 'Repository name'
        },
        path: {
          type: 'string',
          description: 'Path to the file in the repository (e.g. "src/index.ts", "package.json", "docs/architecture.md")'
        },
        branch: {
          type: 'string',
          description: 'Branch or commit ref (optional, defaults to default branch)'
        }
      },
      required: ['owner', 'repo', 'path']
    }
  },
  {
    name: 'list_directory',
    description: 'List files and directories in a repository directory to explore project structure and browse files.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          description: 'Repository name'
        },
        path: {
          type: 'string',
          default: '',
          description: 'Directory path (optional, leave empty for repository root)'
        },
        branch: {
          type: 'string',
          description: 'Branch or commit ref (optional)'
        }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'search_code',
    description: 'Search for specific code patterns, function declarations, imports, or filenames across GitHub repositories.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Code search query (e.g. "function useDebounce language:typescript", "filename:docker-compose.yml postgres", "createAsyncThunk repo:reduxjs/redux-toolkit")'
        },
        per_page: {
          type: 'integer',
          default: 10,
          description: 'Number of results to return (max 30, default 10).'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_issues',
    description: 'Search issues and pull requests to find known bugs, requested features, architectural discussions, or fixes in open-source projects.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Issue search query (e.g. "repo:facebook/react is:issue is:open label:bug memory", "is:pr is:merged feat:auth")'
        },
        per_page: {
          type: 'integer',
          default: 10,
          description: 'Number of results to return (max 30, default 10).'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_latest_release',
    description: 'Get the latest release of a repository, including version tag, release notes, changelog, and published assets.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          description: 'Repository name'
        }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'download_repository',
    description: 'Download an open-source GitHub repository as a ZIP archive and extract it directly into a local workspace directory for inspection or improvement.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          description: 'Repository name'
        },
        destination_path: {
          type: 'string',
          description: 'Absolute or relative local directory path where files should be extracted'
        },
        branch: {
          type: 'string',
          description: 'Branch or commit ref (optional, defaults to default branch)'
        }
      },
      required: ['owner', 'repo', 'destination_path']
    }
  }
];

/**
 * Tool execution handlers
 */
const toolHandlers = {
  async search_repositories({ query, sort, order = 'desc', per_page = 10, page = 1 }) {
    const params = new URLSearchParams({
      q: query,
      per_page: String(Math.min(per_page, 30)),
      page: String(page)
    });
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);

    const data = await callGitHub(`/search/repositories?${params.toString()}`);
    const items = (data.items || []).map(r => ({
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      topics: r.topics || [],
      license: r.license ? (r.license.spdx_id || r.license.name) : 'None',
      open_issues: r.open_issues_count,
      updated_at: r.updated_at,
      html_url: r.html_url
    }));

    return {
      total_count: data.total_count,
      count_in_page: items.length,
      repositories: items
    };
  },

  async get_repository({ owner, repo }) {
    const r = await callGitHub(`/repos/${owner}/${repo}`);
    return {
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      topics: r.topics || [],
      license: r.license ? (r.license.spdx_id || r.license.name) : 'None',
      default_branch: r.default_branch,
      open_issues: r.open_issues_count,
      archived: r.archived,
      homepage: r.homepage,
      created_at: r.created_at,
      updated_at: r.updated_at,
      pushed_at: r.pushed_at,
      html_url: r.html_url
    };
  },

  async get_readme({ owner, repo, branch }) {
    const endpoint = `/repos/${owner}/${repo}/readme${branch ? `?ref=${encodeURIComponent(branch)}` : ''}`;
    const rawContent = await callGitHub(endpoint, { raw: true });
    return {
      repository: `${owner}/${repo}`,
      branch: branch || 'default',
      content: rawContent
    };
  },

  async get_file_contents({ owner, repo, path: filePath, branch }) {
    const endpoint = `/repos/${owner}/${repo}/contents/${filePath}${branch ? `?ref=${encodeURIComponent(branch)}` : ''}`;
    try {
      const rawContent = await callGitHub(endpoint, { raw: true });
      return {
        repository: `${owner}/${repo}`,
        path: filePath,
        branch: branch || 'default',
        content: rawContent
      };
    } catch (err) {
      // Fallback: try standard JSON and decode base64
      const json = await callGitHub(endpoint);
      if (json && json.content && json.encoding === 'base64') {
        const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
        return {
          repository: `${owner}/${repo}`,
          path: filePath,
          branch: branch || 'default',
          content: decoded
        };
      }
      throw err;
    }
  },

  async list_directory({ owner, repo, path: dirPath = '', branch }) {
    const cleanPath = dirPath.replace(/^\/+/, '');
    const endpoint = `/repos/${owner}/${repo}/contents/${cleanPath}${branch ? `?ref=${encodeURIComponent(branch)}` : ''}`;
    const data = await callGitHub(endpoint);
    
    if (!Array.isArray(data)) {
      throw new Error(`Path "${dirPath}" is a file, not a directory. Use get_file_contents instead.`);
    }

    const entries = data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type, // 'file' or 'dir'
      size: item.size,
      download_url: item.download_url
    }));

    return {
      repository: `${owner}/${repo}`,
      directory: cleanPath || '/',
      count: entries.length,
      entries
    };
  },

  async search_code({ query, per_page = 10 }) {
    const params = new URLSearchParams({
      q: query,
      per_page: String(Math.min(per_page, 30))
    });

    const data = await callGitHub(`/search/code?${params.toString()}`);
    const items = (data.items || []).map(item => ({
      name: item.name,
      path: item.path,
      repository: item.repository ? item.repository.full_name : null,
      html_url: item.html_url
    }));

    return {
      total_count: data.total_count,
      results: items
    };
  },

  async search_issues({ query, per_page = 10 }) {
    const params = new URLSearchParams({
      q: query,
      per_page: String(Math.min(per_page, 30))
    });

    const data = await callGitHub(`/search/issues?${params.toString()}`);
    const items = (data.items || []).map(issue => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      is_pull_request: Boolean(issue.pull_request),
      author: issue.user ? issue.user.login : null,
      comments: issue.comments,
      labels: (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name)),
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      html_url: issue.html_url,
      body_preview: issue.body ? issue.body.slice(0, 300) : ''
    }));

    return {
      total_count: data.total_count,
      issues: items
    };
  },

  async get_latest_release({ owner, repo }) {
    const rel = await callGitHub(`/repos/${owner}/${repo}/releases/latest`);
    return {
      repository: `${owner}/${repo}`,
      tag_name: rel.tag_name,
      name: rel.name,
      published_at: rel.published_at,
      html_url: rel.html_url,
      body: rel.body,
      assets: (rel.assets || []).map(a => ({
        name: a.name,
        size: a.size,
        download_count: a.download_count,
        download_url: a.browser_download_url
      }))
    };
  },

  async download_repository({ owner, repo, destination_path, branch }) {
    const resolvedDest = path.resolve(destination_path);
    if (!fs.existsSync(resolvedDest)) {
      fs.mkdirSync(resolvedDest, { recursive: true });
    }

    const ref = branch || 'HEAD';
    const endpoint = `/repos/${owner}/${repo}/zipball/${ref}`;
    const zipBuffer = await callGitHub(endpoint, { buffer: true });

    const tempZipPath = path.join(resolvedDest, `_temp_${Date.now()}.zip`);
    fs.writeFileSync(tempZipPath, zipBuffer);

    return new Promise((resolve, reject) => {
      // Use built-in tar or PowerShell Expand-Archive
      execFile('tar', ['-xf', tempZipPath, '-C', resolvedDest, '--strip-components=1'], (tarErr) => {
        if (!tarErr) {
          try { fs.unlinkSync(tempZipPath); } catch (_) {}
          resolve({
            success: true,
            repository: `${owner}/${repo}`,
            ref,
            destination_path: resolvedDest,
            message: `Repository ${owner}/${repo} successfully downloaded and extracted to ${resolvedDest}`
          });
          return;
        }

        // Fallback to PowerShell Expand-Archive if tar fails
        const psCommand = `Expand-Archive -Path '${tempZipPath}' -DestinationPath '${resolvedDest}' -Force`;
        execFile('powershell', ['-NoProfile', '-Command', psCommand], (psErr) => {
          try { fs.unlinkSync(tempZipPath); } catch (_) {}
          if (psErr) {
            return reject(new Error(`Extraction failed: ${tarErr.message || psErr.message}`));
          }
          resolve({
            success: true,
            repository: `${owner}/${repo}`,
            ref,
            destination_path: resolvedDest,
            message: `Repository ${owner}/${repo} successfully downloaded and extracted to ${resolvedDest}`
          });
        });
      });
    });
  }
};

/**
 * Send JSON-RPC response to stdout
 */
function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

/**
 * Handle incoming JSON-RPC messages
 */
async function handleMessage(message) {
  const { id, method, params } = message;

  // Handle Notifications (no response needed)
  if (id === undefined || id === null) {
    if (method === 'notifications/initialized') {
      console.error(`[${SERVER_NAME}] Client initialized notification received.`);
    }
    return;
  }

  // Handle Requests
  try {
    switch (method) {
      case 'initialize':
        return send({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: SERVER_NAME,
              version: SERVER_VERSION
            }
          }
        });

      case 'ping':
        return send({
          jsonrpc: '2.0',
          id,
          result: {}
        });

      case 'tools/list':
        return send({
          jsonrpc: '2.0',
          id,
          result: {
            tools: TOOLS
          }
        });

      case 'tools/call': {
        const { name, arguments: toolArgs = {} } = params || {};
        const handler = toolHandlers[name];
        if (!handler) {
          return send({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Tool not found: "${name}"`
                }
              ],
              isError: true
            }
          });
        }

        try {
          const resultData = await handler(toolArgs);
          return send({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof resultData === 'string' ? resultData : JSON.stringify(resultData, null, 2)
                }
              ],
              isError: false
            }
          });
        } catch (execErr) {
          return send({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Error executing ${name}: ${execErr.message}`
                }
              ],
              isError: true
            }
          });
        }
      }

      default:
        return send({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        });
    }
  } catch (err) {
    return send({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: err.message || 'Internal error'
      }
    });
  }
}

/**
 * Start Stdio interface
 */
function start() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  console.error(`[${SERVER_NAME}] Starting MCP Server v${SERVER_VERSION} (Node.js ${process.version})...`);
  if (GITHUB_TOKEN) {
    console.error(`[${SERVER_NAME}] GITHUB_TOKEN detected - authenticated mode enabled.`);
  } else {
    console.error(`[${SERVER_NAME}] No GITHUB_TOKEN found - running in anonymous mode (60 requests/hr).`);
  }

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const msg = JSON.parse(trimmed);
      handleMessage(msg);
    } catch (parseErr) {
      console.error(`[${SERVER_NAME}] JSON Parse Error:`, parseErr.message, 'Raw line:', trimmed);
    }
  });

  rl.on('close', () => {
    console.error(`[${SERVER_NAME}] stdin closed, exiting.`);
    process.exit(0);
  });
}

start();
