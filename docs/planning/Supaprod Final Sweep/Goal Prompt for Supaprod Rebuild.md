# Goal for Fable — Supaprod Front-End Rebuild

Attached is the Supaprod Front-End Rebuild Master Brief (v2.2) — the authoritative baseline for this build. Read it end to end before writing a single line of code. Where this goal statement is silent, the brief governs. Where the brief flags a gap or asks you to confirm something with Rohit, do that — don't assume.

**In one line:** rebuild Supaprod's front end (and backend where the experience genuinely requires it) from a cluttered, plumbing-exposed app into a minimal, conversational, agentic product-lifecycle platform — Vercel-grade craft, three-surface IA (Home / Project / Approvals), the Ink design system, a final sweep of any stray old-brand tokens — shipped to a sandbox in 2–3 days, ready for paying customers and the YC application in ~4.

**This is the final sweep.** Five design systems and multiple rebuilds came before it and none fixed the core problem; there is no seventh pass. The product that comes out of this build is the one consumers must love: premium, calm, light, near-zero learning curve — a user understands it in seconds, is never overwhelmed, and gets their job done from one place. Judge every decision against that end state, not against habit or precedent.

## How to hold the brief: a standard, not scripture

The brief records Rohit's expectations, references, and quality bar. It is the baseline to meet or beat — not a procedure to follow blindly (its own Prime Directive 8 says exactly this). The hard invariants that always bind: the Supaprod name and spelling, sandbox-only work with production untouched, the public landing page changing only with Rohit's explicit approval (suggestions welcome, direct edits never — brief PD 6), the honesty/claim rule for anything the UI says the AI does, the humanized-output discipline below, and never silently cutting scope. Everything else — IA shapes, numeric budgets, component choices, phase mechanics, design direction — is the best current answer, not the only acceptable one. If you find a demonstrably better way to reach the brief's Objective (§3) and Success Criteria (§4), build the better way and log what you changed and why in the decision ledger. Both failure modes are rejected: blind literal compliance, and silent drift.

For this build, the brief supersedes `DESIGN-TEMPO.md`, the `supaprod-tempo` skill, and every v1–v5 design artifact — including where `CLAUDE.md` §1.58 says the Tempo contract wins. That repo guidance predates this brief; it gets updated after the build ships. Prior systems are reference history to mine for lessons, never a foundation.

Work phase by phase (Audit → Architecture → Design System → Screens → Integration & Purge → Demo Data → Review Gauntlet), commit early and often to the remote sandbox branch, keep a running decision ledger, and verify everything live in the sandbox with Playwright before calling anything done. Never touch production. Never silently cut scope — surface trade-offs as explicit decisions.

## Non-negotiable: this must read as made by humans, for humans

Every word and every pixel must feel like it came from a human designer and a human writer who cared — never like it was generated. This applies to UI copy, empty states, error messages, onboarding scripts, launch-kit templates, the copy deck, and landing page messaging alike.

- No em/en dashes as a stylistic tic, no "delve," "leverage," "seamless," "unlock," "elevate," "robust," or other AI-tell vocabulary. No listy, symmetrical, three-things-in-a-row patterns. No hedging filler, no "I hope this helps"-register language anywhere in the product.
- Sentences should read like a sharp human product writer wrote them once and meant every word — plain, direct, specific, occasionally imperfect in the way real writing is. Reread every string out loud before it ships; if it sounds like it came out of a prompt, rewrite it.
- The craft standard from the brief's §9 and §10 applies literally: verbs over nouns, outcomes over machinery, receipts instead of adjectives. This is an anti-AI-slop discipline, not just a tone guideline.
- The product's agents do real work behind the scenes and must be well served technically — fast, reliable, legible to each other — but the human on the other side of the screen is the primary user. Every screen is judged by whether a person would feel it was designed *for them*, not at them.

## Read this first, in full, before anything else

Before touching the codebase or any other reference material, read the attached brief completely, start to finish, until you actually understand it — not skim it for keywords. Return to it at every phase boundary and re-check your work against it. If this goal statement and the brief ever conflict, the brief wins.

Only after that, move to the repo's other documents — the design report, existing codebase, prior design-system artifacts, positioning notes — to ground yourself in current reality. The brief tells you what to do about it. One positioning note that outranks older docs: Supaprod is the **end-to-end product management operating system** — agentic-first, its sharpest claim is that it **tells you what to build** (building is commoditized; the decision cannot go wrong — and no competitor makes it: today it lives in the PM's head; Supaprod derives it from market signals, competitor moves, user feedback, and the product's own data), and it **learns your product, taste, and conventions as it works**. The brief's §5 carries the full statement; where any older doc still leads with "the decision and outcome operating system," read it through this update.

If you hit a genuine gap during the build — something the brief doesn't address and no other document resolves — you have standing authority to make a reasonable call and build it, per Prime Directives 7 and 8 and §16. Document the gap and your decision in the ledger using the §16 format rather than silently improvising or blocking. A gap is a reason to decide, build, and log — not to stall.
