# Pill

> Not a real Geist component — this page does not exist.

## Investigation notes

`https://vercel.com/geist/pill` does not resolve to a component page:

- Direct fetch of `/geist/pill` returns HTTP 307, redirecting to `/geist`, which itself 308-redirects to `/geist/introduction`. The rendered result is the Geist introduction/landing page (`<title>Geist</title>`), not a component doc.
- A plain unauthenticated fetch of `/geist/pill` (no redirect-follow) returns a Next.js `NotFound` payload (`id="__next_error__"`, component name `NotFound` in the flight script) — i.e. a genuine 404, not a slow-loading real page.
- Tried slug variants, all failed the same way: `/geist/components/pill`, `/geist/components/badge` (both 404 — `/geist/components/*` is not a valid path prefix at all).
- Confirmed working sibling for comparison: `/geist/badge` returns HTTP 200 with `<title>Badge</title>` and a full page (~500KB), proving the fetch method and UA are fine and the site does serve real component pages at `/geist/<slug>`.
- Parsed the full component index off the rendered `/geist/introduction` page (every `/geist/<slug>` link present in that page's HTML). Full list of real Geist component slugs found:

  avatar, badge, banner, book, brands, breadcrumbs, browser, button, calendar, card, checkbox, choicebox, clearable-input, code, code-block, collapse, colors, combobox, command-menu, context-card, context-menu, copy-button, description, destructive-action-modal, dots-menu, drawer, empty-state, entity, error, error-card, feedback, fieldset, file-tree, gauge, geistcn-icons, grid, input, introduction, json-view, keyboard-input, label, load-more-button, loading-dots, materials, menu, middle-truncate, modal, multi-select, note, pagination, phone, progress, project-banner, radio, relative-time-card, scroller, search-input, select, separator, sheet, show-more, skeleton, slider, snippet, spinner, split-button, status-dot, switch, table, tabs, text-with-copy-button, textarea, theme-switcher, toast, toggle, tooltip, typography, video

  **`pill` is not in this list.** There is no Geist component named "Pill" as of 2026-07-10/11. The closest conceptual neighbors in the real catalog are `badge` (colored status/label chip) and `status-dot` (small status indicator) — either may be what was actually intended if a "pill"-style chip is the target to reverse-engineer.

## Conclusion

No content was extracted because the target page does not exist on vercel.com. No prose, no code examples, no Best Practices text, no design tokens were available to capture. If the intent was a pill-shaped chip/tag component, the nearest real Geist components to research instead are `badge` and/or `status-dot` (both confirmed live at `https://vercel.com/geist/badge` and `https://vercel.com/geist/status-dot`).
