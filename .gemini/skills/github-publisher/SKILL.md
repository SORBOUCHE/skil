---
name: github-publisher
description: Prompts to save and publish completed projects, tools, or scripts to GitHub with automated .gitignore, README, and safe secret screening.
---

# GitHub Publisher & Project Preservation Skill

## Overview
This skill operationalizes the mandatory completion protocol: whenever the agent finishes creating or modifying an application, script, package, or tool, it **must proactively offer to preserve and publish the project to GitHub**.

---

## When to Activate
Activate this skill whenever:
- A new project, application, utility, web app, or script has been successfully created and verified.
- The user declares a milestone or task complete: "Done", "It works", "Finished", or all items in `TASKS.md` are marked `[x]`.
- The user requests: "save to github", "upload to github", "ارفع على قيت هب", "احفظ المشروع".

---

## The Mandatory Completion Offer Protocol

Upon finishing the core engineering task, **always conclude the turn with the interactive GitHub Preservation Offer**:

```markdown
---
### 📦 طلب حفظ وتوثيق المشروع على GitHub
🎉 **تم اكتمال بناء واختبار الأداة/البرنامج بنجاح!**
لحماية عملك وتوثيقه، هل ترغب في إنشاء مستودع جديد ورفع المشروع إلى **GitHub**؟

- **اسم المستودع المقترح:** `<suggested-repo-name>`
- **نوع المستودع:** `Private` (خاص - موصى به) أو `Public` (عام)
- **خيارات الرفع المتاحة:**
  1. الرفع المباشر عبر **GitHub REST API** (يتطلب توفير `GITHUB_TOKEN`).
  2. الرفع عبر أداة **Git CLI** (إذا كانت مثبتة على جهازك).
  3. تأجيل الرفع والاحتفاظ بالكود محلياً فقط.
---
```

---

## Pre-Publish Safety Screen (Automatic)
Before any code is pushed to GitHub, execute the safety check:
```bash
node "scripts/publish-to-github.js" <projectPath> --prepare
```
This guarantees:
1. An exhaustive `.gitignore` is generated preventing `.env`, `node_modules`, and binaries from ever being tracked.
2. Code is scanned for accidental hardcoded credentials, JWTs, or private keys.
3. A foundational `README.md` is present to describe the project.

---

## Publication Methods

### Method 1: GitHub REST API (Zero Local Git Dependency)
If `git.exe` is not installed on the system, upload directly via GitHub API:
1. Create repo:
   ```http
   POST https://api.github.com/user/repos
   Authorization: Bearer <GITHUB_TOKEN>
   { "name": "<repo-name>", "private": true, "description": "<description>" }
   ```
2. Commit files via Git Trees API (`POST /repos/{owner}/{repo}/git/trees`) or Contents API.

### Method 2: Git CLI
If `git` is available:
```bash
git init
git add .
git commit -m "feat: initial release"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```
