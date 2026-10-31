#!/usr/bin/env node
/**
 * Arabic RTL UI Live Injector with Interactive Toggle Button (Zero-Dependency Node.js)
 * Injects a sleek floating toggle button into Antigravity's Chromium UI,
 * allowing instant ON / OFF switching with keyboard shortcut (Alt+R) and state persistence.
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
          // 1. Prepare Stylesheet
          let style = document.getElementById('antigravity-arabic-rtl-style');
          if (!style) {
            style = document.createElement('style');
            style.id = 'antigravity-arabic-rtl-style';
            document.head.appendChild(style);
          }

          const rtlCss = \`
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
            #antigravity-rtl-toggle-btn:hover {
              transform: translateX(-50%) scale(1.05);
              opacity: 1;
              filter: brightness(1.1);
            }
            #antigravity-rtl-toggle-btn:active {
              transform: translateX(-50%) scale(0.96);
            }
          \`;

          const arabicRe = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/;

          function processElement(el) {
            if (!el || el.nodeType !== 1) return;
            const tag = el.tagName;
            if (['SCRIPT', 'STYLE', 'PRE', 'CODE', 'INPUT', 'TEXTAREA'].includes(tag)) return;
            if (el.id === 'antigravity-rtl-toggle-btn' || el.closest('#antigravity-rtl-toggle-btn')) return;

            const text = (el.innerText || el.textContent || '').trim();
            if (arabicRe.test(text.substring(0, 30))) {
              el.setAttribute('dir', 'rtl');
              el.setAttribute('data-rtl-applied', 'true');
              el.classList.add('arabic-rtl');
              el.style.direction = 'rtl';
              el.style.textAlign = 'right';
              el.style.unicodeBidi = 'isolate';
            }
          }

          let isRtlActive = localStorage.getItem('antigravity_rtl_enabled') !== 'false'; // Default to ON

          function enableRtl() {
            style.textContent = rtlCss;
            document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, div.prose > *').forEach(processElement);
            if (window.__agyArabicRtlObserver) {
              window.__agyArabicRtlObserver.disconnect();
            }
            window.__agyArabicRtlObserver = new MutationObserver((mutations) => {
              if (!isRtlActive) return;
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

          function disableRtl() {
            style.textContent = \`
              #antigravity-rtl-toggle-btn:hover {
                transform: scale(1.05);
                filter: brightness(1.1);
              }
            \`;
            if (window.__agyArabicRtlObserver) {
              window.__agyArabicRtlObserver.disconnect();
            }
            document.querySelectorAll('[data-rtl-applied="true"]').forEach(el => {
              el.removeAttribute('dir');
              el.classList.remove('arabic-rtl');
              el.style.direction = '';
              el.style.textAlign = '';
              el.style.unicodeBidi = '';
              el.removeAttribute('data-rtl-applied');
            });
          }

          // 2. Create or Update Floating Interactive Toggle Button
          let btn = document.getElementById('antigravity-rtl-toggle-btn');
          const isNewBtn = !btn;
          if (isNewBtn) {
            btn = document.createElement('button');
            btn.id = 'antigravity-rtl-toggle-btn';
            document.body.appendChild(btn);

            btn.onclick = (e) => {
              e.stopPropagation();
              isRtlActive = !isRtlActive;
              localStorage.setItem('antigravity_rtl_enabled', isRtlActive ? 'true' : 'false');
              updateUI();
            };

            // Keyboard shortcut Alt+R or Ctrl+Shift+R
            window.addEventListener('keydown', (e) => {
              if ((e.altKey && (e.key === 'r' || e.key === 'R' || e.key === 'ق')) ||
                  (e.ctrlKey && e.shiftKey && (e.key === 'r' || e.key === 'R' || e.key === 'ق'))) {
                e.preventDefault();
                isRtlActive = !isRtlActive;
                localStorage.setItem('antigravity_rtl_enabled', isRtlActive ? 'true' : 'false');
                updateUI();
              }
            });
          }

          // Compact Centered Styling (Doesn't block top-right update icon)
          btn.style.cssText = \`
            position: fixed;
            top: 6px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999999;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            border-radius: 9999px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(8px);
            transition: transform 0.15s ease, background 0.2s ease, opacity 0.2s ease;
            user-select: none;
            line-height: 1.2;
            opacity: 0.88;
          \`;

          function updateUI() {
            if (isRtlActive) {
              btn.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
              btn.style.color = '#ffffff';
              btn.style.borderColor = 'rgba(52, 211, 153, 0.6)';
              btn.innerHTML = '<span style="font-size:11px">🌐</span> <span>RTL</span> <kbd style="background:rgba(0,0,0,0.25);padding:1px 4px;border-radius:3px;font-size:8px">Alt+R</kbd>';
              btn.title = 'محاذاة النص العربي لليمين مفعلة حالياً. انقر لإيقافها [Alt+R]';
              enableRtl();
            } else {
              btn.style.background = 'rgba(30, 41, 59, 0.88)';
              btn.style.color = '#94a3b8';
              btn.style.borderColor = 'rgba(148, 163, 184, 0.3)';
              btn.innerHTML = '<span style="font-size:11px">🌐</span> <span style="opacity:0.7">LTR</span> <kbd style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-size:8px">Alt+R</kbd>';
              btn.title = 'محاذاة النص العربي معطلة حالياً. انقر لتشغيلها [Alt+R]';
              disableRtl();
            }
          }

          updateUI();
          return { success: true, isRtlActive };
        })()
      `;

      ws.send(JSON.stringify({
        id: 201,
        method: 'Runtime.evaluate',
        params: { expression: code, returnByValue: true }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id === 201) {
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
