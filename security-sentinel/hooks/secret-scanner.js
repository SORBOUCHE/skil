/**
 * Secret Scanner - PreToolUse Hook for Antigravity
 * Detects hardcoded credentials, API keys, private keys, and connection strings
 * before code is committed to disk via `write_to_file`.
 */

const fs = require('fs');

// Security patterns for credential scanning
const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key ID',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
    excludeRegex: /AKIAIOSFODNN7EXAMPLE/
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{22,82}|gho_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36})\b/
  },
  {
    name: 'Anthropic API Key',
    regex: /\bsk-ant-[a-zA-Z0-9_-]{20,}\b/
  },
  {
    name: 'OpenAI API Key',
    regex: /\bsk-(?:proj-)?[a-zA-Z0-9_-]{20,}\b/,
    excludeRegex: /sk-ant-/
  },
  {
    name: 'Google / Gemini API Key',
    regex: /\bAIzaSy[a-zA-Z0-9_-]{33}\b/
  },
  {
    name: 'Private Cryptographic Key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/
  },
  {
    name: 'PostgreSQL Database Connection String with Password',
    regex: /postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@[^\s\/]+/i,
    excludeRegex: /postgres:\/\/(?:user|postgres|username):(password|\$|\{)/i
  },
  {
    name: 'MongoDB Connection String with Password',
    regex: /mongodb(?:\+srv)?:\/\/[^\s:]+:[^\s@]+@[^\s\/]+/i,
    excludeRegex: /mongodb:\/\/(?:user|username):(password|\$|\{)/i
  },
  {
    name: 'MySQL Connection String with Password',
    regex: /mysql:\/\/[^\s:]+:[^\s@]+@[^\s\/]+/i,
    excludeRegex: /mysql:\/\/(?:user|root):(password|\$|\{)/i
  },
  {
    name: 'Slack Token',
    regex: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/
  },
  {
    name: 'Stripe Secret Key',
    regex: /\bsk_live_[0-9a-zA-Z]{24}\b/
  }
];

function readAllStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', () => {
      resolve(data);
    });

    // In case stdin is already ended or empty
    if (process.stdin.isTTY) {
      resolve('');
    }
  });
}

async function main() {
  try {
    const rawInput = await readAllStdin();
    if (!rawInput || !rawInput.trim()) {
      console.log(JSON.stringify({ decision: 'allow' }));
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      // If not JSON, scan raw input directly
      parsed = { args: { CodeContent: rawInput } };
    }

    // Extract content to scan
    const contentToScan = [];
    if (parsed.toolCall && parsed.toolCall.args) {
      if (typeof parsed.toolCall.args.CodeContent === 'string') {
        contentToScan.push(parsed.toolCall.args.CodeContent);
      }
      if (typeof parsed.toolCall.args.ReplacementContent === 'string') {
        contentToScan.push(parsed.toolCall.args.ReplacementContent);
      }
    }
    if (parsed.args) {
      if (typeof parsed.args.CodeContent === 'string') {
        contentToScan.push(parsed.args.CodeContent);
      }
      if (typeof parsed.args.ReplacementContent === 'string') {
        contentToScan.push(parsed.args.ReplacementContent);
      }
    }
    if (typeof parsed.CodeContent === 'string') {
      contentToScan.push(parsed.CodeContent);
    }

    // Fallback if no specific arg extracted
    if (contentToScan.length === 0 && typeof rawInput === 'string') {
      contentToScan.push(rawInput);
    }

    const fullText = contentToScan.join('\n');

    const matchedSecrets = [];

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(fullText)) {
        if (pattern.excludeRegex && pattern.excludeRegex.test(fullText)) {
          continue;
        }
        matchedSecrets.push(pattern.name);
      }
    }

    if (matchedSecrets.length > 0) {
      const detected = matchedSecrets.join(', ');
      console.error(`[SECURITY ALERT] Sensitive secrets detected: ${detected}`);
      console.log(JSON.stringify({
        decision: 'ask',
        reason: `[SECURITY ALERT] Potential hardcoded credential or API key detected in code content (${detected}). Verify if this should be moved to an environment variable.`
      }));
      return;
    }

    console.log(JSON.stringify({ decision: 'allow' }));
  } catch (err) {
    console.error(`[SECURITY ERROR] Hook scanner encountered an error: ${err.message}`);
    // Fail open or ask based on safe defaults
    console.log(JSON.stringify({ decision: 'allow' }));
  }
}

main();
