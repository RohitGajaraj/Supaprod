# design-reference/ — the design of record

This folder holds the **frozen, runnable reference designs** for Cadence. Nothing
here is production code and none of it is imported by the app — it exists so
humans and AI builders can see precisely how every screen should look and
behave before implementing it in `src/`.

> [!IMPORTANT]
> ## CURRENT: the v3 "Obsidian" system (adopted 2026-07-02)
>
> The design contract for ALL authenticated app surfaces is
> [`/DESIGN-OBSIDIAN.md`](../DESIGN-OBSIDIAN.md) (repo root). Its committed
> visual specimen is [`obsidian-specimen.html`](./obsidian-specimen.html)
> (founder-approved; when in doubt about how something should look, open it).
> The full handoff package (README + read order, `tokens/*.css` custom
> properties to copy verbatim, `components.md` anatomies,
> `implementation-notes.md` behaviors, the runnable six-surface prototype
> `design-reference/cadence-app.html`, and the Butterfly mark SVGs) lives in
> the local `Latest Design System - v3/` dump; start at its `README.md`.
> **Everything below this callout (the parchment prototype, the v2 Platform
> Design Blueprint, `cadence/tokens.css`) is SUPERSEDED for app surfaces** and
> kept as the landing-page contract + historical record. Do not port parchment
> styles to any app surface.

## Rule for builders (human or AI)

When implementing a screen that exists in a CURRENT reference: **port it**.
Match layout, positioning, hierarchy, spacing, copy, and interaction. Do not
redesign. For app surfaces the tokens are the Obsidian `tokens/*.css` custom
properties (copy verbatim; see the v3 package). For the legacy parchment
material below, tokens come from the repo root `cadence/tokens.css` (the copy
in `design-reference/cadence/tokens.css` is a snapshot so this folder runs
standalone — treat the root one as the live source).

## Running it

The prototype loads its scripts via fetch, so open it through a local server,
not file://

```bash
cd design-reference
npx serve .            # or: python3 -m http.server
# open http://localhost:3000/Cadence%20Prototype.html
```

## Contents

| File | What it is |
|---|---|
| `Cadence Prototype.html` | Entry point — the full app mockup |
| `Platform Design Blueprint.html` | The signed design contract (v2) |
| `cadence/tokens.css` | Token snapshot (live copy is at repo root) |
| `cadence/data.js` | All mock data, incl. drill-down payloads |
| `cadence/app.jsx` | Routing, shared state, approvals/missions logic |
| `cadence/shell.jsx` | Sidebar, topbar, cooking banner, construction pill |
| `cadence/home.jsx` | Today screen — hero ritual, calls queue |
| `cadence/chat.jsx` | Chat + Mission Cockpit + auto-title rule |
| `cadence/missions.jsx` | Mission list, detail, graph view |
| `cadence/loop.jsx` | Product / Knowledge / Govern / Settings screens |
| `cadence/loop-detail.jsx` | Drill-downs: signal, opportunity, release, decision, learning, connector |
| `cadence/govern-detail.jsx` | Drill-downs: eval suite, agent analytics, trace replay, drift |
| `cadence/onboard.jsx` | Login + onboarding first-run flow |
| `cadence/icons.jsx` | Icon set + the Butterfly mark |
| `cadence/tweaks-panel.jsx` | Design-review tweaks panel (ignore for production) |

Screen → source map: find any screen's code by its `data-screen-label`
attribute in the jsx files.

## Public landing page (v11)

`landing-page-v11/` holds the **design reference, ideology, decision log, and the founder's
inspiration images** for the public marketing page (`src/routes/index.tsx`) — Perplexity-style
liveliness, the pixel-font accent, the warm Ember spine, the three-voice type system, and what
to keep / enhance in a future revamp. **Start at
[`landing-page-v11/README.md`](./landing-page-v11/README.md)** before changing or revamping the
landing page. (Unlike the app prototype above, this is a reference + handoff doc, not a runnable
mockup.)
