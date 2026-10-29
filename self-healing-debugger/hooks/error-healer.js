#!/usr/bin/env node
/**
 * Self-Healing Debugger - Error Diagnostic Watcher Hook (PostToolUse)
 * Intercepts run_command outputs, identifies failures, parses stack traces,
 * and writes actionable diagnostic feedback to stderr while returning valid JSON to stdout.
 */

const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch (err) {
    return '';
  }
}

function parseInput(inputStr) {
  if (!inputStr || !inputStr.trim()) {
    return null;
  }
  try {
    return JSON.parse(inputStr);
  } catch (err) {
    return null;
  }
}

function extractErrorDetails(text) {
  if (!text || typeof text !== 'string') return null;

  const patterns = [
    { type: 'JavaScript/TypeScript Error', regex: /(?:Uncaught\s+)?([A-Za-z]+Error):\s*([^\r\n]+)/ },
    { type: 'Unhandled Promise Rejection', regex: /(UnhandledPromiseRejection(?:Warning)?):\s*([^\r\n]+)/ },
    { type: 'Python Traceback', regex: /Traceback \(most recent call last\):[\s\S]*?([A-Za-z]+Error|[A-Za-z]+Exception):\s*([^\r\n]+)/ },
    { type: 'Go Panic', regex: /panic:\s*([^\r\n]+)/ },
    { type: 'Rust Panic', regex: /thread '[^']+' panicked at (?:'([^']+)',\s*)?([^\r\n]+)/ },
    { type: 'Dart/Flutter Exception', regex: /(?:Unhandled exception:|Exception:|Error:)\s*([^\r\n]+)/ },
    { type: 'Assertion Failure', regex: /(AssertionError|assertion failed|FAILED|FAIL):\s*([^\r\n]+)/i },
    { type: 'Fatal/Build Error', regex: /(FATAL|FATAL ERROR|BUILD FAILED|Compilation error)[:\s]+([^\r\n]+)/i }
  ];

  let detectedType = null;
  let summary = null;

  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match) {
      detectedType = p.type;
      summary = match[0].trim().split('\n').pop().trim();
      break;
    }
  }

  if (!detectedType) {
    // Check fallback keywords
    const fallbackRegex = /(SyntaxError|TypeError|ReferenceError|AssertionError|FATAL|panic:|Traceback|UnhandledPromiseRejection|SIGSEGV|Segmentation fault)/i;
    const fallbackMatch = text.match(fallbackRegex);
    if (fallbackMatch) {
      detectedType = 'Detected Error Signature';
      summary = fallbackMatch[0];
    }
  }

  if (!detectedType) return null;

  // Extract file and line location
  // Pattern 1: Node/JS: at (path/to/file.js:line:col) or at path/to/file.js:line:col
  // Pattern 2: Python: File "path/to/file.py", line 123, in func
  // Pattern 3: Go/Rust: path/to/file.rs:123:45 or file.go:123
  let location = null;
  const jsLoc = text.match(/at\s+(?:.*?\s+\()?([A-Za-z0-9_\-./\\]+\.[a-zA-Z0-9]+):(\d+):(\d+)\)?/);
  const pyLoc = text.match(/File "([^"]+\.[a-zA-Z0-9]+)", line (\d+)(?:, in (\w+))?/);
  const rustGoLoc = text.match(/([A-Za-z0-9_\-./\\]+\.(?:rs|go|dart|ts|tsx|js|jsx)):(\d+)(?::(\d+))?/);

  if (pyLoc) {
    location = { file: pyLoc[1], line: pyLoc[2], context: pyLoc[3] ? `in ${pyLoc[3]}` : '' };
  } else if (jsLoc) {
    location = { file: jsLoc[1], line: jsLoc[2], col: jsLoc[3] };
  } else if (rustGoLoc) {
    location = { file: rustGoLoc[1], line: rustGoLoc[2], col: rustGoLoc[3] || null };
  }

  return { detectedType, summary, location };
}

function main() {
  const rawInput = readStdin();
  const payload = parseInput(rawInput);

  if (payload) {
    let outputText = '';

    if (payload.error) {
      outputText += String(payload.error) + '\n';
    }

    if (payload.tool_response) {
      if (typeof payload.tool_response === 'string') {
        outputText += payload.tool_response + '\n';
      } else if (typeof payload.tool_response === 'object') {
        outputText += JSON.stringify(payload.tool_response) + '\n';
      }
    }

    if (payload.output) {
      outputText += String(payload.output) + '\n';
    }

    if (payload.result) {
      outputText += typeof payload.result === 'string' ? payload.result : JSON.stringify(payload.result) + '\n';
    }

    const errorInfo = extractErrorDetails(outputText);

    if (errorInfo) {
      process.stderr.write('\n[SELF-HEALING DETECTOR] 🚨 Failure detected in command execution!\n');
      process.stderr.write(`[SELF-HEALING DETECTOR] Type: ${errorInfo.detectedType}\n`);
      process.stderr.write(`[SELF-HEALING DETECTOR] Signature: ${errorInfo.summary}\n`);
      if (errorInfo.location) {
        const locStr = `${errorInfo.location.file}:${errorInfo.location.line}${errorInfo.location.col ? ':' + errorInfo.location.col : ''}`;
        process.stderr.write(`[SELF-HEALING DETECTOR] Suspected Origin: ${locStr} ${errorInfo.location.context || ''}\n`);
      }
      process.stderr.write('[SELF-HEALING DETECTOR] 💡 Action Plan: Engage Root-Cause Analysis skill, locate origin, formulate surgical verified patch.\n\n');
    }
  }

  // Contract: PostToolUse must output valid JSON to stdout
  process.stdout.write(JSON.stringify({}));
}

main();
