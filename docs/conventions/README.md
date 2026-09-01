# docs/conventions — Durable, cross-tool rules

> _Created: 2026-06-06 · Last updated: 2026-09-02_

> **What this is.** The git-tracked, source-of-truth home for durable conventions every tool (Claude Code · Antigravity · Gemini · Lovable) must follow. One rule per file. Short. With a clear _why_ and _how to apply_.
>
> **Why a folder, not memory?** Tool-private memory (Lovable's `mem://`, Claude's project memory, etc.) is invisible to other tools and is not in `git`. The repo is the only shared substrate ([`../archive/agent-operating-manual.md`](../archive/agent-operating-manual.md) §10, which was `AGENTS.md` at the root until 2026-09-01). Rules live here so every tool sees them. Tool-private memory may _mirror_ a rule for fast injection, but the body of the rule lives here.

## Conventions

| File | Rule |
| --- | --- |
| [`the-bar.md`](./the-bar.md) | **THE STANDARD, and read it before any surface work.** Build it as if Anthropic, OpenAI, Google, Vercel, Figma, Perplexity or Microsoft were shipping it, with the lens each one contributes. The panel of hats to wear (design, consumer psychology, product, GTM, the multi-product PM, the enterprise B2B veteran, and the user) and the user's hat worn at every step rather than at review. **This is not a B2B SaaS app with AI features, it is an agentic platform: the agent's work is shown, not hidden, and the human stays in the conversation while the backend keeps running.** The machinery stays behind the engine-room door; the work does not. Founder rulings 2026-09-01 and 2026-09-02. |
| [`ui-chrome.md`](./ui-chrome.md) | No native browser chrome (`alert/confirm/prompt/open/onbeforeunload`, native `<dialog>`). Use `useConfirm()` / `usePrompt()` + `sonner` + shadcn. |
| [`humanized-output.md`](./humanized-output.md) | **Master rule.** Zero AI fingerprints in BOTH what we author and what the platform generates for users (no em/en dashes, no invisible Unicode, no AI-cliché phrasing). Runtime sanitizer is the hard gate. `ui-voice.md` is its UI-string application. |
| [`ui-voice.md`](./ui-voice.md) | Voice anchor, length budgets, AI-tell denylist, em/en dash ban. |
| [`destructive-actions.md`](./destructive-actions.md) | Typed-name match for irreversible deletes; `useConfirm` for other destructive flows; Undo over confirm for reversible ones. |
| [`inline-management.md`](./inline-management.md) | Workspace + product management is inline (popover / dropdown / sheet), never a dedicated route. |
| [`doc-update-cadence.md`](./doc-update-cadence.md) | The 8-step per-feature checklist that closes the documentation loop. |
| [`doc-update-cadence.md`](./doc-update-cadence.md) | **Doc maintenance cadence + the "what next" source of truth.** Three tiers (continuous / per feature-milestone / per structural change) so living docs stay current while architecture docs do not churn. Names `docs/planning/SOURCE-OF-TRUTH.md` as the always-current build-state tracker that answers "what are we building next". |
| [`ui-verification-steps.md`](./ui-verification-steps.md) | After each build, end the report with numbered self-serve UI-verification steps (route + what's visible + one-line why); say so plainly when a change is backend-only, and flag deploy state (live now / after the Lovable Publish). Founder ruling 2026-06-16. |
| [`home-and-today-ia.md`](./home-and-today-ia.md) | **Home/Today IA + the surface-placement rubric.** Today is not a dashboard (only what needs the human now + the while-away summary); relocate-and-curate, never delete or textualize a rich visual; every artifact has one home. The standing "where does X go" answer so Today never re-clutters. Founder ruling 2026-06-16. |
| [`engine-room-doctrine.md`](./engine-room-doctrine.md) | **The product's first UX law: calm front, deep engine.** Complexity lives in the engine, never in the experience; all observability/governance/internal machinery lives behind one recessed "Engine Room" door (reveal on demand); user-facing labels name the outcome, not the mechanism; users bring their own sources via one Connect button and never touch keys/DBs/wiring. The Engine-Room Test + a greppable `Engine-Room:` stamp gate every new user-facing surface. Outranks any single surface, feature, or metric. Founder ruling 2026-06-16. |
| [`data-minimalism.md`](./data-minimalism.md) | **Every field earns its place: capture nothing by default.** No field, input, stored column, or pixel of screen real estate exists unless a named consumer needs it; a captured field ships in the same change as its consumer (no "collect now, use later"); speculative capture is allowed only with a documented, credible near-term consumer. The data-and-input sibling of the Engine-Room Doctrine. Founder ruling 2026-06-18. |
| [`design-context.md`](./design-context.md) | **RETIRED IN PLACE — do not follow this row.** It used to route all design work to the Obsidian v3 contract, which was retired 2026-08-14 along with v1 Ember, v4 Loom, v5 Tempo and Cadence/ink. **The design system is Meridian and there is no other one:** contract at [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md), system at `src/styles/meridian.css`, components in `src/components/meridian/`. The ratchet (`src/__tests__/meridian-ratchet.test.ts`) fails `bun test` on a new file carrying a retired token. The file itself already carries its own retirement banner. |
| [`workspace-hygiene.md`](./workspace-hygiene.md) | **Working-tree hygiene: no images at the repo root / `docs/` top level, no `" 2"` FS-dup artifacts.** Every image has one home by scenario (verify / app-ui / reference / screen-\* / brand-feed / committed design-reference) plus a retention window; the janitor `scripts/clean-workspace.sh` (`bun run clean:workspace`) relocates image strays, purges ephemeral buckets, and removes `" 2"` dups whose canonical twin exists. Founder ruling 2026-06-16. |
| [`tab-icon-tones.md`](./tab-icon-tones.md) | Tabbed surfaces (Observe, Governance, any future grouped page) get a small colored icon chip per tab; each tab carries `Icon` + `tone` (`violet \| emerald \| sky \| amber \| rose`), assigned by the closest semantic tone. The underline stays the active signal; the chip is the identity signal. Do not invent new tones without updating the doc. |
| [`design-anatomy.md`](./design-anatomy.md) | **The consolidated design-system reference behind the design law:** card anatomy, the shared DetailKit detail-view anatomy, the trace-ref registry, the ranking + designation logic, and the color + naming conventions (plus the WHY). The long-form reference behind [`design/archive/loom-v4.md`](../design/archive/loom-v4.md) §0.1 dimension 17 (the binding contract; dim 17 wins if the two ever drift). Founder ruling 2026-07-07. |

| [`surface-discipline.md`](./surface-discipline.md) | **Space, scroll, colour and the wait, plus the two governing laws.** (1) THE RATCHET: today's design is the FLOOR, so "reduce the scroll" / "tighten this" is a request for a better surface and never a smaller one; compression (smaller type, stripped padding, capped heights, dropped states) is forbidden as an answer, and only structural moves are allowed. (2) THE STANDARD: Stripe / Google / Anthropic at enterprise B2B scale, and we are past the reskin, so work is fine touches on the `--sp-*` system rather than a new visual language. Mechanics: exactly one page scroller (a nested vertical scroller is a wheel trap), `@container` not `@media` inside a pane, fit-to-content heights, colour that survives greyscale, one app-wide brand wait, indicators only on real agent dispatch. Enforced by `src/__tests__/surface-discipline.test.ts`. Founder rulings 2026-08-01. |

## How to add a new convention

1. **Write the rule here first.** One file per rule, in this folder. Format: rule · why · how to apply · related.
2. **Reference it from the canonical contracts** that already touch the topic (`architecture/*.md`, `docs/design/archive/ember-editorial-landing.md`, `docs/planning/feature-backlog.md`). The contract restates the rule and links here for the _why_.
3. **Wire it into the entry points** so every tool lands on it: add a thin pointer to [`../../CLAUDE.md`](../../CLAUDE.md), which is the only auto-loaded root file since 2026-09-01. Keep it to a line or two and never duplicate the body here.
4. **Optional: mirror to tool memory** as a _thin pointer_ (≤ 2 lines, "see `docs/conventions/<file>.md`"). Never duplicate the body — drift will follow.
5. **Update this index** with the new row.

## Why this folder exists

On 2026-06-06 the operator caught that durable rules were being saved to Lovable-only `mem://` files that other tools never see. This folder is the fix: rules in git, referenced from every entry point, tool memory thinned to pointers.

## Related

- [`../../CLAUDE.md`](../../CLAUDE.md) - the auto-loaded entry point, and the only root file besides `README.md` since 2026-09-01.
- [`../archive/agent-operating-manual.md`](../archive/agent-operating-manual.md) §3 (engineering rules) · §5 (cross-document update protocol) · §10 (cross-tool co-development). Was `AGENTS.md`.
- [`../strategy/archive/v3-audit-language-voice.md`](../strategy/archive/v3-audit-language-voice.md) — the audit that produced the first batch of conventions here.
