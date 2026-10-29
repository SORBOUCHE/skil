#!/usr/bin/env node
/**
 * Arabic RTL UI Live Injector (Zero-Dependency Node.js)
 * Connects to the running Antigravity IDE Chromium window via DevTools Protocol
 * and permanently installs an automated RTL observer and stylesheet.
 */

const fs = require('fs');
const path = require('path');

const DEVTOOLS_PORT_FILE = path.join(
  process.env.APPDATA || 'C:\\Users\\Admin\\AppData\\Roaming',
  'Antigravity',
  'DevToolsActivePort'
);

async function injectRtlIntoPage(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      resolve(false);
    }, 5000);

    ws.onopen = () => {
      const code = `
        (function() {
          // 1. Inject Global CSS Stylesheet
          let style = document.getElementById('antigravity-arabic-rtl-style');
          if (!style) {
            style = document.createElement('style');
            style.id = 'antigravity-arabic-rtl-style';
            document.head.appendChild(style);
          }
          style.textContent = \`
            /* Force RTL on all Arabic text elements */
            [dir="rtl"], .arabic-rtl {
              direction: rtl !important;
              text-align: right !important;
              unicode-bidi: isolate !important;
            }
            /* Code blocks inside RTL stay LTR */
            [dir="rtl"] pre, [dir="rtl"] code {
              direction: ltr !important;
              text-align: left !important;
              unicode-bidi: isolate !important;
              display: inline-block;
            }
            [dir="rtl"] ul, [dir="rtl"] ol {
              padding-right: 1.5rem !important;
              padding-left: 0 !important;
            }
          \`;

          // 2. Direct DOM Scanner for existing Arabic elements
          const arabicRe = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/;
          let count = 0;

          function processElement(el) {
            if (!el || el.nodeType !== 1) return;
            const tag = el.tagName;
            if (['SCRIPT', 'STYLE', 'PRE', 'CODE', 'INPUT', 'TEXTAREA'].includes(tag)) return;

            const text = (el.innerText || el.textContent || '').trim();
            if (arabicRe.test(text.substring(0, 30))) {
              el.setAttribute('dir', 'rtl');
              el.classList.add('arabic-rtl');
              el.style.direction = 'rtl';
              el.style.textAlign = 'right';
              el.style.unicodeBidi = 'isolate';
              count++;
            }
          }

          document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, div.prose > *').forEach(processElement);

          // 3. Install Persistent MutationObserver for real-time streaming chat messages
          if (!window.__agyArabicRtlObserver) {
            window.__agyArabicRtlObserver = new MutationObserver((mutations) => {
              for (const m of mutations) {
                for (const node of m.addedNodes) {
                  if (node.nodeType === 1) {
                    processElement(node);
                    node.querySelectorAll && node.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, div').forEach(processElement);
                  }
                }
              }
            });
            window.__agyArabicRtlObserver.observe(document.body, { childList: true, subtree: true });
          }

          return { success: true, count };
        })()
      `;

      ws.send(JSON.stringify({
        id: 101,
        method: 'Runtime.evaluate',
        params: { expression: code, returnByValue: true }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id === 101) {
          clearTimeout(timeout);
          ws.close();
          resolve(data.result?.result?.value || true);
        }
      } catch (_) {
        resolve(true);
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
  });
}

async function runInjection() {
  if (!fs.existsSync(DEVTOOLS_PORT_FILE)) {
    return { success: false, reason: 'DevToolsActivePort not found' };
  }

  const portLines = fs.readFileSync(DEVTOOLS_PORT_FILE, 'utf8').trim().split('\n');
  const port = parseInt(portLines[0], 10);
  if (!port || isNaN(port)) {
    return { success: false, reason: 'Invalid port' };
  }

  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`);
    const targets = await res.json();
    const pages = targets.filter(t => t.type === 'page' || t.type === 'webview');

    const results = [];
    for (const p of pages) {
      if (p.webSocketDebuggerUrl) {
        const res = await injectRtlIntoPage(p.webSocketDebuggerUrl);
        results.push({ title: p.title, injected: res });
      }
    }
    return { success: true, targets: results };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Auto-run if executed directly
if (require.main === module) {
  runInjection().then(res => console.log(JSON.stringify(res, null, 2)));
}

module.exports = { runInjection };
