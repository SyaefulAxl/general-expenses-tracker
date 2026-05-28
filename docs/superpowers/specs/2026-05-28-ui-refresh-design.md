# UI Refresh & Refactor — Design Spec

**Date:** 2026-05-28
**Author:** Syaeful + Claude (Opus 4.7)
**Status:** Approved 2026-05-28 by Syaeful — proceed to plan

## Goal

Bring the General Expenses Tracker frontend (`https://thai.expenses.syaefulaz.my.id/`) to a "modern fintech minimal" aesthetic — Mercury / Brex / Linear-money — while consolidating CSS tokens, removing inline-hex coloring, splitting the three oversized components, and fixing the mobile login overflow.

Non-goals: dark mode, navigation/IA changes, new features.

**Added scope from approval message (2026-05-28):**
- Craft bar: world-class — every detail (focus states, motion, micro-copy, alignment, money formatting) should hold up to comparison with Mercury/Brex/Linear-money.
- Functional QA: every route + every CRUD action must be exercised end-to-end against the live backend with a real login. Bugs found get fixed in-scope.
- Backend logic audit: parallel pass on the Java backend — pagination, soft-delete semantics, repayment math, settlement transitions, role checks, error responses — anything that's wrong gets fixed in-scope.

## Direction (locked)

| Decision | Choice |
|---|---|
| Aesthetic | Modern fintech minimal (Mercury/Brex/Linear-money) |
| Scope | Visual + layout polish, keep current routes/sidebar |
| Refactor | Tokens + split giants (no new tests this round) |
| Brand | Indigo `#2563eb` accent, light theme only |
| Money type | Mono — JetBrains Mono / `ui-monospace` fallback |
| Approach | Token-first, then vertical slices, then component splits |

## Visual System

### Color tokens (final)

| Token | Value | Use |
|---|---|---|
| `--accent` | `#2563eb` | Brand, primary buttons, active nav, links |
| `--accent-hover` | `#1d4ed8` | Hover state for above |
| `--accent-soft` | `#eff6ff` | Subtle backgrounds, selected rows |
| `--surface` | `#ffffff` | Cards, modals, inputs |
| `--surface-muted` | `#f8fafc` | Page background, hover rows |
| `--surface-sunken` | `#f1f5f9` | Inner wells, code, dividers-as-bands |
| `--border` | `#e5e7eb` | All borders (single token, not 4 variants) |
| `--border-strong` | `#d1d5db` | Focus rings, hovered borders |
| `--text` | `#0f172a` | Body |
| `--text-muted` | `#475569` | Secondary labels |
| `--text-subtle` | `#64748b` | Tertiary, captions, meta |
| `--text-faint` | `#94a3b8` | Disabled, placeholder |
| `--success` | `#059669` | Approved, +money, owed-to-me |
| `--success-soft` | `#f0fdf4` | |
| `--warning` | `#d97706` | Pending |
| `--warning-soft` | `#fffbeb` | |
| `--danger` | `#dc2626` | Rejected, deleted, -money |
| `--danger-soft` | `#fef2f2` | |
| `--info` | `#0891b2` | Loans informational |
| `--info-soft` | `#ecfeff` | |

All `--bg-*`, `--text-NNN`, `--primary*`, `--success-light`, etc. legacy aliases will be **deleted** from `styles.css`. The single source of truth is the table above.

### Typography

- Body: `Inter` (already loaded) — keep weights 400/500/600/700/800.
- Money / numerics: `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`.
  - Applied via a `.num` utility class, used wherever a THB/USD/IDR amount renders.
  - Tabular alignment so columns of amounts in tables line up.
- Sizes (rem):
  - `--fs-xs: 0.72rem` — captions, meta, status badges
  - `--fs-sm: 0.85rem` — body small, table cells
  - `--fs-base: 0.95rem` — default body
  - `--fs-lg: 1.05rem` — card titles
  - `--fs-xl: 1.6rem` — page titles
  - `--fs-2xl: 2.4rem` — hero amount on dashboard (e.g. KPI big number)

### Spacing

Stick with Tailwind defaults (4px scale). Tighten cramped areas (KPI cards, login chips) with `gap-2 / p-3` instead of larger values. Document a `--space-section: 28px` token for between-section gaps.

### Radius / shadow

- `--radius-sm: 6px` (chips, small badges)
- `--radius: 10px` (buttons, inputs, cards)
- `--radius-lg: 16px` (modals, drawer)
- Shadows kept at current 4-tier scale (`sm/md/lg`) — already balanced.

### Iconography

- Drop all emoji used as UI chrome (KPI card icons 💰 👥 📋 ⏳, `💱 Live Rates`, sidebar bullets) and replace with PrimeIcons or Lucide-style stroked SVGs.
- Keep emoji **only where they encode user intent**:
  - The trip badge "🇹🇭 Thailand Trip" — it's a flag, deliberate.
  - Category icons in expense breakdown — but switch to a Map<Category, IconName> using PrimeIcons (`pi pi-car`, `pi pi-shopping-bag`, etc.) instead of emoji glyphs.

### Numbers display

- Amounts get the `.num` class (mono, tabular).
- Negative amounts: leading `−` (minus sign, not hyphen) + red (`--danger`).
- Positive deltas: leading `+` + green (`--success`).
- Three-currency display: primary THB on its own line, then `$ USD · Rp IDR` muted on a secondary line — current pattern is fine.

## Layout / Polish per Route

### Login (`/login`)
- **Bug fix:** quick sign-in chips clip on mobile — set `flex-wrap` and `min-width: 0` on the chip container, or stack vertically below 640px.
- Drop the emoji bullets on the feature list ("✅ Track expenses…") → use a small indigo dot or a PrimeIcon.
- Left panel: tighten vertical rhythm. The three rate/balance chips in the hero look cramped; either drop them entirely (the rate bar lives on the dashboard) or stack to one per row at narrow widths.
- Keep quick-sign-in for dev convenience but make sure each chip fits inside the viewport at 390px wide.

### Dashboard
- Replace the four emoji KPI icons with PrimeIcons in indigo-soft circles.
- "💱 Live Rates" → text `Today's rates` + three pills, no emoji.
- Trip badge stays as-is (it's decorative).
- Net Position card: pull it up into a single full-width strip at the top under the KPI grid, since it's the most "answer-the-question" surface.

### Expenses (list + form)
- Replace inline `[style.color]="..."` hex strings with classes (`text-success`, `text-warning`, etc.).
- Filter bar: align widths; pad consistently with `gap-3 / py-2`.
- Status badge: keep, switch to token-driven colors.
- Empty state: use the existing `app-empty-state` component (it exists in shared/).

### Loans
- Same token sweep as expenses.
- "Owed to me / I owe" split panels — current 2-up grid is fine, just retire inline hex.

### History
- Heavy component. Group filters into a row, keep timeline list. Token sweep.

### Admin
- Token sweep. Keep current structure.

## Refactor Plan

### CSS tokens
1. Rewrite `src/styles.css` `:root` block to the table above.
2. Grep all source for legacy aliases (`--bg-page`, `--text-900`, `--primary`, `--primary-hover`, `--primary-light`, `--success-light`, etc.) and replace with the new names. Single mechanical pass.
3. Grep all templates for inline `style="color:#..."`, `[style.color]="..."`, `[style.background]="..."` and replace with utility classes that reference tokens. Where the color is *data-driven* (e.g. category chip background), keep it but read the value from a `categoryStyle()` function rather than a literal hex.

### Component splits

Each of the three giant files becomes a folder of sub-components:

**`features/expenses/`** (was 817 lines)
- `expenses.component.ts` (page shell, ~200 lines — filters + signals + layout)
- `expense-list.component.ts` (table + row, ~250 lines)
- `expense-form.component.ts` (modal form + validation, ~250 lines)
- `expense-filters.component.ts` (filter bar, ~80 lines)

**`features/history/`** (was 877 lines)
- `history.component.ts` (page shell, ~250 lines)
- `history-timeline.component.ts` (the grouped-by-date timeline, ~300 lines)
- `history-detail.component.ts` (right-side detail panel, ~200 lines)
- `history-filters.component.ts` (~80 lines)

**`features/admin/`** (was 590 lines)
- `admin.component.ts` (page shell, ~150 lines)
- `admin-users-table.component.ts` (~250 lines)
- `admin-user-form.component.ts` (~150 lines)

All children are `standalone`, take their data via `@Input()` or via a parent-scoped signal store, and emit changes via `@Output()`. No new services for this refactor.

### TypeScript cleanup
- One `any` found in `loans.component.ts` — replace with a concrete type.
- Fix the NG8102 warning at `history.component.ts:253` (unnecessary `??` on a non-nullable).

## Anti-scope (explicitly out)

- Dark mode (deferred; user picked light-only).
- Net-new feature work beyond bug-fixes that surface during QA.
- Navigation/IA changes.
- Test coverage (no new unit/e2e tests this round).
- Accessibility audit (basic contrast/focus only, no full WCAG sweep).
- Performance work beyond what falls out of refactor.
- i18n.

## Risks

| Risk | Mitigation |
|---|---|
| Token rename misses a use site → broken color | Grep before delete; verify each route in browser after the sweep. |
| Component split breaks state-sharing between filter + list | Use Angular signals at the parent and pass via Input — same pattern the existing code uses inline. |
| Inline hex removal breaks data-driven category colors | Keep the data-driven coloring via a typed `categoryStyle()` function; don't hardcode. |
| Bundle size grows from JetBrains Mono | Subset to just digits + `.,$฿Rp +−` (a 4-6kB woff2). |
| Mobile overflow fix exposes other mobile layout bugs | Run the live mobile screenshot suite at end of each vertical slice. |

## Acceptance

- All routes build cleanly (`ng build --configuration=production`).
- No `[style.color]="..."` or `[style.background]="..."` with literal hex strings in templates.
- No legacy CSS aliases left in `styles.css`.
- `expenses.component.ts`, `history.component.ts`, `admin.component.ts` each ≤ 300 lines.
- Login mobile no longer clips quick-sign-in chips at 390x844.
- All three KPI emoji icons replaced with PrimeIcons.
- Live site updated and visually verified at the 1440x900 + 390x844 viewports.
- One squash-mergeable commit (or a tidy stack) on `main`.

## Order of operations

1. **Token sweep** — rewrite `styles.css`, mechanical replacement of legacy aliases, add `.num` utility, swap KPI emoji for PrimeIcons. *One commit.*
2. **Login mobile fix + emoji removal** — fix overflow, drop feature-list emoji, kill data-leaking user-balance chips from the public screen. *One commit.*
3. **Inline hex sweep** — replace all `[style.color]="#..."` with class-or-token. *One commit.*
4. **Dashboard polish** — net-position strip, icon swap, numerics. *One commit.*
5. **Expenses split** — extract `expense-list / expense-form / expense-filters`. *One commit.*
6. **History split** — extract `history-timeline / history-detail / history-filters`. *One commit.*
7. **Admin split** — extract `admin-users-table / admin-user-form`. *One commit.*
8. **TS cleanup** — kill the `any`, fix NG8102. *One commit.*
9. **Build + deploy** — `ng build`, copy to dist, reload nginx if needed. Visual QA.
10. **Push to origin.**

Each commit must build cleanly before moving on.
