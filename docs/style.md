# STYLE.md — Digitraffic Showcase Design System

This document is the single source of truth for all UI decisions. Follow it precisely when generating any component, page, or layout. Do not deviate unless the user explicitly overrides a rule.

---

## 1. Design Philosophy

**Minimalist, functional, Scandinavian.** The site is a developer showcase for Finland's national transport data platform. Every pixel should feel intentional, calm, and trustworthy.

Core principles:
- **Restraint over decoration.** If an element doesn't serve a clear purpose, remove it.
- **Content is the hero.** Data visualizations, code blocks, and live API responses — not chrome.
- **Rounded and soft.** Rounded corners everywhere. No sharp edges. No hard shadows.
- **Thin borders over fills.** Prefer `1px` borders to colored backgrounds for separation.
- **Whitespace is a feature.** Generous padding and margins. Let elements breathe.

---

## 2. Color System — Radix Colors

### 2.1 Core Palette

All colors come from **Radix UI Colors** (https://www.radix-ui.com/colors). Use the CSS variable names or the hex values below. Never invent custom colors.

#### Primary Accent: Cyan

| Step | Light | Dark | Usage |
|------|-------|------|-------|
| 1 | `#fafdfe` | `#0b161a` | Page background |
| 2 | `#f2fafb` | `#101b20` | Subtle background |
| 3 | `#def7f9` | `#082c36` | UI element bg |
| 4 | `#caf1f6` | `#003848` | Hovered UI element bg |
| 5 | `#b5e9f0` | `#004558` | Active / selected bg |
| 6 | `#9ddde7` | `#045468` | Subtle border, separator |
| 7 | `#7dcedc` | `#12677e` | Border on UI element |
| 8 | `#3db9cf` | `#11809c` | Focus ring, strong border |
| 9 | `#00a2c7` | `#00a2c7` | **Solid bg: buttons, links, badges** |
| 10 | `#0797b9` | `#23afd0` | Hovered solid bg |
| 11 | `#107d98` | `#4ccce6` | Low-contrast text |
| 12 | `#0d3c48` | `#b6ecf7` | High-contrast text |

#### Neutral: Slate

| Step | Light | Dark | Usage |
|------|-------|------|-------|
| 1 | `#fcfcfd` | `#111113` | App background |
| 2 | `#f9f9fb` | `#18191b` | Card / panel background |
| 3 | `#f0f0f3` | `#212225` | Component bg |
| 4 | `#e8e8ec` | `#272a2d` | Hovered component bg |
| 5 | `#e0e1e6` | `#2e3135` | Active component bg |
| 6 | `#d9d9e0` | `#363a3f` | **Thin borders** (primary border color) |
| 7 | `#cdced6` | `#43484e` | Interactive borders |
| 8 | `#b9bbc6` | `#5a6169` | Focus ring alt |
| 9 | `#8b8d98` | `#696e77` | Placeholder text |
| 10 | `#80838d` | `#777b84` | — |
| 11 | `#60646c` | `#b0b4ba` | **Secondary text** |
| 12 | `#1c2024` | `#edeef0` | **Primary text** |

### 2.2 Domain Accent Colors

Each Digitraffic domain has a dedicated accent color from Radix. Use these for tags, icons, badges, and section headers when distinguishing between transport modes.

| Domain | Color | Step 9 (Light) | Step 9 (Dark) | Step 11 (Light text) |
|--------|-------|----------------|---------------|----------------------|
| Rail | **Blue** | `#0090ff` | `#0090ff` | `#0d74ce` |
| Road | **Amber** | `#ffc53d` | `#ffc53d` | `#ab6400` |
| Marine | **Teal** | `#12a594` | `#12a594` | `#008573` |

#### Semantic Colors

| Meaning | Color | Step 9 (Light) | Step 11 (Light text) |
|---------|-------|----------------|----------------------|
| Success | Green | `#30a46c` | `#218358` |
| Error | Red | `#e5484d` | `#ce2c31` |
| Warning | Amber | `#ffc53d` | `#ab6400` |
| Info | Cyan | `#00a2c7` | `#107d98` |

### 2.3 CSS Variables Setup

```css
:root {
  /* Backgrounds */
  --bg-page: #fcfcfd;          /* slate-1 */
  --bg-surface: #f9f9fb;       /* slate-2 */
  --bg-component: #f0f0f3;     /* slate-3 */
  --bg-component-hover: #e8e8ec; /* slate-4 */
  --bg-component-active: #e0e1e6; /* slate-5 */

  /* Borders */
  --border-subtle: #d9d9e0;    /* slate-6 */
  --border-element: #cdced6;   /* slate-7 */
  --border-focus: #3db9cf;     /* cyan-8 */

  /* Text */
  --text-primary: #1c2024;     /* slate-12 */
  --text-secondary: #60646c;   /* slate-11 */
  --text-tertiary: #8b8d98;    /* slate-9 */

  /* Accent */
  --accent-solid: #00a2c7;     /* cyan-9 */
  --accent-solid-hover: #0797b9; /* cyan-10 */
  --accent-text: #107d98;      /* cyan-11 */
  --accent-text-contrast: #0d3c48; /* cyan-12 */
  --accent-bg: #def7f9;        /* cyan-3 */
  --accent-bg-hover: #caf1f6;  /* cyan-4 */
  --accent-border: #9ddde7;    /* cyan-6 */

  /* Domain accents */
  --rail-solid: #0090ff;       /* blue-9 */
  --rail-text: #0d74ce;        /* blue-11 */
  --rail-bg: #e6f4fe;          /* blue-3 */
  --road-solid: #ffc53d;       /* amber-9 */
  --road-text: #ab6400;        /* amber-11 */
  --road-bg: #fff7c2;          /* amber-3 */
  --marine-solid: #12a594;     /* teal-9 */
  --marine-text: #008573;      /* teal-11 */
  --marine-bg: #e0f8f3;        /* teal-3 */

  /* Semantic */
  --success: #30a46c;          /* green-9 */
  --error: #e5484d;            /* red-9 */
  --warning: #ffc53d;          /* amber-9 */

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadows — very subtle, no hard edges */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* Dark mode */
.dark, [data-theme="dark"] {
  --bg-page: #111113;          /* slate-1 dark */
  --bg-surface: #18191b;       /* slate-2 dark */
  --bg-component: #212225;     /* slate-3 dark */
  --bg-component-hover: #272a2d; /* slate-4 dark */
  --bg-component-active: #2e3135; /* slate-5 dark */

  --border-subtle: #363a3f;    /* slate-6 dark */
  --border-element: #43484e;   /* slate-7 dark */
  --border-focus: #11809c;     /* cyan-8 dark */

  --text-primary: #edeef0;     /* slate-12 dark */
  --text-secondary: #b0b4ba;   /* slate-11 dark */
  --text-tertiary: #696e77;    /* slate-9 dark */

  --accent-solid: #00a2c7;     /* cyan-9 (same in dark) */
  --accent-solid-hover: #23afd0; /* cyan-10 dark */
  --accent-text: #4ccce6;      /* cyan-11 dark */
  --accent-text-contrast: #b6ecf7; /* cyan-12 dark */
  --accent-bg: #082c36;        /* cyan-3 dark */
  --accent-bg-hover: #003848;  /* cyan-4 dark */
  --accent-border: #045468;    /* cyan-6 dark */

  --rail-solid: #0090ff;
  --rail-text: #70b8ff;        /* blue-11 dark */
  --rail-bg: #0d2847;          /* blue-3 dark */
  --road-solid: #ffc53d;
  --road-text: #ffca16;        /* amber-11 dark */
  --road-bg: #302008;          /* amber-3 dark */
  --marine-solid: #12a594;
  --marine-text: #0bd8b6;      /* teal-11 dark */
  --marine-bg: #0d2d2a;        /* teal-3 dark */

  --success: #30a46c;
  --error: #e5484d;
  --warning: #ffc53d;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4);
}
```

### 2.4 Color Rules

- **NEVER** use raw hex values in components. Always reference CSS variables.
- **NEVER** use opacity/alpha to create border or background shades. Use the correct Radix step.
- The page background is `--bg-page` (slate-1). Cards and panels use `--bg-surface` (slate-2).
- **Borders are always `1px solid var(--border-subtle)`** unless the element is interactive.
- Interactive element borders use `--border-element` (slate-7) on hover.
- Focus rings: `2px solid var(--border-focus)` with `2px` offset.
- **Links and interactive text** use `--accent-text` (cyan-11), not cyan-9.
- **Buttons** use `--accent-solid` (cyan-9) for primary, `--bg-component` (slate-3) for secondary.
- Amber step 9 and 10 require **dark foreground text** (use `--text-primary` or `#1c2024`).
- No gradients. No colored shadows. No glow effects.

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", monospace;
}
```

Load Inter from Google Fonts (`wght@400;500;600`) and JetBrains Mono (`wght@400;500`).

**Why Inter:** It is the industry-standard UI font for developer tools and data-heavy applications. Its tabular figures make numbers in dashboards align perfectly. For this project, Inter is not a cliché — it is the correct, functional choice.

### 3.2 Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 11px | 400 | 16px | Badges, fine print, timestamps |
| `--text-sm` | 13px | 400 | 20px | Secondary text, table cells, captions |
| `--text-base` | 15px | 400 | 24px | Body text, paragraphs |
| `--text-lg` | 17px | 500 | 26px | Card titles, emphasized labels |
| `--text-xl` | 21px | 600 | 28px | Section headings (h3) |
| `--text-2xl` | 27px | 600 | 34px | Page section titles (h2) |
| `--text-3xl` | 35px | 600 | 42px | Page title (h1) |
| `--text-4xl` | 45px | 600 | 52px | Hero headline (rare) |

### 3.3 Typography Rules

- Body text is `--text-base` (15px), color `--text-primary`.
- Secondary/helper text is `--text-sm` (13px), color `--text-secondary`.
- **Headings use weight 600**, not bold (700). Keep them calm.
- Code inline uses `--font-mono`, `--text-sm`, with `--bg-component` background and `--radius-sm` rounding.
- **Never use ALL CAPS** except for tiny labels (≤11px) on badges or status indicators.
- **Letter spacing**: -0.01em on headings ≥21px. 0 on body. +0.02em on uppercase labels.
- **Max line length**: 680px for prose. 100% for data tables and code blocks.
- Numbers in data displays should use `font-variant-numeric: tabular-nums` for alignment.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Based on a 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight inline gaps, icon-text |
| `--space-2` | 8px | Compact padding inside badges, small gaps |
| `--space-3` | 12px | Default gap between related elements |
| `--space-4` | 16px | Card padding (compact), list item gap |
| `--space-5` | 20px | Card padding (standard) |
| `--space-6` | 24px | Section gap, card padding (generous) |
| `--space-8` | 32px | Between cards in a grid |
| `--space-10` | 40px | Between major sections |
| `--space-12` | 48px | Page section vertical spacing |
| `--space-16` | 64px | Hero padding, major vertical breaks |
| `--space-20` | 80px | Top-level page vertical rhythm |

### 4.2 Layout Rules

- **Max content width**: `1200px`, centered with `margin: 0 auto`.
- **Page horizontal padding**: `--space-6` (24px) on mobile, `--space-10` (40px) on desktop.
- **Card grid**: Use CSS Grid with `gap: var(--space-8)`. Default `grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))`.
- **Do not use full-bleed color sections.** Content sits within the max-width container. Separation comes from spacing and thin borders, not colored bands.
- **Vertical rhythm between sections**: `--space-16` (64px) minimum.

### 4.3 Breakpoints

```css
/* Mobile first */
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

- Below `sm`: Single column, tighter padding.
- `sm` to `lg`: 2-column card grid.
- Above `lg`: 3-column card grid, sidebar layouts.

---

## 5. Component Patterns

### 5.1 Cards

The primary content container. Every demo, every data display lives in a card.

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);       /* 16px */
  padding: var(--space-6);               /* 24px */
  transition: border-color 150ms ease;
}

.card:hover {
  border-color: var(--border-element);   /* slate-7: slightly stronger on hover */
}
```

Rules:
- **No drop shadows on cards by default.** The thin border is sufficient.
- On hover, only the border darkens slightly. No scale transforms, no shadow additions.
- If a card is clickable (links to demo), add `cursor: pointer` and the hover border change.
- Card headers: `--text-lg` (17px), weight 500.
- Card descriptions: `--text-sm` (13px), color `--text-secondary`.

### 5.2 Buttons

```css
/* Primary button */
.btn-primary {
  background: var(--accent-solid);
  color: white;
  border: 1px solid transparent;
  border-radius: var(--radius-md);       /* 10px */
  padding: var(--space-2) var(--space-4); /* 8px 16px */
  font-size: var(--text-sm);             /* 13px */
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease;
}
.btn-primary:hover {
  background: var(--accent-solid-hover);
}

/* Secondary / ghost button */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
}
.btn-secondary:hover {
  background: var(--bg-component);
  border-color: var(--border-element);
}
```

Rules:
- **Button radius is `--radius-md` (10px).** Not pill-shaped, not sharp.
- Small buttons (icon-only, table actions): `--radius-sm` (6px), `padding: var(--space-1) var(--space-2)`.
- **Never use both an icon and a long label** in primary buttons. Keep them tight.
- **Disabled buttons**: `opacity: 0.5; cursor: not-allowed;`. No color change.

### 5.3 Badges / Tags

Used for domain labels (Rail, Road, Marine), status indicators, and API method labels.

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);           /* very tight */
  font-size: var(--text-xs);             /* 11px */
  font-weight: 500;
  border-radius: var(--radius-full);     /* pill shape */
  letter-spacing: 0.02em;
}

/* Domain badges */
.badge-rail { background: var(--rail-bg); color: var(--rail-text); }
.badge-road { background: var(--road-bg); color: var(--road-text); }
.badge-marine { background: var(--marine-bg); color: var(--marine-text); }

/* HTTP method badges */
.badge-get { background: var(--accent-bg); color: var(--accent-text); }
.badge-post { background: #e6f6eb; color: #218358; }  /* green-3 / green-11 */
.badge-mqtt { background: #f0f0f3; color: #60646c; }  /* slate-3 / slate-11 */
```

### 5.4 Code Blocks

```css
.code-block {
  background: var(--bg-component);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);       /* 10px */
  padding: var(--space-5);               /* 20px */
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 22px;
  overflow-x: auto;
  color: var(--text-primary);
}

.code-inline {
  background: var(--bg-component);
  border-radius: var(--radius-sm);       /* 6px */
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--accent-text-contrast);
}
```

Rules:
- Use a syntax highlighting theme that matches the palette. Light mode: a neutral theme with cyan/blue/teal for keywords and strings. Dark mode: same hues at higher brightness.
- **No line numbers by default.** Add them only in the full code-view detail page.
- Code blocks inside cards should have a distinct background (`--bg-component` vs card's `--bg-surface`).
- Add a small "Copy" button in the top-right corner of every code block, styled as `btn-secondary` but tiny.

### 5.5 Tables

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--text-sm);
}
.table th {
  text-align: left;
  font-weight: 500;
  color: var(--text-secondary);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}
.table tr:last-child td {
  border-bottom: none;
}
.table tr:hover td {
  background: var(--bg-component);
}
```

Rules:
- **No outer border on tables.** Only horizontal separators between rows.
- Header row is uppercase, `--text-xs`, `--text-secondary` color. Understated.
- Zebra striping: **no**. Use hover highlight instead.
- Wrap tables in a card or give them the same border/radius treatment.

### 5.6 Navigation / Header

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-page);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  background: rgba(252, 252, 253, 0.85);  /* slate-1 with transparency */
}
```

Rules:
- Logo on the left, nav links center or right, theme toggle right.
- Nav links: `--text-sm`, weight 500, color `--text-secondary`. Active: `--text-primary`.
- **No hamburger menu** if possible — collapse to icon-only nav on mobile.
- **Bottom border only.** No shadow on nav.

### 5.7 Inputs / Select / Search

```css
.input {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-primary);
  outline: none;
  transition: border-color 150ms ease;
}
.input:hover {
  border-color: var(--border-element);
}
.input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--accent-bg);
}
.input::placeholder {
  color: var(--text-tertiary);
}
```

### 5.8 Tabs

Used to switch between demo views (e.g., "Preview", "Code", "API Response").

```css
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-subtle);
}
.tab {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;
}
.tab:hover {
  color: var(--text-primary);
}
.tab.active {
  color: var(--text-primary);
  border-bottom-color: var(--accent-solid);
}
```

---

## 6. Iconography

- Use **Lucide icons** (https://lucide.dev). They are 24x24, 1.5px stroke, round line caps — matching the minimalist aesthetic perfectly.
- Default icon size: 16px in buttons and badges, 20px in navigation, 24px in feature callouts.
- Icon color: `currentColor` (inherits from text).
- Domain icons:
  - Rail: `Train` or `TrainFront`
  - Road: `Car` or `Route`
  - Marine: `Ship` or `Anchor`
  - Multi-modal: `Layers` or `LayoutDashboard`
- Status icons:
  - Live/active: `Circle` (filled, green-9)
  - Delayed: `Clock` (amber-9)
  - Error/cancelled: `XCircle` (red-9)

---

## 7. Motion & Transitions

- **Default transition**: `150ms ease` for color, background, border changes.
- **Layout transitions**: `200ms ease-out` for expanding/collapsing panels.
- **Page transitions**: Subtle fade-in on route change, `200ms`.
- **Loading states**: Use a simple CSS pulse animation on skeleton elements:

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.skeleton {
  background: var(--bg-component);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}
```

Rules:
- **No bouncing.** No spring physics. No overshoot.
- **No hover scale transforms** on cards or buttons.
- **No parallax.** No scroll-triggered animations on the main site. Demos may have their own animations.
- **Map markers may animate** (train dots moving, vessel positions updating) — those are data-driven and appropriate.

---

## 8. Maps

Many demos feature maps. Follow these rules:

- Use **Mapbox GL JS** or **Leaflet** with a light, neutral basemap.
- Prefer Mapbox's `light-v11` style or OpenStreetMap's CartoDB Positron tiles.
- Map containers: `border-radius: var(--radius-lg)`, `border: 1px solid var(--border-subtle)`, `overflow: hidden`.
- Map marker colors follow domain accents: blue (rail), amber (road), teal (marine).
- **No 3D tilt** on maps. Keep them flat and functional.
- Attribution must be visible per data license (CC 4.0 Digitraffic/Fintraffic + map tile provider).

---

## 9. Dark Mode

- Default to system preference via `prefers-color-scheme: dark`.
- Provide a manual toggle in the nav (Sun/Moon icon from Lucide).
- Store preference in `localStorage`.
- **All colors use CSS variables.** Switching themes only changes the variable values — no component logic changes.
- Dark mode nav background: `rgba(17, 17, 19, 0.85)` (slate-1 dark with transparency).
- In dark mode, code blocks should use the same `--bg-component` variable, which will resolve to slate-3 dark.

---

## 10. Page Structure

### 10.1 Homepage

```
┌────────────────────────────────────────┐
│  Nav: Logo • Rail • Road • Marine • ☀  │
├────────────────────────────────────────┤
│                                        │
│  Hero: Headline + subtitle + search    │
│  (no image, no illustration)           │
│                                        │
├────────────────────────────────────────┤
│  Filter tabs: All • Rail • Road •      │
│  Marine • Multi-modal                  │
├────────────────────────────────────────┤
│                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Demo    │ │ Demo    │ │ Demo    │  │
│  │ Card 1  │ │ Card 2  │ │ Card 3  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Demo    │ │ Demo    │ │ Demo    │  │
│  │ Card 4  │ │ Card 5  │ │ Card 6  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│  ...                                   │
│                                        │
├────────────────────────────────────────┤
│  Footer: CC 4.0 • Digitraffic •       │
│  GitHub • API Docs                     │
└────────────────────────────────────────┘
```

### 10.2 Demo Detail Page

```
┌────────────────────────────────────────┐
│  Nav                                   │
├────────────────────────────────────────┤
│  ← Back to demos                       │
│                                        │
│  [Rail badge]  Demo Title              │
│  Description paragraph                 │
│                                        │
│  ┌──── Tabs: Preview │ Code │ API ────┐│
│  │                                    ││
│  │  [Live demo / visualization]       ││
│  │                                    ││
│  └────────────────────────────────────┘│
│                                        │
│  ┌─ API Endpoints ───────────────────┐ │
│  │ GET /api/v1/live-trains/station/… │ │
│  │ MQTT train-locations/#            │ │
│  └───────────────────────────────────┘ │
│                                        │
│  ┌─ Code ────────────────────────────┐ │
│  │ ```javascript                     │ │
│  │ const res = await fetch(...)      │ │
│  │ ```                 [Copy]        │ │
│  └───────────────────────────────────┘ │
│                                        │
│  ┌─ Response ────────────────────────┐ │
│  │ { "trainNumber": 71, ... }        │ │
│  └───────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### 10.3 Demo Card Anatomy

```
┌─────────────────────────────────┐
│  [Rail] [MQTT] [Live]          │  ← badges, top-left
│                                 │
│  Live Train Departure Board     │  ← title: --text-lg, weight 500
│  Classic split-flap departure   │  ← description: --text-sm, --text-secondary
│  board for any Finnish station. │
│                                 │
│  GET /api/v1/live-trains/...    │  ← endpoint preview: --font-mono, --text-xs
│                                 │
│  View Demo →                    │  ← link: --accent-text
└─────────────────────────────────┘
```

---

## 11. Do NOT

These are explicit anti-patterns. Avoid at all costs:

- ❌ Gradients (linear, radial, or any kind)
- ❌ Box shadows on cards (use thin borders instead)
- ❌ Colored page section backgrounds (no alternating gray/white bands)
- ❌ Icon backgrounds (colored circles behind icons)
- ❌ Decorative illustrations or hero images
- ❌ Animated gradient text or glowing effects
- ❌ Rounded pill buttons for primary actions (use `--radius-md`)
- ❌ More than 2 font weights on a single page (400 and 500 or 500 and 600)
- ❌ Tooltip overuse — show info inline
- ❌ Modals for content that could be inline or in a panel
- ❌ Sticky sidebars (only the top nav is sticky)
- ❌ Any Radix color below step 6 for borders (too faint)
- ❌ Any Radix color above step 9 for solid backgrounds (too dark, use for text only)
- ❌ Custom colors outside the Radix palette
- ❌ `box-shadow` to simulate borders (use actual `border`)

---

## 12. File & Asset Conventions

- Component files: PascalCase (`DemoCard.tsx`, `TrainMap.tsx`)
- Utility/hook files: camelCase (`useDigitrafficApi.ts`, `formatDelay.ts`)
- CSS: Co-located CSS modules (`DemoCard.module.css`) or Tailwind utility classes
- Images: None in the design system. All visuals are data-driven (maps, charts, camera feeds).
- Favicon: A simple cyan-9 circle or Digitraffic logo mark.

---

## Quick Reference: Copy-Paste Tokens

```css
/* Paste this at the top of any new component file as a reminder */

/* Backgrounds:  --bg-page | --bg-surface | --bg-component */
/* Borders:      --border-subtle (1px) | --border-element (hover) | --border-focus */
/* Text:         --text-primary | --text-secondary | --text-tertiary */
/* Accent:       --accent-solid | --accent-text | --accent-bg */
/* Domain:       --rail-solid/text/bg | --road-solid/text/bg | --marine-solid/text/bg */
/* Radius:       --radius-sm (6) | --radius-md (10) | --radius-lg (16) | --radius-full */
/* Spacing:      --space-1(4) thru --space-20(80) */
/* Fonts:        --font-sans | --font-mono */
```
