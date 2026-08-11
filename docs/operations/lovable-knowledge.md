# Lovable project knowledge (tracked mirror)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> **This file is the tracked mirror of the Knowledge field on the Lovable project** (`371dd588-1b70-4629-9bb5-9f003f3af373`, workspace Luna). Lovable's agent writes code into this repo, and that field is the only instruction set it reads. It is not in git by default, so it drifted for six weeks without anyone seeing it.
>
> **How badly it drifted, as found on 2026-08-03:** it still said the product was named **Cadence**, named **Loom v4 and Obsidian v3** as the design system, specified Newsreader and Schibsted Grotesk as the fonts, described a five-destination IA, and told the agent to strip AI fingerprints from code comments. Every one of those had been superseded, some by two months. Lovable was building from it the whole time.
>
> **The rule this file exists to enforce: change the Lovable Knowledge field and this file in the same sitting.** Update here, then push it with `mcp__plugin_lovable_lovable__set_project_knowledge`. Read the live value back with `get_project_knowledge` before overwriting, because setting it replaces the field entirely.
>
> Hard limit: **10,000 characters.** This file is currently about 9,300, so there is little headroom. Cut something before adding.

---

## The brief, verbatim as pushed

_Last updated 2026-08-03. The canonical, tool-agnostic manual is **AGENTS.md** at the repo root; when anything here is unclear or looks out of date, AGENTS.md governs and this brief is wrong._

## Product identity

The product is **Supaprod**. Lowercase `supaprod` for domains, handles and slugs; `Supaprod` in prose; never camel-case "SupaProd".

**It shipped as _Cadence_ until the rename executed on 2026-07-17. That name is retired and must never appear in code, copy, database, env or APIs.** Read any stray `Cadence` token as `Supaprod`. Two narrow exceptions: the generic English word ("release cadence", the DB `cadence` schedule-frequency column) was never the brand, and dated historical narrative stays accurate to what the product was called at the time.

**What it is, in one sentence:** Supaprod is where product decisions live when agents do the work. It tells you what to build, builds it, ships it, checks what actually happened, and **learns from it, so next time it guides the call instead of waiting to be asked.**

**The last verb is load-bearing. It learns and guides; it never "remembers", "stores", or "logs".** Remembering describes a filing cabinet and is not defensible. Learning compounds, because it needs the customer's own outcomes labelled over time. So in any copy you generate: never write "where the record lives", "stores your decisions", or "searchable history". Write that it compounds, that it guides the next call, and that it warns before you repeat what was wrong.

**The loop is seven stations, and it is a route, not a conveyor:** Discover, Decide, Plan, Design, Build, Ship, Learn. Work visits only the stations it needs and can enter at any of them. A skipped station is a recorded decision with a reason, never a silent omission. Learn settles a verdict, writes it back against the decision that caused it, and re-ranks what Discover and Decide surface next.

## The design system (all four earlier systems are RETIRED)

**Read the code, not a document. The baseline is what is shipped.**

- **Tokens:** `src/styles/ink.css`, the `--sp-*` namespace. This is the only namespace to write.
- **Primitives:** `src/components/shell/primitives.tsx` (`Block` `Row` `Grid` `Gate` `Button` `Value` `Field` `Loading` `Surface` `Empty` `PageHead` `Door` and more). Compose from these.
- **Shell:** `src/styles/shell.css`, `src/styles/primitives.css`.
- Written contract: `docs/design/DESIGN-SYSTEM.md`.

**DESIGN-TEMPO.md (Tempo v5), DESIGN-LOOM.md (Loom v4), DESIGN-OBSIDIAN.md (Obsidian v3) and DESIGN.md (Ember) are all retired**, and now live in `docs/design/archive/`. On 2026-07-28 the founder rebuilt the authenticated app from zero and revoked every one of those constraints. **Do not build from them, do not restyle toward them, and ignore any older brief that names them, including the previous version of this one.**

`src/styles.css` is a separate legacy file holding `--ds-*` tokens used by `src/components/ui/*` shadcn primitives. It still runs. **Never add a `--ds-*` token and never style a new surface from it.**

### Founder rulings that replace the old colour and type laws

- **Monochrome by default:** black, grey, white, slate, silver on a dark ground.
- **Ember is rare.** It is explicitly NOT the default for approval buttons, actions or tasks. (The old "ember = needs-a-human" law is dead.)
- **Blue = agents running. Green and red = status** (diffs, counts, tick marks).
- **Colour must carry status, never decorate**, and must survive a greyscale test.
- **Fonts are Geist Sans (UI) and Geist Mono (technical). Geist Pixel is retired**, including from hero moments. Newsreader, Schibsted Grotesk, Codystar and Caveat are gone.
- The brand mark is the seven-petal **SupaprodMark** (`src/components/supaprod/SupaprodMark.tsx`).
- Ask lives **top right** and opens a pane. The bottom composer strip is rejected.

### Two laws on every surface change

1. **The ratchet: today's design is the floor.** "Tighten this" or "reduce the scroll" is a request for a **better** surface, never a smaller one. Shrinking type, stripping padding, capping heights or hiding information to save rows is forbidden as an answer. Use the horizontal axis, collapse what nobody reads, delete real duplication. Test: would someone who liked yesterday's screen prefer today's?
2. **The standard is Stripe, Google, Anthropic at enterprise B2B scale.** The states nobody screenshots (empty, partial, failed, denied, very long, slow) are each composed, not merely handled.

## Output rules (hard gates on everything you generate)

**Humanized output, scoped by explicit founder command 2026-08-03. This changed; the old rule was wider.**

- **Must be perfect:** consumer-facing screens (UI copy, labels, empty states, error messages) and every outcome the platform generates for a user (PRDs, drafts, chat, research, rationales), plus public pages. No em dashes, no en dashes, no invisible or zero-width Unicode, no AI-cliché phrasing. Use plain hyphens, colons or separate sentences. The house separator is the middot ` · `.
- **Explicitly out of scope, do not spend effort here:** backend and server source code, code comments, `.md` docs, `.sql` migrations, tests. Cleaning fingerprints out of code no user sees is waste.

**Calm front, deep engine (the Engine-Room doctrine).** The user meets the *output* of the machine, never the machine. Traces, evals, budgets, prompts and raw logs stay behind one recessed Engine Room door, revealed on demand. Label the **outcome**, not the mechanism. Users connect sources through one Connect button and never touch keys or database wiring.

**Consequence-first controls.** No bare-verb buttons; state what will happen. Citation chips carry the exact source quote.

**Governance is policy, not permission.** The human sets boundaries in advance; the agent does the work. A gate is the exception, not the loop. Never design a flow whose normal path is a human approving each step.

## How this project is built

- One git repo, co-developed by Lovable, Claude Code, Antigravity and Gemini. **Git is the only shared substrate**; no tool's skills or hooks reach another.
- **Lovable is the live system of record** for the Supabase database (schema, RLS, rows), auth and OAuth, edge functions, secrets, hosting and deploys. Keep the backend coherent, migration-safe and documented.
- **A feature is two files in lockstep:** server logic in `src/lib/<domain>.functions.ts`, consumed in `src/routes/_authenticated.<domain>.tsx` via TanStack Query. Follow an existing pair rather than inventing a data-flow shape.
- **RLS on every user table, scoped by membership. Every write stamps `workspace_id`.** A missing `workspace_id` typechecks clean and fails at runtime; it has caused live outages here.
- Database changes are timestamped, RLS-aware SQL under `supabase/migrations/`. Never edit an applied migration in place.
- **BUILD-ONLY MODE is ACTIVE** (founder ruling 2026-07-04). Skip the documentation ceremony. The one trace required when something ships: flip its row in `docs/planning/SOURCE-OF-TRUTH.md` with a one-line note.

### Root documentation, as of 2026-08-03

Root holds exactly four files. Everything else moved into `docs/`.

- `README.md` what Supaprod is, and where every other doc lives
- `AGENTS.md` how to build it, the canonical rules
- `CLAUDE.md` / `GEMINI.md` per-tool notes, thin

`plan.md` is gone from root; the historical build log is `docs/planning/archive/build-log.md`. Live status is `docs/planning/SOURCE-OF-TRUTH.md` §0 only.

## AI provider setup (DO NOT change without explicit founder instruction)

- **Embeddings: Cohere `embed-v4.0`**, via `https://api.cohere.ai/compatibility/v1/embeddings`, 1536 dimensions, matching the existing pgvector columns. All embedding calls route through `src/lib/rag/embed.server.ts`, the EMBED-CHOKEPOINT. `COHERE_API_KEY` lives in Lovable project secrets.
- **Never** add a direct embedding call that bypasses that file, change the provider, or modify `resolveEmbedRoute` or the Cohere constants.
- Routing priority in `resolveEmbedRoute`, never reorder or remove a step: (1) user BYO OpenAI key, (2) platform `COHERE_API_KEY`, (3) Lovable gateway fallback.
- **Completions** route through `src/lib/ai/runtime.server.ts`, the one chokepoint, selected by `AGENT_MODEL_PRIORITY`. **Caution, learned the hard way: adding any provider key silently re-routes production completions** to whichever provider that list prefers. Do not add a provider key expecting it to sit idle.
- **Every AI call goes through a chokepoint.** No direct `fetch` to an AI API anywhere else. A new AI surface needs a valid `CallSurface` literal from the exported union in `runtime.server.ts`.

## Before you believe anything about production

On 2026-08-02, nine separately shipped features were found doing nothing in production. Every one passed typecheck and tests; two had unit tests asserting the defect as the contract. **Not one was found by reading code.** They were found by querying the live database. Verify a table exists with `to_regclass`, not by trusting a migration list. A wrong column name inside a `.select()` string typechecks clean and fails only at runtime.
