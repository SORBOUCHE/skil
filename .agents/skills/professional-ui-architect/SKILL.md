---
name: professional-ui-architect
description: Automatically applies world-class, production-ready, professional UI/UX design standards (Linear/Vercel/Apple aesthetic) for Web (React/Tailwind/shadcn) and Mobile/Desktop (Flutter). Triggers on any request to build, design, or scaffold a UI, web app, site, or application.
---

# Professional UI Architect (معمارية الواجهات الاحترافية الفاخرة)

## Overview
This skill establishes non-negotiable, production-ready, and aesthetic design engineering standards for any user interface built across this workspace — covering both **Web (React/Next.js/Tailwind/shadcn)** and **Mobile/Desktop (Flutter)**.

Whenever the user asks to build, design, scaffold, or update an application, website, screen, or component, **ALWAYS automatically enforce this standard**.

---

## 1. Aesthetic Directives (The Linear / Vercel / Apple Standard)
1. **Deliberate Whitespace:**
   - Avoid dense, overcrowded screens.
   - Use generous, structured spacing: `gap-6`, `space-y-6`, and consistent outer container padding (`p-6` or `p-8`).
2. **Subtle Borders Over Heavy Shadows:**
   - Eliminate heavy, dark drop-shadows.
   - Prefer ultra-thin, low-opacity borders: `border border-border/40` or `border-zinc-200/80` (dark: `border-zinc-800/60`).
   - Use soft backdrop blur for floating headers and cards: `backdrop-blur-md bg-white/70 dark:bg-zinc-950/70`.
3. **Sophisticated Palette (Zero AI Cliché):**
   - Strictly prohibit pure black (`#000000`) text on pure white (`#FFFFFF`) backgrounds. Use refined dark neutrals (`text-zinc-900 dark:text-zinc-100` and muted secondary `text-zinc-600 dark:text-zinc-400`).
   - Base surfaces on cohesive neutral scales (`zinc` or `slate`), illuminated by **one** prominent semantic accent color (e.g., deep violet, emerald, royal blue, or warm amber).
4. **Snappy Micro-interactions:**
   - Interactive elements must respond smoothly: `transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-[0.99]`.

---

## 2. Web Implementation Rules (React / Next.js / Tailwind / shadcn)
1. **shadcn/ui First:**
   - Never write bespoke primitive HTML elements when shadcn components exist (`Button`, `Card`, `Dialog`, `Sheet`, `Table`, `Badge`, `Tabs`, `DropdownMenu`, `Tooltip`).
   - Always merge classes via the `cn()` utility (`className={cn("base", condition && "active", className)}`).
2. **Modular Hierarchy:**
   - Keep files focused and under ~150 lines. Extract reusable sub-widgets into dedicated components.
3. **Mandatory Production States:**
   - Always include realistic states, never static happy-paths only:
     - **Loading State:** Skeleton loaders (`<Skeleton className="h-4 w-full" />`).
     - **Empty State:** Illustrated or clean icon, clear title, descriptive subtitle, and Call-to-Action button.
     - **Error State:** Subtle inline alert or toast with retry mechanism.
4. **Accessibility (a11y):**
   - Visible focus rings (`focus-visible:ring-2 focus-visible:ring-ring`).
   - Semantic tags (`<header>`, `<main>`, `<nav>`, `<aside>`, `<section>`).

---

## 3. Flutter Implementation Rules (Mobile / Desktop)
1. **Zero Overflow Invariant:**
   - Wrap dynamic text or flex elements in `Expanded` or `Flexible` with `overflow: TextOverflow.ellipsis` to guarantee zero `RenderFlex overflowed` stripes.
2. **Adaptive & Responsive Layout:**
   - Always use `LayoutBuilder` to adapt between compact screens (< 600px single column) and wide screens (>= 600px grid / multi-pane layout).
3. **Modern Card & Shape Design:**
   - Flat elevation (`elevation: 0`) paired with subtle custom borders (`Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.5))`).
   - Rounded corners: `BorderRadius.circular(16)` or `BorderRadius.circular(20)`.
   - Typography: GoogleFonts (e.g., Cairo, Tajawal, Inter) with deliberate hierarchy (`w600` for titles, `w400` for body).
4. **Performance:**
   - Extensively apply `const` constructors on all immutable widgets.

---

## 4. Arabization & Bidirectional Isolation (RTL First)
- All Arabized interfaces must support seamless Right-to-Left orientation (`dir="rtl"`, `Directionality(textDirection: TextDirection.rtl)`).
- Preserve Latin names, technical abbreviations, and code snippets inside bidirectional isolation (`unicode-bidi: isolate` / backticks).
- Punctuation must remain anchored to the natural end of Arabic sentences using the RLM marker (`\u200F`).
