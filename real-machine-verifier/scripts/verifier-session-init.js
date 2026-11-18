#!/usr/bin/env node
/**
 * Real-Machine Verifier - SessionStart Hook
 */

const os = require('node:os');
try {
  process.stdout.write(
    `[REAL-MACHINE-VERIFIER INITIALIZED] محرك الفحص الواقعي نشط على ${os.type()} ${os.release()} (${os.arch()}). جاهز للتشغيل الميداني ورصد الأخطاء الحقيقية.\n`
  );
} catch (_) {}
process.exit(0);
