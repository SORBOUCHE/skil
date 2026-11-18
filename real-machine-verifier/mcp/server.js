#!/usr/bin/env node
/**
 * Real-Machine Verifier - Model Context Protocol (MCP) Server
 * 
 * Executes, monitors, and debugs real-world applications directly on the physical
 * Windows host to eliminate speculative guessing after virtual simulation.
 * 
 * Protocol: JSON-RPC 2.0 over stdio
 */

const readline = require('node:readline');
const { spawn, execSync } = require('node:child_process');
const net = require('node:net');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const SERVER_NAME = 'real-machine-verifier';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'run_live_process',
    description: 'Execute a command natively on the Windows host machine with real-time telemetry (RAM WorkingSet, CPU, stdout, stderr, exit code). Eliminates theoretical guesswork.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The exact command line string to execute (e.g. "python app.py" or "node server.js")'
        },
        cwd: {
          type: 'string',
          description: 'Working directory for execution (defaults to current working directory)'
        },
        timeout_seconds: {
          type: 'number',
          description: 'Execution timeout in seconds (default: 30 seconds)',
          default: 30
        },
        is_daemon: {
          type: 'boolean',
          description: 'Set to true for long-running servers or background services that need a health probe before stopping',
          default: false
        }
      },
      required: ['command']
    }
  },
  {
    name: 'probe_real_port',
    description: 'Verify if a real TCP port is listening on the host machine and test HTTP responsiveness (status code, headers, and body snippet).',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          description: 'The TCP port number to check (e.g. 3000, 8000, 5000, 8080)'
        },
        path: {
          type: 'string',
          description: 'HTTP path to request (default: "/")',
          default: '/'
        },
        timeout_ms: {
          type: 'number',
          description: 'Connection timeout in milliseconds (default: 3000)',
          default: 3000
        }
      },
      required: ['port']
    }
  },
  {
    name: 'read_system_crash_logs',
    description: 'Inspect Windows Event Viewer Application Log for native application crashes (Event ID 1000) within the last N minutes. Pinpoints faulting DLLs, exception codes, and memory offsets.',
    inputSchema: {
      type: 'object',
      properties: {
        minutes_back: {
          type: 'number',
          description: 'How many minutes back in history to scan (default: 15)',
          default: 15
        },
        app_name_filter: {
          type: 'string',
          description: 'Optional executable name filter (e.g. "python.exe", "node.exe", "app.exe")'
        }
      }
    }
  },
  {
    name: 'open_test_cmd_window',
    description: 'Launch the program in an interactive visible CMD window on the Windows desktop (cmd.exe /k) for live manual testing. Only used when development is 100% complete.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute in the visible CMD window'
        },
        title: {
          type: 'string',
          description: 'Title of the command window',
          default: 'Antigravity Real Machine Test'
        },
        cwd: {
          type: 'string',
          description: 'Working directory for the test'
        }
      },
      required: ['command']
    }
  }
];

// Execute a process and collect real host vitals
function executeProcess(command, cwd, timeoutSeconds, isDaemon) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const workDir = cwd ? path.resolve(cwd) : process.cwd();
    
    let stdoutData = '';
    let stderrData = '';
    let peakMemoryMB = 0;
    let pid = null;
    let killedByTimeout = false;

    // Use powershell / cmd execution with no visible window
    const child = spawn('cmd.exe', ['/c', command], {
      cwd: workDir,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    pid = child.pid;

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // Sample process memory usage
    const memorySampler = setInterval(() => {
      if (!pid) return;
      try {
        const memOut = execSync(`powershell -NoProfile -Command "(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).WorkingSet64"`, {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 2000
        }).trim();
        if (memOut) {
          const bytes = parseInt(memOut, 10);
          if (!isNaN(bytes)) {
            const mb = Math.round((bytes / (1024 * 1024)) * 100) / 100;
            if (mb > peakMemoryMB) peakMemoryMB = mb;
          }
        }
      } catch (_) {}
    }, 500);

    const timeoutLimit = (timeoutSeconds || 30) * 1000;
    const timer = setTimeout(() => {
      killedByTimeout = true;
      clearInterval(memorySampler);
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { windowsHide: true });
      } catch (_) {
        child.kill();
      }
    }, timeoutLimit);

    child.on('close', (code) => {
      clearInterval(memorySampler);
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      
      resolve({
        status: killedByTimeout ? (isDaemon ? 'DAEMON_SAMPLED' : 'TIMEOUT') : (code === 0 ? 'SUCCESS' : 'FAILED'),
        exit_code: code,
        duration_seconds: Math.round((durationMs / 1000) * 100) / 100,
        pid,
        peak_memory_mb: peakMemoryMB,
        stdout: stdoutData.slice(-10000), // last 10KB
        stderr: stderrData.slice(-10000),
        timed_out: killedByTimeout
      });
    });

    child.on('error', (err) => {
      clearInterval(memorySampler);
      clearTimeout(timer);
      resolve({
        status: 'CRASHED',
        error: err.message,
        duration_seconds: Math.round(((Date.now() - startTime) / 1000) * 100) / 100,
        stdout: stdoutData,
        stderr: stderrData
      });
    });
  });
}

// Check TCP port and HTTP response
function probePort(port, reqPath = '/', timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isPortOpen = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      isPortOpen = true;
      socket.destroy();

      // Probe HTTP
      const req = http.get({
        hostname: '127.0.0.1',
        port: port,
        path: reqPath || '/',
        timeout: timeoutMs
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({
            port_open: true,
            http_accessible: true,
            status_code: res.statusCode,
            headers: res.headers,
            body_preview: body.slice(0, 500)
          });
        });
      });

      req.on('error', (err) => {
        resolve({
          port_open: true,
          http_accessible: false,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          port_open: true,
          http_accessible: false,
          error: 'HTTP request timed out'
        });
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port_open: false, error: 'Port connection timed out' });
    });

    socket.on('error', (err) => {
      resolve({ port_open: false, error: err.message });
    });

    socket.connect(port, '127.0.0.1');
  });
}

// Query Windows Event Viewer for Application Errors (Event ID 1000)
function queryWindowsCrashLogs(minutesBack = 15, appFilter = '') {
  try {
    const filterScript = `
      $time = (Get-Date).AddMinutes(-${minutesBack});
      $events = Get-WinEvent -FilterHashtable @{LogName='Application'; Id=1000; StartTime=$time} -ErrorAction SilentlyContinue | Select-Object -First 10;
      if ($events) {
        $events | ForEach-Object {
          $msg = $_.Message;
          [PSCustomObject]@{
            TimeCreated = $_.TimeCreated.ToString('s');
            Message = $msg;
          }
        } | ConvertTo-Json -Compress
      } else {
        "[]"
      }
    `;
    const output = execSync(`powershell -NoProfile -Command "${filterScript.replace(/\n/g, ' ')}"`, {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 10000
    }).trim();

    let parsed = [];
    if (output && output !== '[]') {
      try {
        parsed = JSON.parse(output);
        if (!Array.isArray(parsed)) parsed = [parsed];
      } catch (_) {
        parsed = [{ raw: output }];
      }
    }

    if (appFilter && parsed.length > 0) {
      parsed = parsed.filter(e => (e.Message || '').toLowerCase().includes(appFilter.toLowerCase()));
    }

    return {
      crashes_found: parsed.length,
      events: parsed
    };
  } catch (err) {
    return {
      crashes_found: 0,
      error: `Could not query Event Viewer: ${err.message}`
    };
  }
}

// Launch an interactive visible CMD window on the desktop
function launchVisibleCmd(command, title, cwd) {
  const workDir = cwd ? path.resolve(cwd) : process.cwd();
  const windowTitle = title || 'Antigravity Real Machine Test';
  const startCmd = `start "${windowTitle}" cmd.exe /k "cd /d "${workDir}" && color 0B && echo ======================================================== && echo   ANTIGRAVITY REAL-MACHINE TEST RUNNER && echo   Command: ${command} && echo ======================================================== && echo. && ${command} && echo. && echo -------------------------------------------------------- && echo Process finished. Window remains open for inspection. && echo --------------------------------------------------------"`;
  
  execSync(startCmd, { windowsHide: false });
  return {
    launched: true,
    title: windowTitle,
    working_directory: workDir,
    message: 'Visible CMD test window opened successfully on the desktop.'
  };
}

// JSON-RPC Request Handler
async function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION
        }
      }
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;

    try {
      if (name === 'run_live_process') {
        const result = await executeProcess(
          args.command,
          args.cwd,
          args.timeout_seconds,
          args.is_daemon
        );
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        };
      }

      if (name === 'probe_real_port') {
        const result = await probePort(args.port, args.path, args.timeout_ms);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        };
      }

      if (name === 'read_system_crash_logs') {
        const result = queryWindowsCrashLogs(args.minutes_back, args.app_name_filter);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        };
      }

      if (name === 'open_test_cmd_window') {
        const result = launchVisibleCmd(args.command, args.title, args.cwd);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${name}` }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message, stack: err.stack }, null, 2) }],
          isError: true
        }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

// Start stdio JSON-RPC loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    const response = await handleRequest(request);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: ' + err.message }
    }) + '\n');
  }
});
