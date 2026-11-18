#!/usr/bin/env node
/**
 * Real-Machine Verifier - PostToolUse Hook
 * 
 * Automatically monitors file modifications and reminds the agent to run
 * live machine verification on the real host to eliminate speculative guessing.
 */

try {
  const path = require('node:path');
  const args = process.argv.slice(2);
  const targetFile = args[0] || process.env.ANTIGRAVITY_TOOL_PATH || '';

  const ext = path.extname(targetFile).toLowerCase();
  const runnableExts = ['.py', '.js', '.ts', '.dart', '.go', '.rs', '.cpp', '.cs', '.java', '.bat', '.ps1', '.html'];

  if (!targetFile || runnableExts.includes(ext)) {
    process.stdout.write(
      '\n[REAL-MACHINE-VERIFIER ACTIVE] تم رصد تعديل برمجي أو إنشاء ملف كود. ' +
      'يجب إجراء فحص تشغيلي حقيقي على الحاسوب (Bare-Metal Execution) بعد الفحص الافتراضي، ' +
      'لقياس استهلاك الذاكرة والمعالج والتأكد من انعدام أخطاء التشغيل وسجلات الانهيار دون أي تخمين.\n'
    );
  }
} catch (_) {}
process.exit(0);
