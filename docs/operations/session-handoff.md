# Pick up here

> _Created: 2026-08-07 · Last updated: 2026-08-10_

**State at close:** seven commits on `main`, pushed to `origin/main`, tree clean. `tsc` 0 · 8,299 pass / 0 fail · eslint 0 · `bun run build` green · `docs:check` clean. **App code is not live until the founder clicks Publish in Lovable.**

The canonical work order remains [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md). No board rows changed status: this session was founder-directed copy, positioning and design work, not queue items.

---

## Lenny's Data is set up and the first probe is done. START HERE.

The founder bought the $400 Annual + Insider plan on 2026-08-10 and named this **the highest-priority work**, above build items: *"are we building even the right thing."* Official launch stays **mid-September** (he confirmed: do not touch the SSOT date; a 36-hour figure he mentioned is a private stretch target, not a deadline).

**Setup is finished and committed (`64f537dc`). Do not redo it. Read [`../research/lennys-data-archive.md`](../research/lennys-data-archive.md) first.**

- 679 documents (312 podcasts to 2026-08-09, 367 newsletters to 2026-05-05) cloned to `lennys-newsletterpodcastdata-all/`, **gitignored**.
- **The paid licence forbids redistributing raw files "in any form", private repos included, and forbids commercial use.** Treat it as reading, never as an asset: no corpus in git, no corpus in Supaprod's brain or RAG, no analysis published as Supaprod marketing. Derivative internal analyses are explicitly permitted.
- MCP `lennysdata` lives in [`.mcp.json`](../../.mcp.json) (env-driven, portable to Codex/Antigravity/Cursor); token in `.env` as `LENNYSDATA_TOKEN`, **expires 2026-09-09**. It was deliberately removed from the Claude-local registry, so **a restart is required** before `mcp__lennysdata__*` tools resolve.
- The 3-month newsletter embargo is a property of the archive, not the tier. Insider does not lift it. Those ~13 posts are readable on the site; they were never the bottleneck.

**Prior work exists: [`../research/podcast-corpus-lenny.md`](../research/podcast-corpus-lenny.md) already mines 16 episodes with a 10-insight synthesis, and it is cited downstream. DO NOT re-run that sweep.** The delta is 84 unmined in-window podcasts, 367 unmined newsletters, 5 post-cutoff episodes, and quote verification (existing quotes are ASR auto-captions; all 14 source files are now in the archive as official text, and those quotes are already flowing into the YC application).

**First probe, already run — a near-null that matters.** Across all 679 documents: *"forgot the why / nobody remembers the reason"* appears in **1 file**; *"institutional/tribal knowledge"* in 12, mostly in passing. But *"repeating mistakes"* hits 36 files, *"what did we learn / close the loop"* 38, *"no memory / blank slate"* 28. Three quotes carry the finding:

- **Zevi Arnovitz (2026-01-18):** after a model errs you "update the `/command` prompts with that knowledge so that in the future, it's not making that same mistake."
- **Dan Shipper (2025-07-17):** "he recorded all of it, put it into a prompt, and **he never made the same mistake twice**."
- **Lenny's newsletter (2026-02-03), "Step 9: Adding agent memory with AGENTS.md":** LLMs are "Mensa geniuses with the short-term memory of a hamster… if you want continuity, **you have to engineer it**."

**Read:** the pain is real but the vocabulary is wrong. Nobody says "we forgot why we decided." They say the loop is **hand-cranked**. The market's taught best practice is a hand-maintained markdown file. So the wedge is *"the loop you are hand-cranking runs itself"* — which independently validates the existing never-say-remembers/stores/logs doctrine with evidence rather than taste.

**Method warning:** regex over 5.9M words is at its ceiling — "reinventing the wheel" returned 36 files of which ~2 were on-topic. It finds phrases, not meanings, and cannot find the operator who described this pain in words nobody guessed. The deep pass needs semantic search (`search_content` over MCP, post-restart) or parallel full reads. **The founder has not authorised a workflow or subagents; ask before spending at that scale.**

## The one pattern worth carrying forward

**Three separate defects this session were the same failure: a fix that edited one constant and missed its twin, plus a test that then certified the result.** It is worth checking for before assuming a past fix landed.

| Fixed once | Still live somewhere else |
| --- | --- |
| Seeded slug removed from `Receipts.tsx` (2026-08-05) | same slug in `LandingFooter.tsx` **and** `index.tsx` `MACHINE_CONTENT` |
| "You approve every gate" corrected in `DESC` (2026-08-06) | same false claim in `MACHINE_CONTENT`, ten lines away |
| "remember" purged from every `.tsx` surface | `brief.html` and the investor deck, six times each, because a `*.tsx` find-and-replace does not open a `.html` file |

In two of the three, the guard written alongside the original fix read only the file that had been edited, so it passed green the whole time. `src/components/landing/no-seeded-slugs.test.ts` now walks `src`, `public` and `docs/pitch` rather than one file.

---

## What changed

**Truthfulness (`ffeb2d80`, `2e0d1c71`, `362a6e39`)**

- The invented four-row "graded ledger" is gone from the landing page, `/brief` and the investor deck, along with its `Worked example` banner and the dead `.ledger` CSS in both HTML files. It was disclosed rather than removed on 2026-08-05; the founder's ruling is that a page arguing "receipts, not claims" cannot ship a fabricated object with a louder label.
- **A seed fixture was being served as live proof.** `/d/acf1fa74…` is an `is_sample` row that `/proof` deliberately filters out, and it was linked from the footer under the heading "proof" and from `MACHINE_CONTENT` under "## Live proof", which is the copy answer engines read. Both removed.
- Two false claims corrected in `MACHINE_CONTENT`: "You approve every gate" and "The human gate stays in the middle the whole time". The loop is *designed* to run unattended (`MAX_TRACK_CORRECTIONS = 2`, three verify cycles per mission, then it escalates). The gate is real but sits at the **edge** (the merge gate is a fixed floor) and at the **cap**, not in the middle.
- `/updates` filled with six real ships, 2026-07-12 to 08-09, each dated from `git --diff-filter=A`.

**Positioning on machine surfaces (`6af52d95`)**

- `llms.txt`, `llms-full.txt`, `agents.txt` and the A2A card opened with July wording. All now carry the canonical thesis and **the three layers**, which were absent from every machine surface.
- The agent card described us as a place where artifacts "live in one place" — the storage claim the doctrine bans.
- `llms-full.txt` told answer engines we are for "teams building net-new products". [`../strategy/brownfield-positioning-evaluation.md`](../strategy/brownfield-positioning-evaluation.md) is explicit that the canon segments by **role**, and that Transform (650K existing teams) is the larger motion. It was suppressing the bigger market.
- Integrations corrected: the file claimed Linear, Notion, Google Docs and Jira (all `stubAdapter`) while omitting Intercom, Zendesk, HubSpot, Salesforce, Stripe, Canny and Productboard (all real).
- Free-tier retention said 14 days; `FREE_MEMORY_RETENTION_DAYS` is **30**.

**Landing page (`9ebaf0a9`, `6fb20d0c`, `f03b92f2`)**

- The hero said "For product managers **who ship with agents**" while the next beat says "Product is still waiting for its own." It also gated out the Transform motion.
- The hero now opens with the category: **"The agentic-first operating system for product teams"**, blue on `agentic-first` (the machine), ember on `product teams` (the humans), which is the page's own colour language.
- Headline's last verb `gets sharper` → **`guides the next call`**, matching the title, meta description, `llms.txt` and the card.
- CTA `Request access` → **`Join the beta`** in nav and hero, matching what the form's own submit button and `MACHINE_CONTENT` always said.
- Removed under the CTA: the Critic offer paragraph and the invite-code link. Three asks under one button.
- `memory sharpens it` → `the brain guides the next` in the replay strip.
- One of eight restatements of the human gate repointed to the idea the page never made: **the boundaries are set in advance**.

**Contrast, and it was a real AA failure (`f03b92f2`)**

Measured on the rendered page against `#0a0a0a`. The category line was **2.56:1** at 11px against a 4.5:1 floor, so only the ember word was readable. Same 2.56:1 that failed the brief audit.

| | before | after |
| --- | --- | --- |
| category line | `#52525c` 2.56 | zinc-400, 7.55 |
| spec connectives | `#52525c` 2.56 | zinc-400, 7.55 |
| headline verb line | `#71717b` 4.10 (fails under 24px) | `#7a7a85` 4.67, the darkest passing value |

Hero spacing also went from **20 / 28 / 36px** (a linear ramp in 8px steps, invisible against a 52px headline) to **16 / 40 / 56** — a ratio, so the eyebrow hugs the headline it labels, the sub gets a real break, and the CTA gets the largest.

---

## Do not re-debug these

- **`POST /api/mcp` is correct and `/mcp` is a different server.** `src/routes/mcp.ts` is auto-generated by `@lovable.dev/mcp-js` and serves four tools; `src/routes/api/mcp.ts` serves the ten documented ones. Only `search_signals` is in both. A 2026-08-07 change moved the agent card to `/mcp` on the strength of a **GET** probe — GET on an API route falls through to the SPA shell, so it proved nothing. `a2a-card.test.ts` now binds the advertised endpoint to the route file implementing the tools.
- **Layer 02 stays "the loop" in `ThreeLayers.tsx`.** The hero carries the category once, at the top. Under a headline reading "One system, three layers", the same words would be the system inside the system. Both files explain this so it is not re-litigated.
- **Do not re-add an illustrative ledger** anywhere. `Receipts.test.ts` fails if those rows return; its ratchet was reversed this session (it used to *require* them, which made the fabrication load-bearing).
- **The footer's `/proof` link stays.** A beat is persuasion, a footer is a directory. Removing it would leave `/proof` with zero inbound internal links, the condition documented in that same file as what was crippling `/product`.

---

## Open, in the order I would take them

0. **The Lenny corpus analysis — the founder's stated top priority.** Setup is done; the work is not started, by his explicit instruction to stop and restart fresh. See the first section above for the delta, the first finding, and the method warning. Verification of the 16 existing ASR quotes against official transcripts is the cheapest launch-protecting item in it.
1. **P1 is unchanged and still the highest-value action *that needs the founder's hands*: settle one outcome.** It costs ~10 minutes and does not compete with the corpus work, which is agent time. His own stated principle this session — do not "claim which is not there in the product" — is exactly this item. `applyOutcome` has never completed in production. Founder-only; an agent must not author the verdict word. Everything about the compounding claim rests on a path that has never run, and `/proof` shows an honest zero until it does.
2. **Sweep `zinc-600` across the rest of the landing page.** It measures 2.56:1 and fails AA anywhere it carries text under 18px. This session fixed three instances in the hero; the token is almost certainly used as a quiet tier in other sections.
3. **`/faq`, `/product` and `/security` copy was not audited.** Three of the four surfaces that *were* checked carried a dated or false claim, so these deserve the same read.
4. **The hero spec column's vertical anchor.** It is centred against a left column that got ~120px shorter when two blocks came out. Its colours are now correct; its position was not re-derived.
5. **`/brief` and `/investors` are still iframe-over-`brief.html`,** so crawlers cannot see them. This is the SEO/GEO item the founder asked for by name and it is still open.
