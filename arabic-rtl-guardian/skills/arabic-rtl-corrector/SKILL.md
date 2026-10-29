---
name: arabic-rtl-corrector
description: Automatically fixes Arabic text direction (RTL), BiDi text reversals, trailing punctuation jumping, and wraps markdown/artifacts in RTL containers.
---

# Arabic RTL Corrector Skill (مصحح اتجاه وتنسيق الخط العربي)

## Overview
This skill guarantees that all Arabic text, code comments, documentation, and markdown artifacts generated in Antigravity are formatted with strict Bidirectional (BiDi) isolation and Right-to-Left (RTL) alignment, preventing trailing punctuation from jumping to the left and eliminating inverted sentences or brackets.

---

## When to Activate
Activate this skill whenever:
- Arabic sentences appear scrambled, reversed, or hard to read due to embedded English words or symbols.
- Trailing punctuation marks (`.`, `!`, `?`, `؟`, `:`, `)`) jump to the far left of Arabic sentences.
- Brackets enclosing English words invert (e.g., displaying `)API(` instead of `(API)`).
- Generating Markdown files, HTML artifacts, or Generative UI containing Arabic text.
- The user asks: "صلح العربي", "صحح اتجاه الخط", "النص العربي مقلوب", or invokes `/rtl`.

---

## The 4 Golden Rules of Arabic RTL in Antigravity

### 1. Latin & Code Token Isolation (عزل الكلمات اللاتينية)
Never leave English words, variable names, or commands unescaped in an Arabic sentence:
* **Incorrect:** `استخدم الأمر git status لفحص الملفات.`
* **Correct:** `استخدم الأمر \`git status\` لفحص الملفات.`

### 2. Trailing Punctuation Stabilization (تثبيت علامات الترقيم باليمين)
To prevent punctuation from jumping to the left in LTR markdown viewers:
- Keep the punctuation directly attached to the Arabic word without preceding spaces.
- Anchor with the Unicode Right-to-Left Mark (`\u200F` or `&rlm;`):
  `انتهت المعالجة بنجاح!\u200F`

### 3. Parentheses & Brackets Hygiene (حماية الأقواس)
When an English word is inside parentheses in an Arabic sentence, flank it with `\u200F`:
`المشروع يعتمد على معمارية (\u200FAPI\u200F) الحديثة.`

### 4. Artifact & Container Wrapping (تغليف ملفات العرض)
Always wrap Arabic markdown or HTML artifacts in an isolated RTL container:
```html
<div dir="rtl" style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; unicode-bidi: isolate;">

## عنوان توثيقي
- نقطة أولى مع تفاصيل عربية واضحة.
- نقطة ثانية مع مصطلحات معزولة مثل `node:sqlite`.

</div>
```

---

## Automated CLI Saniation
To automatically sanitize and fix any file in the workspace:
```bash
node "scripts/rtl-cli.js" <path/to/file.md> --fix
```
