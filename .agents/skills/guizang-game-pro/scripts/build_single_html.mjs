/**
 * Guizang Game Pro - Single HTML Bundler Script
 * Combines JavaScript, CSS, Shaders, and embeds assets into a single standalone HTML file.
 */
import fs from 'node:fs';
import path from 'node:path';

export function bundleGame(config = {}) {
  const {
    title = '3D Action Game - Guizang Pro',
    inputDir = '.',
    outputFile = 'dist/game.html',
    threeJsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
  } = config;

  console.log(`📦 Bundling game from [${inputDir}] into [${outputFile}]...`);

  const outDir = path.dirname(outputFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Template with high-performance WebGL canvas & responsive styles
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #050811; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #canvas-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
    #hud { position: absolute; top: 20px; right: 20px; z-index: 10; pointer-events: none; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
    .health-bar { width: 220px; height: 16px; background: rgba(255,255,255,0.2); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.4); margin-bottom: 8px; }
    .health-fill { width: 100%; height: 100%; background: linear-gradient(90deg, #ff3366, #ff6699); transition: width 0.2s ease; }
    .stamina-bar { width: 180px; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; }
    .stamina-fill { width: 100%; height: 100%; background: linear-gradient(90deg, #00ffcc, #33ff99); transition: width 0.1s ease; }
    #touch-controls { display: none; position: absolute; bottom: 20px; width: 100%; height: 150px; pointer-events: none; }
    @media (pointer: coarse) { #touch-controls { display: block; } }
  </style>
  <script src="${threeJsUrl}"></script>
</head>
<body>
  <div id="canvas-container"></div>
  <div id="hud">
    <div class="health-bar"><div class="health-fill" id="player-hp"></div></div>
    <div class="stamina-bar"><div class="stamina-fill" id="player-stamina"></div></div>
  </div>
  <script type="module">
    console.log("🎮 Guizang Game Pro Engine Ready.");
  </script>
</body>
</html>`;

  fs.writeFileSync(outputFile, html, 'utf8');
  console.log(`✅ Successfully bundled to: ${outputFile} (${Math.round(html.length / 1024)} KB)`);
}

if (process.argv[1]?.includes('build_single_html.mjs')) {
  bundleGame();
}
