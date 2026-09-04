# Threads and Artifacts: the two revisitable homes

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for Addendum 1.1 red-lines #5 (Threads home) and #6 (Artifacts home) of the design language spec. Created 2026-07-19.
> Source of truth read: `src/lib/conversations.functions.ts`, `src/lib/ask-thread.ts`, `src/lib/ask-promote.functions.ts`, `src/lib/memory-candidates.functions.ts`, `src/lib/prototypes.functions.ts`, `src/lib/docs.functions.ts`, plus web research on the mid-2026 state of Claude.ai, ChatGPT, Notion AI, v0, Lovable, and Devin.
> Companion mockup: [`../mockups/screen-9-threads-home.html`](../mockups/screen-9-threads-home.html).

---

## Part 1: how the field does it (mid-2026)

### 1.1 Conversation history

| Product | Sidebar | Search | Folders / grouping | Pin | Rename | Archive |
| --- | --- | --- | --- | --- | --- | --- |
| **Claude.ai** | Recents list, per-project scoped chat lists | Keyword search over all chats; the model can also search past chats as memory | Projects (flat bundles: instructions + knowledge + chats) | Star/pin to top of sidebar | Yes | Yes |
| **ChatGPT** | Flat recency list; important threads scroll away | Keyword search | Projects (flat, no nesting, no drag between, no bulk ops); real folders only via third-party extensions | No native pin outside projects | Yes | Yes (Settings > Archive, out of sight but kept) |
| **Notion AI** | Chats live beside docs; the durable unit is the page, not the chat | Workspace-wide search covers AI output once saved to a page | Notion's own page tree does the grouping | Page-level | Page-level | Page-level |
| **Devin** | Sessions list, filterable by creator, content, status, playbook, date | Yes, plus Cmd+K | Session categories and subcategories (GA in 2026) | Pin/unpin from the command palette | Yes | Sessions close rather than archive |

**Takeaways adopted.** (a) A flat recency list is the known failure mode (ChatGPT); grouping must exist day one. (b) Devin, the closest analog (agent sessions, not chat), converged on: filterable list + categories + pin from the palette — session organization is table stakes for agentic products. (c) Claude's project-scoped chat lists map exactly to per-product scoping. (d) Notion's lesson is the deepest: a conversation becomes durable by being **promoted into the knowledge system**, not by sitting in a list — which is precisely our promote-to-memory seam.

### 1.2 Generated-artifact libraries

| Product | Library | Naming | Versioning | Revisit / share |
| --- | --- | --- | --- | --- |
| **Claude artifacts** | Dedicated sidebar section, all artifacts across all chats, searchable, remixable | Auto-titled, renamable | Iterations within a chat; pin an artifact to project knowledge to detach it from chat scrollback | Open and continue any time; public share links |
| **v0** | Generations under projects; Git panel (branch per chat, PR to main) since Feb 2026 | Chat-derived | Forks + git history; each generation session otherwise independent | Deploy/preview URLs |
| **Lovable** | Projects dashboard per workspace | Project rename in settings | Versioning 2.0: history **with screenshots**, bookmark/favorite stable versions, quick restore, edits grouped by date like Google Docs | Remix copies a project (chat history toggle; version history never copies); share via publish |
| **Devin** | Outputs land in PRs/docs (Notion, Slack), not an in-product library | n/a | Git is the version store | Via the target system |

**Takeaways adopted.** (a) The artifact must be findable OUTSIDE the conversation that made it (Claude's artifacts sidebar; the founder's red-line says the same). (b) Lovable's Versioning 2.0 is the reference for revisit UX: visual history, named stable points, one-click restore. (c) v0's evolution (component dump → project + git) shows the library must be organized by **product**, not by generation event. (d) Devin's "outputs live in the target system" works only because PRs have GitHub; our specs, launch kits, and prototypes have no external home — so we must be the home.

---

## Part 2: what exists in the codebase today

### 2.1 Threads seams

- `conversations` table + `conversations.functions.ts`: list (last 50, `updated_at` desc, user-scoped), get (conversation + newest 80 messages), create (`title`, `model`, `project_id` nullable), **rename** (exists), delete (exists).
- `ask-thread.ts`: rehydration is hardened (PC-36: "nothing said in Ask may evaporate"), typed answer blocks, promoted-receipt chips survive refresh, `answerTitle()` already derives a title from the first answer line, `dayLabel()`/`needsDayDivider()` already do day grouping.
- `ask-promote.functions.ts`: an answer promotes to **note / decision / task**; `markMessagePromoted` writes receipt chips onto the message row (`metadata.promoted`) so a rehydrated thread never offers a duplicate save.
- `memory-candidates.functions.ts`: `proposeMemoryCandidate` is the wired "save this to the brain" affordance — workspace-scoped, injection-screened, conflict-detected (supersede-on-conflict preview), landing in a pending queue that `decideMemoryCandidate` approves into `agent_memory`. Promote-to-memory from a thread is **already one function call**; the review gate lives in Brain.

Honest gaps:

- GAP: **no search.** `listConversations` is a bare limit-50 list; no title or content search function exists (messages have no FTS index we can see from these seams).
- GAP: **no folders/grouping schema.** `conversations` carries only `project_id`; no folder table, no `folder_id`, no tags.
- GAP: **no pin, no archive.** No `pinned` or `archived` column on `conversations` (docs have `archived`; conversations do not).
- GAP: **no workspace/product filter on the list.** The list is user-scoped RLS only; a per-product view needs `project_id` filtering plus a workspace-scope variant, and mission threads (agent runs) are not unified with ask conversations in one listable set.
- GAP: **no source back-link on memory.** `memory_candidates` has no `source_ref` (conversation/message id), so an approved memory cannot cite the thread it came from.

### 2.2 Artifact seams

- `prototypes.functions.ts`: `prototypes` + `prototype_files` family — name, stable `share_slug`, `is_public` toggle, the `/p/$slug` public viewer, lineage recorded (`prd → prototype, relation: promoted`). List capped at 50, `updated_at` desc.
- `docs.functions.ts`: `docs` table — title, icon, **`parent_id` tree**, `project_id`, `archived`, `position`, tiptap `content_json` + extracted `content_text`. Full CRUD.
- Specs/PRDs, launch kits, reports live in their own domain tables (prds, etc.); `recordLineageSafe` is the shared provenance spine (parent kind/id → child kind/id → relation).

Honest gaps:

- GAP: **no unified artifact index.** Each family is its own table; a Library needs a registry view or union query (id, kind, name, product, updated_at, share state, lineage refs). Nothing exists.
- GAP: **no version history anywhere.** `publishPrototypeFromPrd` inserts a NEW `prototypes` row per publish (re-publishing duplicates rather than versioning); docs have only `updated_at`. No versions table, no restore, no named stable points (the Lovable 2.0 bar).
- GAP: **share is prototypes-only.** Docs, specs, launch kits, and reports have no share slug or public toggle.
- GAP: **no rename/delete on prototypes** exposed as server functions (name is set once from the PRD title).

---

## Part 3: the THREADS home (concept)

### 3.1 What it is

Every conversation in Supaprod — an Ask exchange, a mission thread, a teardown chat — lands somewhere revisitable. The Threads home is that somewhere: one surface, two scopes (**This product** / **All of Helio Labs**), with search, rename, grouping, and promote-to-memory. Nothing said to the machine evaporates; PC-36 made that true at the message layer, Threads makes it true at the navigation layer.

### 3.2 Where it lives (nav stays 4 doors)

Threads is **not a fifth global destination**. It is the archive behind the one input model:

- **Primary door:** a history affordance beside the always-visible Ask button in the TopBar (Addendum #4). Shortcut `G T`. Ask and its history are one system: the button starts a thread, the clock revisits one.
- **Second door:** the Composer's overflow ("Past threads") — you reach history from where conversations happen.
- **Third door:** Brain citations — an approved memory that names its source thread deep-links back (needs the `source_ref` gap closed).
- **Route:** `/threads`, deep link `/threads/$conversationId`. The founder's post-login landing ruling is untouched: returning users still land on Mission Control.

### 3.3 Anatomy (three panes, craft grid per Addendum #2)

1. **Rail (left):** scope switch on top (This product / All of Helio Labs), then system views — All threads, Waiting on you (gate count, same object/count as the tray), In the brain, Unfiled — then user folders (GAP: schema), then products as filters in workspace scope.
2. **List (center):** search field on top; rows grouped by day dividers (the `dayLabel()` seam, already built). Row anatomy on one internal grid: agent chip or "You" leading, one prose title (renamed or `answerTitle()`-derived), one snippet line, right-aligned mono time; below, evidence chips only when real — artifact chips (SPEC-52), "In the brain" memory chip, folder chip. **No colored edge strips; no floating timestamps.** The single ember locus of the screen is the one thread carrying an open gate (row chip = tray card = same object, one count).
3. **Preview (right):** the selected thread's header (title, rename, kebab: move to folder / copy link / delete), the last exchange, the promoted receipts it already carries (note/decision/task chips from `metadata.promoted`), and the action row: **Continue this thread** (opens where it lives — mission threads reopen Mission Control, ask threads reopen the composer overlay with history), **Save to the brain** (fires `proposeMemoryCandidate`; the chip flips to "Pending review in Brain", honest about the gate), and the forward door per the NextLine rule.

### 3.4 How it relates to the Composer thread column and Brain

- The Mission Control **Thread column is a thread**, not a different species: the room shows the live one, Threads home lists them all. Opening a mission thread from Threads is spatial (you return to the room), never a second renderer.
- **Brain is where promoted lines live; Threads is where they come from.** Promote-to-memory proposes a candidate; Brain's review queue approves it into `agent_memory` (curate-at-write, RPT-28). The thread row then carries the gold memory chip — memory grammar only, never decoration.

### 3.5 Backend the concept needs (register of gaps)

- GAP: `conversation_folders` table (id, workspace_id, name, position) + `folder_id` on conversations.
- GAP: `pinned_at`, `archived_at` on conversations.
- GAP: `searchConversations` server function (title + message content; messages FTS index).
- GAP: unified listing across ask conversations and mission threads (a `threads` view keyed by kind).
- GAP: `source_ref` on `memory_candidates` for the Brain back-link.

---

## Part 4: the ARTIFACTS home (concept)

### 4.1 What counts as an artifact

Anything the machine made that outlives its conversation: **interactive prototypes** (`prototypes`, `/p/$slug`), **generated HTML/scaffolds** (`prd_scaffolds` before promotion), **specs/PRDs**, **docs** (tiptap), **launch kits**, **reports/digests**. Test: if losing it would make someone re-run an agent, it belongs in the home. Working intermediates (retrievals, traces) stay behind receipts in the Engine Room.

### 4.2 Naming (plain words, no mechanism names)

1. **Library** — recommended. Plain, instantly understood as "the finished things live here", says nothing about how they were made, survives every future artifact type, and pairs cleanly in nav prose ("in Relay's Library"). "Artifacts" itself is a mechanism word (and Claude's word); "Generations" is worse.
2. **Shelf** — warmer and shorter; risks reading cute at enterprise, and "the Shelf" strains in a sentence.
3. **Made here** — the most honest ("everything made here"); as a label it is two words and awkward as a route/noun ("open Made here").

### 4.3 Where it lives (evaluation)

- **Inside Brain:** rejected. Brain is the memory room speaking gold; artifacts are outputs, not knowledge. Mixing them dilutes the one-room-one-voice identity and buries per-product work in a workspace room.
- **Own drawer:** rejected as the home. Drawers are peeks (one level); a named, revisitable home that exists only as a slide-over is not a home. A drawer may *open from* a receipt chip, but it cannot be the address.
- **Per-product Library tab on the canvas rest face:** adopted, extended. Artifacts belong to products, and the rest face is already the product at a glance (Shipped, What memory holds); a Library tab completes it. The extension: the tab opens the same registered surface at `/library` with the product pre-filtered, and a scope switch reaches All of Helio Labs — the identical two-scope pattern as Threads, so the two homes teach each other.

### 4.4 Versioning, revisit, share

- **Versioning (GAP: all new):** one `artifact_versions` spine (artifact kind + id, version number, snapshot ref, label, created_by) rather than per-family tables. The bar is Lovable 2.0: history grouped by date, **named stable points** ("Bookmark this version"), one-click restore behind a dry confirm — the restore surfaces as a ReceiptLine with Revert, per spec 6.4.
- **Revisit:** every artifact card is a deep link (`/library/$artifactId`), renders through the same three-fidelity contract (glyph row → peek card → full face), and carries NextLine forward doors ("Design it", "Ship it") so the Library never dead-ends.
- **Share:** extend the prototypes pattern (stable slug + private-by-default public toggle + the existing `/p/$slug` viewer) to docs, specs, and launch kits. GAP: share columns + viewers for those families. Lineage chips (built from SPEC-52) come free from `recordLineageSafe`.

---

## Part 5: registry entries (both required by Addendum 1.1)

The surface registry (charter req. 6, CI-asserted deep links) gains two rows:

| id | name (plain words) | route | deep link | scope | empty state (WarmSlot) |
| --- | --- | --- | --- | --- | --- |
| `threads` | Threads | `/threads` | `/threads/$conversationId` | product + workspace | "Nothing asked yet. Ask anything and it lands here, saved." |
| `library` | Library | `/library` | `/library/$artifactId` | product + workspace | "Nothing made yet. Run a journey and its work lands here." |

Both declare: owner surface (Threads: the input system; Library: the product rest face), their doors (3.2, 4.3), keyboard entries (`G T`, `G L`), and the CI assertions (stable deep link, at least one forward door on every artifact card, one count from one source for the gate chip Threads can carry).
