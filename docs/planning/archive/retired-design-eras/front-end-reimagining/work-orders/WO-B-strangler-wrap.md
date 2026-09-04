# WO-B — Strangler chrome-wrap: one skin for the whole journey

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**WHY.** The seven station routes (`/discover /decide /plan /design /build /ship /learn`) still wear the OLD left-rail `AppShell`, while the room world wears the new top-bar chrome. Walking a journey bounces the user between two skins (founder complaint #3). Rebuilding each station in-room is weeks; wrapping them in the room chrome at ONE choke point kills the bounce today and lets per-surface rebuilds proceed later (the strangler pattern).

**Mockup floor:** the room TopBar per `mockups/_round3-brief.md` §3; the wrapped page keeps its own content masthead (PageHeader) — chrome comes from the wrapper, headers from the page.

**Files owned:** `src/routes/_authenticated.tsx`, plus ONE-LINE edits (removing the old `<TopBar crumbs …/>` include) in: `_authenticated.discover.tsx`, `_authenticated.decide.tsx`, `_authenticated.plan.index.tsx`, `_authenticated.plan.spec.$id.tsx`, `_authenticated.design.tsx`, `_authenticated.build.index.tsx`, `_authenticated.build.$missionId.tsx`, `_authenticated.ship.tsx`, `_authenticated.learn.tsx`.

## Steps

1. In `_authenticated.tsx` (`AuthedLayout`): add a strangler predicate — pathname starts with one of `/discover`, `/decide`, `/plan`, `/design`, `/build`, `/ship`, `/learn`. **`/today` is deliberately EXCLUDED** (old home stays untouched as the legacy fallback).
2. For matched paths render `<RoomChromeShell activeDoor="mission"><Outlet/></RoomChromeShell>` instead of `<AppShell>`. Treat matched paths like `isReimaginedSurface` for the `GotoShortcuts` and `FocusDock` conditionals (shortcuts belong to the room world; dock off). `GlobalComposer` stays mounted (it self-excludes where needed).
3. Per wrapped route file: remove the old breadcrumb `<TopBar crumbs .../>` line and its now-unused import (e.g. `_authenticated.build.index.tsx:674`). KEEP each page's `PageHeader`/masthead — that is the page's h1, not chrome. Change nothing else in these files.
4. `AuthedNotFound` in `_authenticated.tsx`: change the "Back to Today" link to `/m` (label "Back to Mission Control").

## Out of scope

No changes to `RoomChrome.tsx` (it is already generic). No changes to `faces.tsx`. No changes to any station page's content, data, or layout beyond the TopBar-line removal. Do not wrap `/today`, `/admin`, or any route not listed.

## Acceptance checklist

- [ ] Direct URLs `/discover /decide /plan /design /build /ship /learn` all render the room TopBar; NO 248px left rail anywhere on them.
- [ ] `/m/$productId?stage=build` → "Open the full workbench" → the workbench wears room chrome; the Mission Control door returns to the room.
- [ ] The needs-you (Approvals) pill count on wrapped pages matches the room's count.
- [ ] `/today` still renders the old AppShell unbroken (regression check).
- [ ] No double header: wrapped pages show room TopBar + their own PageHeader only.
- [ ] `bunx tsc --noEmit && bun run build && bun test` green.

**Sequencing note:** WO-C also edits `_authenticated.tsx` (the `beforeLoad` block only). WO-B owns the render body; land WO-B first, WO-C rebases.
