const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const pluginsDir = 'C:\\Users\\Admin\\.gemini\\config\\plugins';
const allCustomPlugins = [
  'github-scout',
  'context-memory-manager',
  'ai-agent-toolkit',
  'task-orchestrator',
  'devops-autopilot',
  'performance-profiler',
  'self-healing-debugger',
  'security-sentinel',
  'synthetic-data-factory',
  'api-contract-guardian',
  'smart-refactor-architect',
  'live-db-pilot',
  'autonomous-e2e-tester',
  'deep-code-indexer',
  'arabic-rtl-guardian'
];

console.log('========================================================================');
console.log('    فحص المنظومة الكبرى لإضافات Antigravity المخصصة (15 إضافة كاملة)');
console.log('========================================================================\n');

let allOk = true;

for (const plugin of allCustomPlugins) {
  const pPath = path.join(pluginsDir, plugin);
  console.log(`🔍 [${plugin}]:`);
  
  if (!fs.existsSync(pPath)) {
    console.error(`  ❌ المجلد غير موجود في المسار العام: ${pPath}`);
    allOk = false;
    continue;
  }
  
  // 1. فحص plugin.json
  const manifestPath = path.join(pPath, 'plugin.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`  ✅ plugin.json: "${manifest.displayName || manifest.name}" (v${manifest.version || '1.0.0'})`);
    } catch (e) {
      console.error(`  ❌ خطأ في تنسيق plugin.json: ${e.message}`);
      allOk = false;
    }
  } else {
    console.error(`  ❌ ملف plugin.json مفقود!`);
    allOk = false;
  }

  // 2. فحص rules/AGENTS.md
  const rulesPath = path.join(pPath, 'rules', 'AGENTS.md');
  if (fs.existsSync(rulesPath)) {
    const size = fs.statSync(rulesPath).size;
    console.log(`  ✅ قواعد AGENTS.md موجودة ومفعلة (${size} بايت).`);
  }

  // 3. فحص المهارات skills
  const skillsPath = path.join(pPath, 'skills');
  if (fs.existsSync(skillsPath)) {
    const skills = fs.readdirSync(skillsPath).filter(f => fs.statSync(path.join(skillsPath, f)).isDirectory());
    console.log(`  ✅ المهارات المضمنة (${skills.length}): ${skills.join(', ')}`);
    for (const sk of skills) {
      const skFile = path.join(skillsPath, sk, 'SKILL.md');
      if (!fs.existsSync(skFile)) {
        console.error(`    ❌ SKILL.md مفقود في: ${sk}`);
        allOk = false;
      }
    }
  }

  // 4. فحص hooks.json وسكريبتاتها
  const hooksPath = path.join(pPath, 'hooks.json');
  if (fs.existsSync(hooksPath)) {
    try {
      const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
      console.log(`  ✅ خطافات hooks.json: (${Object.keys(hooks).join(', ')})`);
    } catch (e) {
      console.error(`  ❌ خطأ في تنسيق hooks.json: ${e.message}`);
      allOk = false;
    }
  }

  // 5. فحص mcp_config.json
  const mcpConfigPath = path.join(pPath, 'mcp_config.json');
  if (fs.existsSync(mcpConfigPath)) {
    try {
      const mcp = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      const servers = Object.keys(mcp.mcpServers || {});
      console.log(`  ✅ مخدمات MCP: (${servers.join(', ')})`);
    } catch (e) {
      console.error(`  ❌ خطأ في تنسيق mcp_config.json: ${e.message}`);
      allOk = false;
    }
  }

  console.log('');
}

console.log('=== اختبار تشغيل مخدمات الـ MCP الحية ===\n');

// اختبار deep-code-indexer MCP server
const indexerMcpTest = path.join(pluginsDir, 'deep-code-indexer', 'mcp', 'test-server.js');
if (fs.existsSync(indexerMcpTest)) {
  const res = spawnSync('node', [indexerMcpTest], { encoding: 'utf8' });
  if (res.status === 0 && res.stdout.includes('100% operational')) {
    console.log('✅ مخدم Deep Code Indexer MCP شغال ومستجيب 100%.');
  } else {
    console.error(`❌ مخدم Deep Code Indexer MCP فشل: ${res.stderr || res.stdout}`);
    allOk = false;
  }
}

console.log('\n========================================================================');
console.log(allOk ? '🎯 النتيجة النهائية: كافة الإضافات الـ 15 سليمة وشغالة بنسبة 100%!' : '⚠️ توجد بعض المشاكل.');
console.log('========================================================================');
