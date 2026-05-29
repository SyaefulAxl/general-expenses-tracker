# Design — Migrate General Expenses to the official `sakai-ng` shell

**Date:** 2026-05-29
**Status:** Approved (design), pending implementation
**Scope:** Replace the app shell (layout/sidebar/topbar/menu) of the General Expenses Tracker frontend with the official PrimeFaces **sakai-ng** template. Feature pages (Dashboard, Expenses, Loans, History, Admin) are NOT redesigned — only the shell around them.

## Goal
Adopt the authentic Sakai shell + configurator across the whole app, as chosen by the user:
- Port official `sakai-ng` layout files **as-is** (then adapt only where needed to compile).
- **Full default Sakai** look (light Sakai sidebar/topbar, Sakai surfaces, generic wordmark) — the old `฿`/blue/dark-navy identity is dropped.
- Include the Sakai **configurator** (menu mode, primary/surface presets, dark toggle, ripple).
- Default menu mode **overlay/slim** capable (configurable), not the old always-static-only sidebar.

## Compatibility (low risk)
`sakai-ng` master stack matches GE exactly: Angular ^21, PrimeNG ^21, Tailwind v4, `tailwindcss-primeui` 0.6.1, primeicons 7. So ported components should compile with minimal API rework. Source cloned to `/tmp/sakai-ng`.

## What we port (from `/tmp/sakai-ng`)
- `src/app/layout/component/`: `app.layout.ts`, `app.topbar.ts`, `app.sidebar.ts`, `app.menu.ts`, `app.menuitem.ts`, `app.footer.ts`, `app.configurator.ts`, `app.floatingconfigurator.ts`
- `src/app/layout/service/layout.service.ts` (signals: `layoutConfig` {preset, primary, surface, darkTheme, menuMode}, `layoutState`, dark-mode transition)
- Sakai layout styling from `src/assets/styles.scss` (+ tailwind setup) → merged into GE `src/styles.css`/assets without dropping GE feature-page tokens.
- Sakai theme wiring from `src/app.config.ts` (Aura preset + `definePreset`, surface/primary palettes).

Place ported layout under GE `src/app/layout/...` following Sakai's structure.

## Wiring into GE (integration contract)
1. **Routing** (`app.routes.ts`) → Sakai pattern:
   - Parent route renders `AppLayout` and is `canActivate: [authGuard]`; children: `dashboard`, `expenses`, `loans`, `history`, `admin` (lazy `loadComponent`, unchanged).
   - `login` route stays standalone, OUTSIDE the layout.
   - `''` → redirect `dashboard`; `**` → redirect `dashboard`.
2. **`app.ts`** becomes thin — just `<router-outlet/>` (the layout is now a routed component). The old inline topbar/shell logic is removed.
3. **Menu model** (`app.menu.ts`): `Dashboard` (pi-home, /dashboard), `Pengeluaran` (pi-wallet, /expenses), `Pinjaman` (pi-credit-card, /loans), `Riwayat` (pi-clock, /history), `Admin` (pi-users, /admin — shown only when `AuthService.currentUser()?.role === 'ADMIN'`). Indonesian labels, `routerLink`.
4. **Topbar** (`app.topbar.ts`): keep Sakai layout; wire the user area to `AuthService.currentUser` (name + role), add **Logout** (`AuthService.logout()` → `/login`). Keep the configurator + dark toggle buttons.
5. **Dark-mode bridge (critical):** GE feature pages style off `:root.dark` on `<html>`, and PrimeNG `darkModeSelector` is already `.dark`. Sakai's `LayoutService.toggleDarkMode()` toggles `.app-dark`. → Change Sakai's toggle to add/remove **`.dark`** on `<html>` (and keep PrimeNG `darkModeSelector: '.dark'`), so the Sakai shell AND GE feature-page tokens flip together. Persist the choice (reuse `localStorage 'gen_expenses_theme'`; seed `layoutConfig.darkTheme` from it on init).
6. **Theme/app.config:** merge Sakai's `providePrimeNG` (Aura `definePreset` + primary/surface palette application) with GE's existing options (`prefix 'p'`, `cssLayer` order `tailwind-base, primeng, tailwind-utilities`, ripple). Keep the global PrimeNG component styling added earlier (datepicker/select/etc.) — it complements Sakai.
7. **Branding:** full-default Sakai — a neutral Sakai-style logo/wordmark "Expenses". Drop the `฿`/navy brand.

## Feature pages — UNCHANGED
`features/{dashboard,expenses,loans,history,admin,login}` and `shared/components/*` (except the retired shell) are not edited. They render in the layout content outlet and keep their GE token styling (neutral surfaces), which sits fine inside the Sakai shell. The Expenses rebuild from earlier is preserved.

## Retire / cleanup
- Remove/retire the old shell: the inline shell + topbar in `app.ts`, and `shared/components/sidebar/sidebar.component.ts` + `shared/components/topbar/topbar.component.ts` IF unused after the swap (verify no other importers first; the dashboard/etc. import their own pieces, not these — confirm).
- Keep `loading.component`, `avatar`, `status-badge`, `kpi-card`, `empty-state`, `progress-bar` (used by feature pages).

## Risks & mitigations
- **Dark-mode token mismatch** (`.app-dark` vs `.dark`) → explicit bridge in LayoutService (item 5). Verify both shell + a feature page flip.
- **Configurator changes primary** recolors PrimeNG but not GE `--accent` (feature CSS) → optional: in the primary-change handler, also set `--accent`/`--accent-hover`/`--accent-soft` to the chosen palette so pages stay in sync (nice-to-have; note if skipped).
- **cssLayer / Tailwind ordering** — same stack as GE, but verify the merged `styles.css` keeps GE tokens + Sakai layout styles without layer conflicts.
- **Routing/auth regressions** — confirm guard still protects children, login still works, logout returns to /login, deep links to each page render inside the shell.
- **Old shell removal** — confirm no dangling imports before deleting.

## Verification & deploy
- `npx ng build --configuration=production` to a throwaway path; iterate until clean (no TS/template errors; budget warnings ok). No `any`.
- Manual check list (headless browser is blocked in this env): build clean + code review of routing/auth/dark-mode/menu/feature-page-intact. User reviews live.
- Deploy via the standard reversible swap (build → `browser.new` → swap → keep `browser.old.<ts>` backup); verify HTTP 200 + served bundle. Hard-refresh note (index.html cached).
- Rollback = swap the backup dir back.

## Out of scope
- Redesigning feature-page internals (done previously for Expenses).
- Binding every GE token to the configurator (only `--accent` sync considered, optional).
- Backend / data changes (app is mock-data driven).
