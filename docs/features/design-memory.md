# DSN-01 — Design memory

> Status · Shipped 2026-07-03 · Route(s) `/knowledge?tab=design` · Owner: `src/lib/design-memory.functions.ts`

## What it does

The workspace's design language (colors/tokens, type, spacing, principles, voice, recurring UI
patterns) as first-class brain content: each entry is a standing decision with provenance, a
human approve/reject gate, and supersession ("we moved from blue to ember, because..."). Seeded
three ways: import a public URL (the server fetches it and an AI extracts a design-language
summary), paste a design constitution, or accept a small generic starter set and let the
workspace teach it from there. Every DEF-04 scaffold generation binds the workspace's approved
design memory so a mockup comes back in THEIR product's language, and every approve/reject on a
generated scaffold writes back a candidate learning.

## Why it exists

v12 names this the empty cell in the design-tooling market: every mid-2026 tool (v0 registries,
Figma agent, Magic Patterns style files, Lovable knowledge) grounds generation in a CONFIGURED
design system. Nobody LEARNS a team's design language from what it ships, approves, and rejects.
Design memory is decision memory pointed at design — the same compounding-decisions moat applied
to a new dimension. See [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §6.

## Where to find it

- Brain → **Design** tab (`/knowledge?tab=design`): list, filter by category/status, approve or
  reject a pending entry, "Add design language" to seed via URL/paste/defaults.
- PRD detail → the DEF-04 design-mockup panel: once the workspace has approved design memory, a
  generated scaffold uses it; "Good fit" / "Not a fit" under the mockup writes back a learning.

## Demo script

1. Open `/knowledge?tab=design` on a fresh workspace (no rows yet) → "Add design language" →
   "Use defaults" → a small generic starter set lands, auto-approved.
2. Open any PRD with a spec body, generate a design mockup (DEF-04 panel) → the mockup follows
   the default type scale / spacing / one-primary-action principle instead of the flat generic
   indigo template.
3. Back on the mockup, click "Not a fit" → a toast confirms a candidate learning was drafted; on
   `/knowledge?tab=design` a new `pending` / `learned` entry appears citing the spec.
4. Approve it. Paste a real brand constitution via "Add design language" → "Paste constitution" →
   entries land `pending`; approve one whose title matches an existing approved entry (e.g. a new
   "Accent color") → the old entry silently retires once the new one is approved (supersession).

## How it works

- **Storage** — `design_memory` table (migration `20260703140000_dsn01_design_memory.sql`),
  workspace-scoped, RLS via `is_workspace_member` (read + write), `status` is
  `pending | approved | rejected` (mirrors `decisions` / `house_rules`).
- **Supersession** — mirrors `house_rules` exactly: retired-ness is DERIVED from an
  `artifact_lineage` edge (`relation='supersedes'`, parent=the new entry, child=the old one),
  never a status flag. `design_memory` was added to `ArtifactKind`
  (`src/lib/lineage.functions.ts`) and `GraphNodeKind` (`src/lib/knowledge-graph-view.ts`, so
  supersession edges render on `/knowledge?tab=graph` with zero extra UI work). Auto-detected on
  extraction: a new item whose (category, normalized title) matches an existing active row is
  treated as a replacement and the edge is written immediately; the pure derivation —
  `filterActiveDesignMemory` — is unit-tested independent of the DB
  (`src/lib/design-memory.functions.test.ts`).
- **Extraction** — one shared LLM step (`surface: "sense"`, strict JSON) feeds all three seeding
  paths: `importDesignMemoryFromUrl` (fetches a public page server-side, `redirect: "manual"` and
  an inline SSRF guard — https-only, blocks private/internal hosts including IPv4-mapped IPv6
  literals — modeled on `src/lib/url-safety.ts`), `importDesignMemoryFromText` (a pasted
  constitution, no fetch), and `recordDesignScaffoldFeedback` (the scaffold approve/reject
  write-back, mirrors `extractAssumptions`'s fail-safe contract in `src/lib/ai/assumptions.server.ts`
  — never throws into the UI action). `seedDefaultDesignMemory` skips extraction entirely (a
  fixed starter set, auto-approved, idempotent — a no-op once the workspace has any row).
  Extracted content is screened with `assessAndQuarantine` before storage (untrusted external
  text reaching an AI-consumed store).
- **DEF-04 binding** — `getActiveDesignMemoryForWorkspace` + `formatDesignMemoryContext`
  (`src/lib/design-memory.functions.ts`) are called from `generateDesignScaffold`
  (`src/lib/design-scaffold.functions.ts`) and injected into the prompt as a labeled reference-data
  block, with a matching system-prompt guidance sentence appended only when the block is present
  (byte-identical prompt for a workspace with no design memory yet — the same conditional-block
  idiom `critic.server.ts` uses for precedent/contradiction/governing-decision context).
- **UI** — `src/components/knowledge/DesignMemoryPanel.tsx` (list + filters + approve/reject +
  the add dialog), `design-memory-shared.ts` (label maps, mirrors `decisions-shared.ts`), wired as
  a new tab on `/knowledge` (`_authenticated.knowledge.tsx`). `DesignScaffoldPanel.tsx` gained
  "Good fit" / "Not a fit" buttons under the generated mockup.

## Governance & guardrails

- Every entry from URL import, paste, or scaffold feedback lands `pending` — a human approves or
  rejects before it can bind into a future prompt. Only `seedDefaultDesignMemory`'s generic
  starter set auto-approves (it makes no claim about the workspace's actual brand).
- SSRF: `importDesignMemoryFromUrl` requires `https:`, rejects private/loopback/link-local IPv4,
  cluster/metadata/internal hostname suffixes, and IPv4-mapped IPv6 literals, and never follows a
  redirect (a 3xx is treated as a failed fetch, same as `connectors/mcp/client.server.ts`).
  **2026-07-03 fix:** `isPublicHost` normalizes a trailing DNS-root dot before comparing —
  `new URL(...).hostname` preserves it verbatim (`"localhost."`), and any resolver treats that
  identically to the bare name, so every exact-match/`.endsWith()` blocklist check could be
  bypassed just by appending `.` to a blocked host (`localhost.`, `metadata.google.internal.`,
  any `*.internal.`/`*.local.`). Found by automated security review, confirmed exploitable, fixed
  with a regression test. See `plan.md` §4 ("SSRF trailing-dot bypass").
- Prompt injection: extracted title/content is screened with `assessAndQuarantine` before storage,
  and the prompt block that carries it into DEF-04 is explicitly framed as visual-style reference
  data only, with an instruction never to treat it as new content/links/forms/behavior.
- RLS scope: `design_memory` is workspace-member read/write. `artifact_lineage` (used for the
  supersedes edge) is owner-scoped (`auth.uid() = user_id`) — the same pre-existing constraint
  `house_rules` and `decisions` already carry, not new here.

## Verification checklist

- [x] `bunx tsc --noEmit` — 0 errors.
- [x] `bun test` — 2127/2127 pass at ship (16 new: `filterActiveDesignMemory`,
      `formatDesignMemoryContext`, `parseExtractedItems`, and 6 `isPublicHost` SSRF cases incl.
      the IPv4-mapped-IPv6 bypass). **2026-07-03:** +1 regression test (17 total in
      `design-memory.functions.test.ts`) for the trailing-dot bypass fix above; full suite
      2191/2192 pass at that fix's ship (the 1 fail + 1 error are pre-existing, unrelated
      env/dependency issues — a missing `stripe` package and missing Supabase env vars in the
      dev shell — not a regression from this fix).
- [ ] `bun run build` — blocked by this worktree's known pre-existing node20/ESM `vite build`
      failure (`lovable-tagger` CJS/ESM incompatibility), unrelated to this change; not a
      regression (see the dashboard's recurring note on this same limitation for OBS-02/03).
- [ ] Live publish-verify: seed defaults, generate a mockup, approve/reject, confirm the learning
      write-back and the supersession UI on a live workspace (founder/Lovable publish step).

## Known limits / out of scope

- `importDesignMemoryFromUrl` extracts from raw markup via an LLM, not a real headless-browser
  computed-style read (not available in this Worker runtime) — good enough as an approve/reject
  starting point, not a pixel-accurate token extractor.
- The SSRF guard checks the literal hostname/IP, not the address `fetch()` actually connects
  to — a public DNS name that resolves to a private IP at request time (DNS rebinding) is not
  caught. Inherited from `url-safety.ts`'s own documented gap; a real fix needs an
  egress-filtering proxy or resolver control this Worker runtime does not have.
- Supersession matching is a same-batch snapshot: two items in the same extraction call that
  target the same (category, title) slot won't supersede each other (the active-rows lookup runs
  once before the insert loop). A rare edge case given the extraction prompt asks for distinct
  entries; not fixed here.
- No brain-stat-strip count added (the `/knowledge` header's "signals / meetings / decisions /
  learnings" row) — out of this item's scope, a one-line follow-up if wanted.
- DSN-02 (the Critic's design lens) is shipped: `formatDesignMemoryContext` is reused there
  unchanged, exactly as planned — see [`critic-agent.md`](./critic-agent.md#dsn-02-the-design-lens).

## Related

- [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §6 — the design-leg canon
  (DSN-01 through DSN-05).
- [`house-rules.md`](./house-rules.md) — the sibling standing-decision pattern this mirrors.
- [`decision-brain.md`](./decision-brain.md) — the supersession/provenance vocabulary origin.
