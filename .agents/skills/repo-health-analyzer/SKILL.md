---
name: repo-health-analyzer
description: >
  تحليل شامل لصحة مستودع GitHub — حجم الكود واللغات، تغطية الاختبارات، جودة التوثيق،
  فحص أمني (.env, secrets, .gitignore)، عمر التبعيات والثغرات المعروفة، وتقرير صحة كامل.
  يعمل على المستودعات المحلية والبعيدة. يتطلب git وgh CLI.
---

# Repo Health Analyzer — محلل صحة المستودع

> تحليل شامل ودقيق لصحة أي مستودع — محلي أو على GitHub — مع تقرير واضح وتوصيات عملية.

## متى تستخدم هذه المهارة
- المستخدم يسأل: "حلل مستودعي"، "كيف صحة مشروعي؟"، "هل مشروعي جاهز للإنتاج؟"
- قبل نشر مشروع على GitHub
- عند تقييم مستودع مفتوح المصدر
- مراجعة دورية لجودة المشروع

---

## التحليل الشامل — 6 محاور

### المحور 1: بنية الكود 📏

```powershell
# عدد الملفات حسب النوع
$files = Get-ChildItem -Recurse -File -Exclude node_modules,*.git*,.dart_tool,build,dist,__pycache__
$langGroups = $files | Group-Object Extension | Sort-Object Count -Descending | Select-Object -First 15

Write-Host "`n📊 توزيع الملفات حسب اللغة:" -ForegroundColor Cyan
foreach ($g in $langGroups) {
    $pct = [math]::Round(($g.Count / $files.Count) * 100, 1)
    Write-Host "  $($g.Name.PadRight(10)) $($g.Count.ToString().PadLeft(5)) files  ($pct%)"
}
Write-Host "`n📁 إجمالي الملفات: $($files.Count)"
```

```powershell
# أكبر 10 ملفات (احتمال تقسيم)
Get-ChildItem -Recurse -File -Exclude node_modules,*.git*,.dart_tool |
    Sort-Object Length -Descending | Select-Object -First 10 |
    Format-Table @{N='File';E={$_.FullName.Replace((Get-Location).Path, '.')}},
                 @{N='KB';E={[math]::Round($_.Length/1KB,1)}} -AutoSize
```

```powershell
# ملفات طويلة جداً (>300 سطر — مرشحة للتقسيم)
Get-ChildItem -Recurse -File -Include *.js,*.ts,*.py,*.dart,*.jsx,*.tsx -Exclude node_modules,*.git* |
    ForEach-Object {
        $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
        if ($lines -gt 300) {
            [PSCustomObject]@{ File = $_.Name; Lines = $lines; Path = $_.FullName }
        }
    } | Sort-Object Lines -Descending
```

**معايير التقييم:**
| المؤشر | ✅ ممتاز | ⚠️ تحذير | 🔴 مشكلة |
| :--- | :--- | :--- | :--- |
| أطول ملف | < 200 سطر | 200–500 سطر | > 500 سطر |
| عدد اللغات | 1–3 | 4–6 | > 6 (تعقيد) |

---

### المحور 2: تغطية الاختبارات 🧪

```powershell
# البحث عن ملفات الاختبار
$testPatterns = @('*.test.*', '*.spec.*', '*_test.*', '*_spec.*', 'test_*')
$testFiles = @()
foreach ($p in $testPatterns) {
    $testFiles += Get-ChildItem -Recurse -File -Filter $p -Exclude node_modules,*.git*
}

# ملفات المصدر (بدون اختبارات)
$srcExts = @('.js','.ts','.py','.dart','.jsx','.tsx','.vue','.svelte')
$srcFiles = Get-ChildItem -Recurse -File -Exclude node_modules,*.git*,dist,build |
    Where-Object { $srcExts -contains $_.Extension } |
    Where-Object { $_.Name -notmatch '(test|spec|_test|_spec)' }

$coverage = if ($srcFiles.Count -gt 0) {
    [math]::Round(($testFiles.Count / $srcFiles.Count) * 100, 1)
} else { 0 }

Write-Host "`n🧪 تغطية الاختبارات:" -ForegroundColor Cyan
Write-Host "  ملفات المصدر: $($srcFiles.Count)"
Write-Host "  ملفات الاختبار: $($testFiles.Count)"
Write-Host "  نسبة التغطية: $coverage%"

if ($coverage -ge 70) { Write-Host "  ✅ ممتازة" -ForegroundColor Green }
elseif ($coverage -ge 30) { Write-Host "  ⚠️ متوسطة" -ForegroundColor Yellow }
else { Write-Host "  🔴 ضعيفة" -ForegroundColor Red }
```

**معايير التقييم:**
| المؤشر | ✅ ممتاز | ⚠️ تحذير | 🔴 مشكلة |
| :--- | :--- | :--- | :--- |
| نسبة التغطية | > 70% | 30–70% | < 30% |
| ملفات بلا اختبار | < 20% | 20–60% | > 60% |

---

### المحور 3: جودة التوثيق 📄

```powershell
$docChecks = @(
    @{ File = 'README.md';         Label = 'README';          Required = $true },
    @{ File = 'LICENSE';           Label = 'LICENSE';         Required = $true },
    @{ File = 'CONTRIBUTING.md';   Label = 'CONTRIBUTING';    Required = $false },
    @{ File = 'CODE_OF_CONDUCT.md'; Label = 'CODE_OF_CONDUCT'; Required = $false },
    @{ File = 'CHANGELOG.md';     Label = 'CHANGELOG';       Required = $false },
    @{ File = '.gitignore';       Label = '.gitignore';      Required = $true },
    @{ File = '.editorconfig';    Label = '.editorconfig';   Required = $false },
    @{ File = 'SECURITY.md';      Label = 'SECURITY';        Required = $false }
)

Write-Host "`n📄 جودة التوثيق:" -ForegroundColor Cyan
$score = 0; $total = $docChecks.Count
foreach ($check in $docChecks) {
    $exists = Test-Path $check.File
    $icon = if ($exists) { $score++; "✅" } elseif ($check.Required) { "🔴" } else { "⚪" }
    $req = if ($check.Required) { "(مطلوب)" } else { "(اختياري)" }
    Write-Host "  $icon $($check.Label) $req"
}
Write-Host "`n  النتيجة: $score / $total"
```

### فحص جودة README
```powershell
if (Test-Path README.md) {
    $readme = Get-Content README.md -Raw
    $checks = @(
        @{ Pattern = '(?i)## (install|setup|getting started)'; Label = 'تعليمات التثبيت' },
        @{ Pattern = '(?i)## (usage|how to|example)';          Label = 'أمثلة الاستخدام' },
        @{ Pattern = '(?i)## (license|licence)';               Label = 'الرخصة' },
        @{ Pattern = '\!\[';                                    Label = 'صور/لقطات' },
        @{ Pattern = '```';                                     Label = 'أمثلة كود' },
        @{ Pattern = '(?i)(badge|shield)';                      Label = 'Badges' }
    )
    Write-Host "`n  محتوى README:" -ForegroundColor Gray
    foreach ($c in $checks) {
        $found = $readme -match $c.Pattern
        $icon = if ($found) { "✅" } else { "⚠️" }
        Write-Host "    $icon $($c.Label)"
    }
}
```

---

### المحور 4: الأمان 🔐

```powershell
Write-Host "`n🔐 فحص أمني:" -ForegroundColor Cyan

# 1. ملفات .env مكشوفة
$envFiles = Get-ChildItem -Recurse -File -Filter ".env" -Exclude node_modules,*.git*
if ($envFiles) {
    Write-Host "  🔴 ملفات .env مكشوفة:" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "     $($_.FullName)" }
} else {
    Write-Host "  ✅ لا ملفات .env مكشوفة" -ForegroundColor Green
}

# 2. .gitignore يحمي .env
if (Test-Path .gitignore) {
    $gi = Get-Content .gitignore -Raw
    if ($gi -match '\.env') {
        Write-Host "  ✅ .gitignore يحمي .env" -ForegroundColor Green
    } else {
        Write-Host "  🔴 .gitignore لا يحمي .env!" -ForegroundColor Red
    }
}

# 3. بحث عن Secrets في الكود
$secretPatterns = @(
    @{ Pattern = 'password\s*[:=]\s*["\x27][^"\x27]{3,}'; Label = 'Password' },
    @{ Pattern = 'api[_-]?key\s*[:=]\s*["\x27][^"\x27]{8,}'; Label = 'API Key' },
    @{ Pattern = '-----BEGIN.*PRIVATE KEY-----'; Label = 'Private Key' },
    @{ Pattern = 'ghp_[a-zA-Z0-9]{36}'; Label = 'GitHub Token' },
    @{ Pattern = 'sk-[a-zA-Z0-9]{20,}'; Label = 'Secret Key' }
)

foreach ($sp in $secretPatterns) {
    $hits = Get-ChildItem -Recurse -File -Exclude *.exe,*.dll,*.png,*.jpg,node_modules,*.git* |
        Select-String -Pattern $sp.Pattern -List -ErrorAction SilentlyContinue
    if ($hits) {
        Write-Host "  🔴 $($sp.Label) وُجد في: $($hits.Path -join ', ')" -ForegroundColor Red
    }
}
```

---

### المحور 5: التبعيات 📦

```powershell
Write-Host "`n📦 تحليل التبعيات:" -ForegroundColor Cyan

# Node.js
if (Test-Path package.json) {
    $pkg = Get-Content package.json | ConvertFrom-Json
    $deps = ($pkg.dependencies.PSObject.Properties | Measure-Object).Count
    $devDeps = ($pkg.devDependencies.PSObject.Properties | Measure-Object).Count
    Write-Host "  Node.js: $deps deps + $devDeps devDeps"
    
    if (Test-Path package-lock.json) {
        Write-Host "  ✅ package-lock.json موجود" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ لا يوجد lock file" -ForegroundColor Yellow
    }
    
    # فحص outdated
    Write-Host "  جارٍ فحص التحديثات..."
    npm outdated --json 2>$null | ConvertFrom-Json | ForEach-Object {
        $_.PSObject.Properties | ForEach-Object {
            Write-Host "    ⚠️ $($_.Name): $($_.Value.current) → $($_.Value.latest)"
        }
    }
}

# Python
if (Test-Path requirements.txt) {
    $pyDeps = (Get-Content requirements.txt | Where-Object { $_ -and $_ -notmatch '^\s*#' }).Count
    Write-Host "  Python: $pyDeps dependencies"
}

# Dart/Flutter
if (Test-Path pubspec.yaml) {
    Write-Host "  Flutter/Dart: pubspec.yaml found"
    # Count dependencies
    $pubspec = Get-Content pubspec.yaml -Raw
    $dartDeps = ([regex]::Matches($pubspec, '(?m)^  \w+:')).Count
    Write-Host "  Dart: ~$dartDeps dependencies"
}
```

---

### المحور 6: تقرير صحة شامل 📊

```powershell
# الوظيفة الرئيسية — تجمع كل التحاليل
function Get-RepoHealthReport {
    $report = @{
        CodeStructure    = @{ Score = 0; Max = 25; Issues = @() }
        TestCoverage     = @{ Score = 0; Max = 25; Issues = @() }
        Documentation    = @{ Score = 0; Max = 25; Issues = @() }
        Security         = @{ Score = 0; Max = 25; Issues = @() }
    }
    
    # حساب النتائج...
    $totalScore = $report.Values | ForEach-Object { $_.Score } | Measure-Object -Sum | Select-Object -ExpandProperty Sum
    $totalMax = 100
    
    Write-Host "`n" + "=" * 50
    Write-Host "📊 تقرير صحة المستودع" -ForegroundColor Cyan
    Write-Host "=" * 50
    Write-Host "`n  النتيجة الإجمالية: $totalScore / $totalMax"
    
    if ($totalScore -ge 80) {
        Write-Host "  🏆 ممتاز — المستودع جاهز للإنتاج" -ForegroundColor Green
    } elseif ($totalScore -ge 60) {
        Write-Host "  ✅ جيد — بعض التحسينات مطلوبة" -ForegroundColor Green
    } elseif ($totalScore -ge 40) {
        Write-Host "  ⚠️ متوسط — يحتاج عملاً" -ForegroundColor Yellow
    } else {
        Write-Host "  🔴 ضعيف — يحتاج إصلاحات جوهرية" -ForegroundColor Red
    }
}
```

---

## تقرير الصحة — القالب النهائي

عند تحليل مستودع، قدم التقرير بهذا الشكل:

```
╔══════════════════════════════════════════╗
║          📊 تقرير صحة المستودع          ║
╠══════════════════════════════════════════╣
║                                          ║
║  📏 بنية الكود        ██████████░  85%   ║
║  🧪 تغطية الاختبارات  ████░░░░░░░  35%   ║
║  📄 جودة التوثيق      ████████░░░  75%   ║
║  🔐 الأمان            █████████░░  90%   ║
║  📦 التبعيات          ███████░░░░  65%   ║
║                                          ║
║  🏆 النتيجة الإجمالية: 70/100            ║
║  📌 الحالة: ✅ جيد                       ║
║                                          ║
╠══════════════════════════════════════════╣
║  🔴 إجراءات مطلوبة:                     ║
║  1. إضافة اختبارات للمكونات الرئيسية    ║
║  2. تحديث 3 تبعيات قديمة                ║
║  3. إضافة CONTRIBUTING.md               ║
╚══════════════════════════════════════════╝
```

---

## التكامل مع المهارات الأخرى

| المهارة | كيف تتكامل |
| :--- | :--- |
| **`github-workflow-master`** | إنشاء Issues للمشاكل المكتشفة تلقائياً |
| **`github-publisher-pro`** | توليد الملفات الناقصة (README, LICENSE, .gitignore) |
| **`real-machine-verifier`** | اختبار حقيقي للتحقق من عمل المشروع |
| **`coderabbit`** | مراجعة كود AI على التحسينات المقترحة |

> [!TIP]
> شغّل هذا التحليل بشكل دوري (مثلاً قبل كل release) لضمان جودة مستمرة!
