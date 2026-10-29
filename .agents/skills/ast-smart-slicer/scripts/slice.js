#!/usr/bin/env node
/**
 * AST Smart Slicer Utility
 * Zero-dependency fast code slicer for JS, TS, Python, Go, and Rust.
 * Extracts symbols, functions, classes, and minimal import contexts.
 */
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    symbol: null,
    range: null,
    outline: false,
    importsOnly: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' || args[i] === '-f') {
      options.file = args[++i];
    } else if (args[i] === '--symbol' || args[i] === '-s') {
      options.symbol = args[++i];
    } else if (args[i] === '--range' || args[i] === '-r') {
      options.range = args[++i];
    } else if (args[i] === '--outline' || args[i] === '-o') {
      options.outline = true;
    } else if (args[i] === '--imports') {
      options.importsOnly = true;
    } else if (!options.file) {
      options.file = args[i];
    }
  }
  return options;
}

function extractImports(lines, ext) {
  const importLines = [];
  const isPython = ext === '.py';
  const isJsTs = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext);
  const isGo = ext === '.go';
  const isRust = ext === '.rs';

  let inMultilineImport = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (isJsTs) {
      if (trimmed.startsWith('import ') || trimmed.startsWith('export {') || trimmed.includes('require(')) {
        importLines.push({ line: idx + 1, text: line });
        if (trimmed.startsWith('import ') && !trimmed.includes('from') && !trimmed.endsWith(';')) {
          inMultilineImport = true;
        }
      } else if (inMultilineImport) {
        importLines.push({ line: idx + 1, text: line });
        if (trimmed.includes('from') || trimmed.endsWith(';')) {
          inMultilineImport = false;
        }
      }
    } else if (isPython) {
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        importLines.push({ line: idx + 1, text: line });
      }
    } else if (isGo) {
      if (trimmed.startsWith('import (') || inMultilineImport) {
        importLines.push({ line: idx + 1, text: line });
        inMultilineImport = !trimmed.startsWith(')');
      } else if (trimmed.startsWith('import ')) {
        importLines.push({ line: idx + 1, text: line });
      }
    } else if (isRust) {
      if (trimmed.startsWith('use ')) {
        importLines.push({ line: idx + 1, text: line });
      }
    }
  }
  return importLines;
}

function findSymbolSlice(lines, symbolName, ext) {
  const isPython = ext === '.py';
  let startIdx = -1;
  let endIdx = -1;
  let startIndent = -1;
  let symbolType = 'unknown';

  const jsTsPatterns = [
    { type: 'function', regex: new RegExp(`(?:async\\s+)?function\\s*\\*?\\s+${symbolName}\\b`) },
    { type: 'arrow-function', regex: new RegExp(`(?:const|let|var)\\s+${symbolName}\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|[a-zA-Z0-9_$]+)\\s*=>`) },
    { type: 'class', regex: new RegExp(`class\\s+${symbolName}\\b`) },
    { type: 'interface', regex: new RegExp(`interface\\s+${symbolName}\\b`) },
    { type: 'type', regex: new RegExp(`type\\s+${symbolName}\\s*=`) },
    { type: 'method', regex: new RegExp(`(?:async\\s+)?(?:static\\s+)?(?:get\\s+|set\\s+)?${symbolName}\\s*\\(`) }
  ];

  const pyPatterns = [
    { type: 'function', regex: new RegExp(`^(\\s*)(?:async\\s+)?def\\s+${symbolName}\\s*\\(`) },
    { type: 'class', regex: new RegExp(`^(\\s*)class\\s+${symbolName}\\b`) }
  ];

  if (isPython) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of pyPatterns) {
        const m = line.match(p.regex);
        if (m) {
          startIdx = i;
          startIndent = m[1].length;
          symbolType = p.type;
          break;
        }
      }
      if (startIdx !== -1) break;
    }

    if (startIdx !== -1) {
      endIdx = lines.length - 1;
      for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // skip blank lines
        const indent = line.match(/^(\s*)/)[1].length;
        if (indent <= startIndent) {
          endIdx = i - 1;
          break;
        }
      }
    }
  } else {
    // JS/TS, Go, Rust bracket-based matching
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of jsTsPatterns) {
        if (p.regex.test(line)) {
          startIdx = i;
          symbolType = p.type;
          break;
        }
      }
      if (startIdx !== -1) break;
    }

    if (startIdx !== -1) {
      let braceDepth = 0;
      let foundFirstBrace = false;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '{') {
            braceDepth++;
            foundFirstBrace = true;
          } else if (char === '}') {
            braceDepth--;
          }
        }
        if (foundFirstBrace && braceDepth <= 0) {
          endIdx = i;
          break;
        }
      }

      // Fallback for single-line statements or types
      if (endIdx === -1) {
        endIdx = Math.min(lines.length - 1, startIdx + 30);
      }
    }
  }

  return { startIdx, endIdx, symbolType };
}

function generateOutline(lines, ext) {
  const symbols = [];
  const isPython = ext === '.py';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isPython) {
      const defMatch = line.match(/^(\s*)(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/);
      const classMatch = line.match(/^(\s*)class\s+([A-Za-z0-9_]+)/);
      if (defMatch) {
        symbols.push({ name: defMatch[2], type: 'def', line: i + 1, indent: defMatch[1].length });
      } else if (classMatch) {
        symbols.push({ name: classMatch[2], type: 'class', line: i + 1, indent: classMatch[1].length });
      }
    } else {
      const fnMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s*([A-Za-z0-9_$]+)/);
      const clsMatch = trimmed.match(/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/);
      const ifaceMatch = trimmed.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/);
      const constMatch = trimmed.match(/^(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(/);

      if (fnMatch) symbols.push({ name: fnMatch[1], type: 'function', line: i + 1 });
      else if (clsMatch) symbols.push({ name: clsMatch[1], type: 'class', line: i + 1 });
      else if (ifaceMatch) symbols.push({ name: ifaceMatch[1], type: 'interface', line: i + 1 });
      else if (constMatch) symbols.push({ name: constMatch[1], type: 'const-fn', line: i + 1 });
    }
  }
  return symbols;
}

function main() {
  const options = parseArgs();
  if (!options.file) {
    console.error('Usage: node slice.js <filePath> [--symbol <name>] [--range <start-end>] [--outline] [--imports]');
    process.exit(1);
  }

  const resolved = path.resolve(options.file);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found: ${resolved}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const ext = path.extname(resolved).toLowerCase();

  if (options.outline) {
    const outline = generateOutline(lines, ext);
    console.log(JSON.stringify({ file: resolved, totalLines: lines.length, symbols: outline }, null, 2));
    return;
  }

  if (options.importsOnly) {
    const imports = extractImports(lines, ext);
    console.log(JSON.stringify({ file: resolved, imports }, null, 2));
    return;
  }

  if (options.range) {
    const parts = options.range.split('-').map(Number);
    const start = Math.max(1, parts[0]);
    const end = Math.min(lines.length, parts[1] || start);
    const slice = lines.slice(start - 1, end).join('\n');
    console.log(`// [SLICE] ${path.basename(resolved)} lines ${start}-${end}`);
    console.log(slice);
    return;
  }

  if (options.symbol) {
    const result = findSymbolSlice(lines, options.symbol, ext);
    if (result.startIdx === -1) {
      console.error(`Symbol "${options.symbol}" not found in ${resolved}`);
      process.exit(2);
    }
    const startLine = result.startIdx + 1;
    const endLine = result.endIdx + 1;
    const slicedCode = lines.slice(result.startIdx, result.endIdx + 1).join('\n');
    const imports = extractImports(lines, ext);

    console.log(JSON.stringify({
      file: resolved,
      symbol: options.symbol,
      type: result.symbolType,
      startLine,
      endLine,
      lineCount: endLine - startLine + 1,
      totalFileLines: lines.length,
      tokenSavingPercent: Math.round((1 - (endLine - startLine + 1) / lines.length) * 100),
      slicedCode,
      relevantImports: imports.slice(0, 10)
    }, null, 2));
    return;
  }

  // Default: outline summary
  const outline = generateOutline(lines, ext);
  console.log(JSON.stringify({ file: resolved, totalLines: lines.length, symbols: outline }, null, 2));
}

main();
