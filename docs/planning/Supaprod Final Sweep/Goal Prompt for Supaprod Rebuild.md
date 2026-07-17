# Goal — Supaprod Front-End Rebuild (final sweep)

Read `docs/planning/Supaprod Final Sweep/Supaprod Front-End Rebuild.md` (Master Brief v2.2) completely, start to finish, before touching code or any other document. Where this goal is silent, the brief governs; where they conflict, the brief wins. For this build the brief supersedes DESIGN-TEMPO.md, the supaprod-tempo skill, and all v1-v5 design artifacts, including where CLAUDE.md says otherwise.

**Mission:** rebuild Supaprod's front end (backend only where the experience truly needs it) from a cluttered, plumbing-exposed app into a minimal, conversational, agentic product-lifecycle platform: Vercel-grade craft, three-surface IA (Home / Project / Approvals), the Ink design system, shipped to a sandbox in 2-3 days, customer- and YC-ready in ~4.

**Stakes:** this is the FINAL sweep. Five design systems came before; none fixed the core problem; there is no seventh pass. The result must be premium, calm, light: a user understands it in ten seconds, is never overwhelmed, and gets the job done from one place.

**How to hold the brief:** it is a standard to meet or beat, not scripture (its PD 8). Hard invariants that always bind: the name Supaprod, exact spelling; sandbox-only, production untouched; the public landing page changes ONLY with Rohit's explicit approval — prepare suggestions, never apply; honest claims — the UI never claims learning the backend doesn't do; humanized output — no AI-tell copy anywhere in the product; never silently cut scope. Everything else is a baseline: if you find a demonstrably better way to hit the brief's Objective and Success Criteria, build it and log the deviation in the decision ledger. Blind literal compliance is a failure mode; so is silent drift.

**Non-negotiables in the work:**
- Nothing goes orphan (§7): justify-or-cut kills surfaces, never capabilities. Every capability behind today's ~67 routes stays reachable — command surface, spine stage, or a progressive-disclosure door. Phase 1 delivers the capability coverage matrix.
- Model orchestration (§11): a per-surface routing table, Auto by default, operator pins on demand; control tiers per §11; zero model or vendor names baked into product code.
- Positioning (§5): the end-to-end product management OS, agentic-first; it tells you what to build from evidence — no competitor makes that call; it learns your product as it works. Users only ever see credits; keys are an enterprise-edge option, never the judgment core.
- Design (§9): Ink, dark-first with first-class light and System themes; landing tokens inherited, starfield on landing/auth only; taste calls are yours — research the world's most-loved products and decide before building; don't prototype to decide, don't route taste to Rohit.

**Method:** phases in order — Audit → Architecture → Design System → Screens → Integration & Purge → Demo Data → Review Gauntlet (all six judges plus the mechanical sweep). Use the installed skills, MCPs, and plugins; verify DB facts through the Supabase/Lovable MCP, never guess; verify every journey live with Playwright in the sandbox. Route your own tokens per §13: cheap models for mechanical work, strongest models for judgment. Commit and push to the remote sandbox branch after every coherent unit and at least every 30-45 minutes; keep PROGRESS.md current; never let a session end with unsaved work.

**Done means §17:** all success criteria pass in the sandbox on seeded demo data; ledgers, copy deck, coverage matrix, and gap report delivered; the 5-minute founder demo script rehearsable; open decisions returned with recommendations.

When blocked or facing a risky call, ask Rohit in the §16 format — he prefers a question to a wrong assumption. A gap you can safely decide is a reason to decide, build, and log, not to stall.
