# Public sources — what of Vercel's Geist can we legally lift vs. must re-implement

> _Research pass, 2026-07-11. Sources checked live via `gh api`, `npm view`/registry JSON, and
> WebSearch/WebFetch on the same day — treat as current as of this date. Purpose: settle, with
> facts, what parts of Vercel's Geist design system are publicly published and directly usable
> so `tempo-v5` lifts instead of rebuilds wherever that's actually legal._

## 1. `github.com/vercel/geist-font`

- **Public, active, not archived.** Default branch `main`.
- **License: SIL Open Font License 1.1** — confirmed both via the GitHub API's `license` field
  ("SIL Open Font License 1.1") and by the repo shipping both `LICENSE.txt` and `OFL.txt` at
  root. Self-hosting and bundling into a product is exactly what OFL 1.1 permits.
- **Contents** (root listing): `fonts/` (source font files), `out/` (build output), `packages/`
  (npm workspace — see below), `documentation/` (marketing/specimen material only:
  `DESCRIPTION.en_us.html`, `article/`, `images-license.txt`, `img/`, `social-assets/`), `.docs/`
  (just an `img/` folder), `scripts/` + `Makefile` (font build tooling), `sources/`,
  `AUTHORS.txt`/`CONTRIBUTORS.txt`/`CONTRIBUTING.md`, `renovate.json`, and Python
  `requirements*.txt` (font QA tooling, e.g. fontbakery-style checks — dev-only, not shipped).
  **`documentation/` is font specimen/press copy, not a design-system doc site** — there is no
  component/token documentation inside this repo.
- **`packages/` contains exactly one workspace: `next`** — the Next.js-specific font loader
  (`font.d.ts`, `font/`, `images/`). This is what backs `geist/font/sans` / `geist/font/mono`
  subpath imports used with `next/font`. Confirms the npm package's Next.js loaders are real and
  come from this monorepo, not a separate project.
- **Releases**: latest is tag `v1.7.2` (published 2026-06-01). Also present: `v1.7.1`
  (2026-05-20), a changesets-style scoped tag `geist@1.7.0` (2026-01-29), and an odd stray tag
  literally named `1.8.0` dated 2026-03-03 — **earlier** than `v1.7.2` despite the higher number;
  read that as a mis-sequenced/abandoned tag from the release-automation switch, not as "a newer
  1.8 exists." Treat `v1.7.2` / npm `1.7.2` as current.
- **Confirms Sans + Mono + all 5 Pixel variants ship from here**: the npm package's own keywords
  list `geist`, `geist mono`, `geist sans`, `geist pixel`, `vercel font`, and Vercel's own
  Feb 2026 blog post ("Introducing Geist Pixel") names the five variants explicitly — Pixel
  Square, Grid, Circle, Triangle, Line — all released under the same SIL OFL.
- **No CSS/design-token tooling beyond the fonts themselves** lives in this repo — it is a
  font-build monorepo, full stop.

## 2. npm `geist` package (currently 1.7.2)

- `npm view geist`: license **SIL OPEN FONT LICENSE**, **zero runtime dependencies**, 69
  published versions, dist-tags `alpha 1.5.0-alpha` / `beta 1.6.0-beta.5` / `latest 1.7.2`.
  Description: "Geist is a new font family for Vercel, created by Vercel in collaboration with
  Basement Studio." Unpacked size 8.0 MB.
- Ships **TTF, WOFF2, and variable-font files for Sans, Mono, and all five Pixel variants**,
  organized into family subdirectories, plus the **Next.js `font.js` loaders** (subpath exports
  such as `geist/font/sans`, `geist/font/mono` wired to `next/font/local` under the hood, backed
  by the `packages/next` workspace above).
- **Nothing else of note inside**: no bundled component CSS, no utility classes, no design-token
  JSON/CSS. It is fonts + Next.js loader glue, exactly as advertised — no hidden extras to mine.

## 3. `@vercel/geist` and other candidate import paths — the component library

- **`@vercel/geist` does not exist on the public npm registry.** Verified directly against
  `registry.npmjs.org/@vercel/geist` → **HTTP 404**. This matches what was already suspected
  going in.
- **The live docs page's own code samples import from `@vercel/geistcn`, not `@vercel/geist`.**
  `vercel.com/geist/introduction` shows:
  ```tsx
  import { Button, Modal, Toggle } from '@vercel/geistcn/components';
  import { IconPencilEdit } from '@vercel/geistcn-assets/icons';
  ```
  Both `@vercel/geistcn` and `@vercel/geistcn-assets` were checked directly against
  `registry.npmjs.org` and both return **HTTP 404** — neither is publicly installable either.
  Vercel separately documents "Working with Vercel's private registry"
  (`vercel.com/docs/private-registry`), which lines up: `@vercel/geistcn` almost certainly lives
  on Vercel's internal/private npm registry, not the public one. There is no legitimate way to
  `npm install` the actual Geist component library — it has never been published publicly.
- **`@vercel/geistdocs` does exist publicly** (currently 1.11.0, with a `1.2.3-canary...` channel
  also live). But it is **not** the component library — its own package description is: "CLI for
  Geistdocs projects, including initialization and updating." It's a scaffolding CLI for building
  a Next.js + Fumadocs documentation site in Vercel's docs style (MDX authoring, AI chat, i18n,
  feedback widgets). Confirmed in use by the public `vercel/components.build` repo (a `geistdocs.tsx`
  config file at its root wires the docs-site branding/nav/search). Useful only if Cadence ever
  wants a *docs site* that looks like Vercel's docs shell — irrelevant to the in-app component
  system.
- **`vercel/components.build`** (github.com/vercel/components.build, MIT, 775 stars, not
  archived): a **separate, unrelated open specification** — "an open-source standard for
  building modern, composable and accessible UI components," co-authored by a Vercel design
  engineer and shadcn. It is ~91% MDX documentation/guidelines (composability, accessibility,
  `asChild`, polymorphism patterns) — **it contains no actual Geist component source code**, just
  prose standards. Not a source of components to lift.
- **Other candidate names checked, none pan out as the official library**:
  - `@vercel/design`, `@vercel/ui` — no evidence either exists as a real package.
  - `geist-react` — no official package under this exact name found.
  - `@geist-ui/react` / `@geist-ui/core` (repo `geist-org/geist-ui`, site geist-ui.dev) — **this
    is real and it is MIT-licensed, but it is a different, unaffiliated project**: the old
    Zeit/Vercel-era UI kit (predates the 2023+ Geist redesign), built on CSS-in-JS/styled-jsx.
    **It was formally archived by its maintainer on 2026-06-01** — the README's own
    "Project Status" section says Tailwind CSS "has become a practical and widely adopted choice
    for modern interface work" and that the project "will no longer receive active updates."
    Latest tagged release is `v2.3.8` from March 2022. Explicitly **not** Vercel-maintained and
    **not** the current look — see §4/§5(c).
- **Bottom line**: the only public, official, Geist-branded npm packages are the font (`geist`)
  and the docs-scaffolding CLI (`@vercel/geistdocs`). The actual component library has never been
  published publicly, under any name.

## 4. Community recreations of the CURRENT (post-redesign, Pixel-font-era) Geist look

- **`ieedan/geist-ui-svelte`** — MIT, but **archived**, last pushed 2024-10-10, 21 stars. Predates
  the 2025-2026 refresh (no Pixel fonts, older token set). Low fidelity to the current look, and
  stale.
- **`shyakadavis/geist`** — "Svelte implementation of Vercel's Design System (WIP)," not
  archived, last pushed 2025-06-24, 123 stars — the most actively maintained clone found. **No
  LICENSE file in the repo** (GitHub reports `license: null`), so it is default all-rights-reserved;
  fine to look at for structural/anatomy reference, not safe to copy code from verbatim. Also
  Svelte, not React — irrelevant to Cadence's stack even if it were licensed.
- **`rishiosaur/geist`, `paul-vd/geist-ui`** — forks/mirrors of the same old `geist-org/geist-ui`
  codebase; same pre-2023 fidelity problem.
- **No maintained, clearly-licensed shadcn/Tailwind-v4 "Geist" theme or preset** turned up in the
  usual community registries (tweakcn, `@madooei/shadcn-theme-presets`, shadcn theme galleries)
  as of this search. The current grayscale + Pixel-font Geist aesthetic does not yet have a
  well-known open-source clone worth borrowing from.
- **`non.geist` (npm)** — unofficial third-party repackaging of the same font family "for
  non-Next.js projects" (maintainer `contigen`, MIT, not Vercel). Redundant: the official `geist`
  package's plain CSS/WOFF2 files already work fine outside Next, so there's no reason to add
  this as a dependency.
- Net: `design-reference/tempo-v5`'s existing approach — extracting token values by hand from the
  live site and re-implementing components on React 19 + Tailwind v4 + Radix — is not just the
  legally safe choice, it's also currently the *only* way to get the current-generation look; no
  shortcut clone exists yet.

## 5. Is the `vercel.com/geist` docs site itself public?

- **No public repo found for the actual site** (content, live component demos, token pages). It
  is not inside `vercel/examples`, and there is no standalone public repo under the `vercel` org
  matching that name/purpose.
- **What is public and adjacent**: `@vercel/geistdocs`, the Next.js + Fumadocs-based framework/CLI
  used to scaffold docs sites *in Vercel's docs style* generally (see §3) — proven in use by the
  public `vercel/components.build` repo. So the docs-site *shell/framework* is reusable software;
  the actual `vercel.com/geist` page content, component demos, and token source are not published
  anywhere found.

---

## VERDICT

**(a) Take directly — with proper attribution/license file:**
- The **`geist` npm package** (v1.7.2, SIL Open Font License 1.1): Geist Sans, Geist Mono, and
  all five Geist Pixel variants (Circle/Grid/Line/Square/Triangle) as TTF/WOFF2/variable fonts,
  plus the Next.js `font.js` loaders. This is exactly what `tempo-v5/tokens/fonts.css` already
  self-hosts from `/public/fonts/geist/` — correct call, keep doing it, no reason to touch a
  third-party font mirror (`non.geist`, `@fontsource/geist`, etc.) instead.
- (Situational) **`@vercel/geistdocs`** if Cadence ever needs a standalone public *docs site*
  matching Vercel's docs-site shell — not applicable to the in-app design system today.

**(b) Re-implement — and why:**
- **Every component** (buttons, modals, tables, menus, etc.) — because the actual component
  library (`@vercel/geist` / `@vercel/geistcn`) has never been published to the public npm
  registry (confirmed 404 for both), and there is no legitimate access path; it appears to live
  only on Vercel's private registry. Continue exactly what `tempo-v5/research/*.md` is already
  doing: observe the live site's public documentation/behavior and rebuild on React 19 +
  Tailwind v4 + Radix, one component at a time.
- **Token values** (color scales, spacing, radii, shadows, type scale) — same reasoning: they are
  observable on the public site but the source CSS/token file is never shipped anywhere public.
  Keep hand-extracting into `tokens/*.css` as already underway.
- **Docs-site IA/chrome**, if ever wanted for Cadence's own docs — the real site source isn't
  public, so this would mean pattern-matching visually, not forking code.

**(c) Do-not-copy:**
- **`@vercel/geistcn` / `@vercel/geistcn-assets`** — these names leak in the public docs page's
  own code samples, but the packages 404 on the public registry and are almost certainly gated on
  Vercel's private registry. That is proprietary Vercel-internal code; do not attempt to probe,
  guess-resolve, or otherwise gain access to a private registry package just because its name is
  visible in public HTML.
- **`geist-org/geist-ui` (`@geist-ui/react`, geist-ui.dev)** — MIT-licensed and legal to use, but
  it is the **wrong design system**: the pre-2023 Zeit/Vercel look, formally archived by its own
  maintainer on 2026-06-01 in favor of Tailwind, last released in 2022. Using it would visibly
  clash with the current grayscale/Pixel-font Geist aesthetic — do not treat it as a shortcut.
- **`shyakadavis/geist`** — no LICENSE file (`license: null`), so default all-rights-reserved;
  reference/inspiration for structure only, never copy its code verbatim, and it's Svelte anyway.
- **`non.geist`** — unofficial, unnecessary third-party font repackaging; the official `geist`
  package already covers the non-Next.js case.
