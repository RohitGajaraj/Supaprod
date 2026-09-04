# The Gap Register

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Phase R synthesis, 2026-07-19. Every `GAP:` line from every research file under this folder, collected, deduplicated, and given a verdict. Nothing is silently ignored.
> Verdicts: **ADD** (build in this rebuild sprint, sandbox branch), **CLUB** (fold into an existing surface, mechanism, or already-scheduled lane rather than a new build), **DEFER** (consciously postponed, with the why and the trigger that revives it).
> Source key: DS = design-systems-study, VV = vocabulary-and-voice, CC = teardown-codex-cursor, LR = teardown-linear-raycast, LV = teardown-lovable-v0, RP = teardown-replit, DV = teardown-devin-agent-management, IA = ia-reclustering, JC = journey-catalog, BE = build-engine-strategy.
> Count: 62 raw GAP lines resolved into **55 register entries** (duplicates merged, merges noted inline).

---

## A. Design language and tokens (5 entries, all ADD)

**A1. Voice ramps missing from ink.css** (DS). `ink.css` has no dim/faint/border tiers for the voices, so ambient always-on surfaces (Working strip, Spine) would over-saturate or invent inline rgba. **ADD**: land the five-tier ramps for ember, machine, and memory (with light-mode siblings) as the first token commit of the sprint, before any Mission Control component. Spec section 2.1 carries the exact values.

**A2. Working amber collides with memory gold** (DS). `--verdict-working #D9A13C` is perceptually the same hue as `--voice-memory #E8B44C`, and the working state already speaks blue via `ink-working`. **ADD**: delete the amber token in the same commit as A1; working states use the machine ramp everywhere. Cheap, and it prevents the rebuild from re-importing the collision.

**A3. Agent attribution rides color alone** (DS). Several surfaces attribute machine work with blue text and nothing else, which fails grayscale, colorblindness, and screenshots. **ADD**: one shared attribution atom (mono agent-name chip + machine treatment) used on every machine-authored row, message, and face header. It is a single small component and the grayscale test then enforces itself.

**A4. No codified motion budget** (DS). The app has only `--ink-fast/slow`; without the frequency table the rebuild recreates the over- or under-animated extremes. **ADD**: the three-class budget table now lives in the design language spec (section 5.1) and becomes a review gate; no separate build work beyond honoring it.

**A5. No starfield app presets** (DS). The mockup gate cannot judge starfield-in-app without frames built from real reduced-density variants. **ADD**: expose `variant="app-idle" | "brand-moment"` presets on `LandingBackdrop` (parameters already exist) so the gate reviews frames, not principles.

---

## B. Vocabulary and copy infrastructure (6 entries)

**B1. No rotation infrastructure for working lines** (VV). One `relayVerb` per agent means the ticker visibly repeats within minutes. **ADD**: ship the per-stage decks (12 lines each) plus per-agent signature lines as data (`relayDeck` on the catalog entry) and one `drawWorkingLine(stage, slug, seed)` helper consumed by both the Working strip and the Spine so they can never disagree.

**B2. ACTION_LABEL covers 10 tool ids** (VV). Everything else collapses to "working", so most engine activity reads identical. **CLUB** into the tool registry: make an outcome-named label a required field on tool registration, with a lint that fails on a registered tool without one. The sprint adds the lint and labels the tools its surfaces actually render; full back-fill rides the engine lane.

**B3. No product-wide action registry** (VV). The same act carries different button labels across surfaces and nothing enforces one name per action. **ADD**: ship the typed `ActionSpec { id, button, helper, toast }` map beside `agent-vocabulary.ts` with the 15 canonical actions, plus the CI check that primary buttons reference a registry id.

**B4. No button-to-toast pairing contract** (VV). Some actions confirm, some complete silently. **CLUB** into B3: the ActionSpec map closes this by construction (every primary action declares its toast or explicitly declares none).

**B5. No duration-estimate field on runs/steps** (VV). Working lines cannot honestly say "about 4 minutes". **CLUB**: the sprint ships the elapsed-only time slot (the copy shape already defines the honest fallback); the per-step estimate from historical durations is a small engine-lane addition, and the PulseLine picks it up with zero UI change when it lands.

**B6. Ember is a color, not a copy contract** (VV). Needs-you strings are not required to say what approval sets in motion. **ADD**: the three-clause ember contract is now binding in the spec (6.3) and joins the review gates; gate-card copy in the sprint is written to it.

---

## C. The Composer and input model (5 entries)

**C1. No prompt queue** (LV). Input surfaces block or drop input while agents work. **ADD**: a visible queue above the Composer (reorder, edit, remove, pause) dispatching sequentially. Client-side state over the existing dispatch functions; it makes the one-input model feel powerful and kills dead time.

**C2. No first-run seeded example-journey chips** (LV). A brand-new workspace opens empty instead of offering outcome-shaped one-liners against demo data. **ADD**: journey chips are core Composer anatomy and the demo seed exists (`demo.functions.ts`); first-run pre-populates the chips so minute one is watching agents work. This is also the onboarding (spec section 8).

**C3. No toggleable saved-instruction chips** (LV). v0-style per-message instruction toggles need a saved-instructions backend that does not exist. **DEFER**: not load-bearing for comprehension or any charter journey; revisit when the knowledge/skills increment (G-cluster) lands, since saved instructions are the same object family. The Composer's chip grammar is designed so they slot in without rework.

**C4. Voice input, corrected: it already exists** (RP claim refuted against code). AskPanel ships dictation and read-aloud today (`useDictation`/`useReadAloud` from `src/hooks/use-voice.ts`, tested). Not a gap. **ADD as a port-forward requirement**: the new Composer carries the mic and read-aloud affordances over; dropping them would be a silent scope cut.

**C5. No alias/hotkey layer for journeys** (LR). Power users cannot bind "teardown" to a journey. **DEFER**: cheap stickiness but only after the Composer exists and journeys are stable; revive in the first post-launch polish pass alongside C3.

---

## D. Gates and approvals (7 entries)

**D1. No snooze/defer semantics on gates** (LR). A PM who cannot say "not now, re-ask after standup" will rubber-stamp or bottleneck. **ADD**: snooze as a tray verb (H) with resurface on time or new mission activity; one `snoozed_until` (+ resurface reason) addition to the queue read, keyed into the existing decide entry point. Linear treats snooze as a first-class triage verb for good reason.

**D2. No named gate ownership or rotation** (LR). In a multi-human workspace gates will sit. **DEFER**: single-operator workspaces dominate until the team tier (G-TEAM); build ownership + rotation when multiplayer lands. The gate card anatomy reserves the owner slot so the addition is non-breaking.

**D3. Gate cards lack a standing agent recommendation with receipts** (LR, DV convergence). The decision should be confirm/override, never research. **CLUB**: the queue already carries evidence and consequence pairs per family; the sprint's GateChip anatomy adds the recommendation line wherever the engine provides one (Critic verdicts, brief alignment, track record) and renders evidence-only where it does not. Engine back-fill of recommendations per family rides the engine lane; the card never invents one.

**D4. No standing-consent memory in approvals** (DV). Every gate asks fresh; no "always allow for this agent" ledger. **CLUB**: trust graduation already exists (`trust_graduation` family, TrustDial) and IS the standing-consent mechanism for tool gates; the sprint surfaces graduation offers on the relevant gate cards ("12 clean approvals in a row: let it run without asking?") and lists granted arcs in Agents > Autonomy. A general per-action consent ledger beyond the arc model defers to the engine lane.

**D5. No typed mission-state vocabulary** (DV). "Waiting on you" is one undifferentiated bucket. **ADD**: one TS union (`Plan ready`, `Awaiting your decision`, `Blocked on access`, `Building`, `Shipped`, ...) derived from existing mission/queue statuses, rendered identically by the Spine, tray, SurfaceHeader, and strip. Display-layer typing over existing data; no schema change.

**D6. The spend approvals bucket is empty** (JC). The queue declares a "spend" filter but nothing routes into it; shipping an always-empty bucket recreates the "half-cooked" verdict. **ADD** (by subtraction): drop the bucket from the tray until the spend-gate read exists. The engine-lane trigger to revive it is the per-task pre-authorization hold (I4).

**D7. No mid-run steer or stop affordance** (CC). Runs read as start-then-wait. **CLUB**: `steerStudioSession` and `cancelMission` exist; the sprint surfaces steer + stop on the Build face and the Working strip entry for any mission (cancel parity is engine-wide). Broader mid-run instruction editing for every stage defers with the agentic driver.

---

## E. Visibility, receipts, and depth (8 entries)

**E1. Per-response cost Details view unwired** (LV). The runtime logs cost at the chokepoint but no user-facing kebab/Details surface exists, nor the Settings Breakdown/History dialog. **ADD**: the kebab Details panel on responses and mission receipts (exact rounded credits + plain-language drivers) reading the existing cost logs, and the Plan & Usage Breakdown/History tabs. This is charter requirement 5 made real; the founder-mandated pattern is fully specced (spec section 7).

**E2. No away-from-app notification channel** (CC). No push, email digest, or deep links for "an agent finished / needs you", capping the async value of a gate product. **DEFER**: real infrastructure (email/push provider, token plumbing) outside a front-end sprint; the notification preference matrix already exists in Settings, so wire the digest as the first post-sprint increment. In-sprint, the Working strip + tray badge carry presence.

**E3. No artifact viewer contract for non-code outputs** (CC). Threads cannot inline-render PDFs/decks/sheets an agent produces. **CLUB**: the drawer's thread-as-container renders markdown, HTML, and image artifacts inline in the sprint (covers every artifact current journeys produce); a general document viewer (PDF/deck) defers until an agent actually emits those.

**E4. No checkpoint/rewind primitive** (RP). Nothing restores product state to before a pass as one unit. **DEFER**: a product-wide restorable checkpoint (artifacts + decisions + memory) is a deep engine primitive. The sprint ships the honest subset: Build-face revert via `revertToRevision` rendered as a receipt action, and receipts as the narrative unit. Revive as an engine-lane epic when the journey-run record (F1) exists to anchor it.

**E5. No visible self-verification loop** (RP). Agents do not test their own output where the user can watch. **DEFER**: browser-driving verification is real infrastructure (and Replit built a proprietary system for it). The sprint renders what is wired honestly: CI runs, check results, and preview links on the Build face. Revive with the agentic driver (I3), which is where self-verification naturally lands.

**E6. Isolated candidate work with Apply/Dismiss** (RP). Agent output should stage in isolation and merge only on explicit apply. **CLUB**: for Build this exists (staged changesets, hunk-level accept/reject, apply); the sprint renders it in the Apply/Dismiss grammar with "nothing touches your product until you approve" stated on the face. Extending isolation to non-code artifacts defers (drafts already behave this way de facto: specs and kits are inert until approved).

**E7. No surface names the driver on a mission receipt** (BE). The 2026-07-10 ruling has no UI home. **ADD**: one quiet line in the receipt's kebab Details ("Driver: Supaprod native"), reading the session row. Blocked only on the driver rename honesty item (I1) for its wording.

**E8. No live terminal/log-stream face for Build** (JC). No pty/streaming primitive exists. **ADD** (by scoping): the Build face ships as plan + diff + CI + steps-from-traces + preview, which is fully wired; the terminal pane defers to the agentic-driver lane. Copy never promises a terminal.

---

## F. Journeys and automation (7 entries)

**F1. No first-class journey-run record** (JC). Journey state must be re-derived every render from stage_events, artifacts, missions, and the queue; resume, naming, and the multi-lane stack all get sturdier with a row. **ADD**: one lightweight `journey_runs` table (id, journey kind, anchor artifact, entered/exited stages, status). It is the single backend addition the front end genuinely needs this sprint; every lane, resume, and slice-highlight behavior anchors on it.

**F2. J7 is attestation, not measurement** (JC). No automatic pull of live product metrics against the outcome contract exists. **ADD** (copy honesty): the Learn face and J7 present "record how it landed" with evidence assembled, never "we measured". The metric feed is an engine-lane item; the face's language flips only when it lands.

**F3. Launch kit has no outbound channel wiring** (JC). Nothing sends or schedules the drafts. **ADD** (by scoping): J6 ends at "copy in hand" with copy-out affordances per channel; publishing integrations defer to the connector lane on user pull.

**F4. J2 on a raw pasted idea needs a seam** (JC). Tearing down a composer-pasted idea requires a throwaway opportunity row; no single server call composes it. **ADD**: one small server function ("paste and tear down") so the flagship adversarial demo is one action. Smallest backend item in the register with the highest demo leverage.

**F5. No scheduled-automations surface** (CC). Codex Automations (trigger + prompt + isolation) landing in a triage inbox is a shipped pattern. **CLUB**: Supaprod's governed Loops already exist (`loops.functions.ts`, receipts, results landing in the one queue); the sprint surfaces J-LOOP ("make this recurring" on any completed pass) instead of building a parallel automations system. User-authored arbitrary-prompt automations defer.

**F6. No inbound feedback loop from shipped artifacts** (CC). External review comments (GitHub PR reviews, stakeholder notes) never become revise instructions on the originating mission. **DEFER**: a real integration lane (webhook ingest exists but not comment-to-instruction mapping); high value, post-launch. The Send back verb continuing the same thread is the in-product half and ships now.

**F7. No best-of-n candidate generation** (CC). **CLUB**: fan-out exploration already exists for Decide (`dispatchExploration`, three children reconciled into one card) and is surfaced in J2; a general "generate 2 candidates" chip for PRDs and design directions defers until the routing table (I2) makes it one config away. (Merged with the Replit parallel-variants observation for the Design face.)

---

## G. Agents, knowledge, and skills (10 entries)

**G1. Tool approval modes have no management surface** (DV + IA convergence). `auto/confirm/review` exists in code; users cannot see or change it anywhere findable. **ADD**: the Agents settings group per the IA proposal (Roster + Autonomy & approvals + Models & keys + Skills), which is roughly 80 percent relocation of ControlsPanel, TrustDial, StaffTab, and ModelsTab. Approval modes render as plain rows ("runs alone" / "asks first" / "needs review") reusing `resolveApprovalMode` semantics verbatim.

**G2. No per-agent tool-grant matrix** (DV). No way to say "Measure may read PostHog, Engineer may not", no read-only grant mode. **DEFER**: new backend (grant rows against the connector registry); enterprise-shaped. The sprint ships the read-only "what can this agent touch" glance in the crew drawer from `describeToolsForPrompt` data. Revive at G-TEAM.

**G3. No knowledge/skill objects with editable trigger descriptions** (DV; merges RP's user-authored skills gap and IA's skills-import gap). The 2026-converged mechanism (Devin, Claude, Lovable, Replit all ship it) does not exist: no authorable item with a legible "when" sentence, no import path, no per-agent attachment. **DEFER** as one named engine-lane increment ("Knowledge & Skills"): schema (item = when + content + scope), authoring UI in Agents > Skills, import, and the Composer `/` invocation. The sprint ships what is wired (skill-pack export) and nothing that claims more. This is the largest deliberate deferral in the register; it is a product pillar ("learns your product" needs it), just not a front-end-sprint pillar.

**G4. No post-run learning loop surface** (DV). Nothing proposes editable knowledge updates after a correction or rejection; "learns your product" is invisible. **CLUB**: the engine already emits memory candidates, house-rule proposals, and playbook proposals into the one queue; the sprint renders them as suggestion cards with edit-before-accept in the gate grammar ("Save this as a rule?"). The full Devin-style diff-on-update editor rides the G3 increment.

**G5. No per-product knowledge/instructions backend** (IA). The brief and voice anchor are workspace-wide only; `projects` has no instructions field. **DEFER** to the engine lane (one column + prompt injection); the crew drawer design reserves the panel. Small, but backend, and the workspace brief covers the demo path.

**G6. No per-agent custom instructions** (IA). One voice anchor serves all 13 agents. **DEFER** with G5 (same shape: one field + injection); revive together as the smallest slice of the G3 increment.

**G7. No per-agent model override** (IA). Model choice is per-user profile-wide. **DEFER**: the capability-class routing table (I2) is the right substrate; per-agent overrides become a config row on top of it. Revisit after the table ships.

**G8. No outbound MCP/custom-tool grants** (IA). The tool registry is a closed native set; interop is inbound only. **DEFER**: real backend (server registry, vault credentials, per-agent grants); enterprise pull decides timing. The Connect surface design keeps one catalog so it lands without a second taxonomy (the Claude directory lesson).

**G9. No usage analytics on configuration** (DV). Nothing shows whether an instruction or knowledge item ever influenced a run. **DEFER**: meaningful only once G3 exists; build times-used/last-used into the G3 schema from day one so it is never a retrofit.

**G10. No structured brand asset intake** (IA; merges LV's Themes-panel gap). Design memory is text extraction only: no logo upload, font intake, hex token editor, or Figma export. **CLUB + DEFER split**: the sprint ships Settings > Workspace > Brand as the one-time feed door on the wired DSN-01 backend (URL import, paste, defaults, summary state) and strips configuration out of the Design stage. The structured layer (logo + named colors + fonts as typed fields) and a live Themes-style token panel defer to the design-stage lane; the Brand card's layout reserves the slots.

---

## H. Design stage (1 entry)

**H1. No before/after loop on design outputs** (LV). No select-element, tweak, compare, version cycle; table stakes in Lovable and v0. **CLUB + DEFER split**: the sprint's Design face ships the honest half on wired capability: live scaffold in an iframe, revision history as versions, a before/after toggle between scaffold revisions, and reject-with-notes feeding the next pass. Element-level select-and-tweak (visual editing) defers to the design-stage lane; it is an editor, not a face.

---

## I. Build engine (5 entries; all governed by the Gate #1 memo)

**I1. Driver naming outruns wiring** (BE; merges the RESERVED_BUILD_DRIVER_IDS registry misreport). The `claude-sdk` id names a single-shot patch generator, and the registry misreports which engines are implemented. **CLUB** into the PC-35 lane as its first honesty task (rename or re-scope + fix the reserved list), sprint-blocking only for the receipt string (E7): the UI names no driver until this lands.

**I2. Hard-coded vendor model ids; no capability-class table** (BE). Two Master Brief violations in product code. **ADD** (founder decision 2 at Gate #1 requests exactly this): the `codegen.economy|standard|frontier` config table beside the chokepoint, read by both drivers. One small module; makes every future model release a config change.

**I3. No execution sandbox for an iterative driver** (BE). **DEFER** to the PC-35 lane by design (sandbox selection is explicitly not a front-end decision). The Build face and copy are scoped to the patch-driver promise until it exists.

**I4. No per-task credit pre-authorization hold** (BE). One runaway agentic task could drain an allowance. **DEFER** to the PC-35 lane, flagged mandatory before the agentic rung reaches paying users; also the trigger that revives the spend approvals bucket (D6).

**I5. Patch driver never live-tested** (BE). **CLUB**: the dry run on a test repo is authorized at Gate #1 (decision 5) and runs in the PC-35 lane inside the sprint window; the Build journey presents the native floor until the flag flips.

---

## J. Billing safety (1 entry)

**J1. No hard budget cap or threshold alerts in the credits UX** (RP). Under effort-style billing this is a launch-blocking trust gap (Replit's loudest criticism). **CLUB** into the pricing/billing lane with a pre-paid-launch gate: caps + alerts land in Plan & Usage (the notifications matrix already has a Spend & Budgets row to wire to). Verify against `docs/strategy/pricing/pricing-architecture.md` when that lane opens; the sprint ships the Settings layout with the cap control present only if the ledger supports enforcement, per claim-never-outruns-wiring.

---

## K. Threads and artifacts homes (9 entries; Round 2, Addendum 1.1 items 5 and 6)

> Source key addition: TA = research/threads-and-artifacts.md (2026-07-19 late). These entries carry the two founder red-line requirements: every conversation lands somewhere revisitable (Threads), and generated resources get a named home (the Library).

**K1. No folders/grouping schema on conversations** (TA). `conversations` carries only `project_id`; no folder table, no `folder_id`, no tags, so the red-line's "grouping/folders" has nothing to stand on. **ADD**: one migration, `conversation_folders` (id, workspace_id, name, position) plus `folder_id` on conversations, RLS-scoped like the parent table. The Threads rail renders system views above user folders so an empty folder list costs nothing.

**K2. No conversation search** (TA). `listConversations` is a bare limit-50 list; no title or content search exists and messages have no FTS index. **ADD**: a messages FTS index plus one `searchConversations` server function (title + message content), consumed by the Threads search box. Search is named in the red-line; it cannot defer.

**K3. No pin or archive on conversations** (TA). Docs have `archived`; conversations do not, so the list can only grow. **CLUB** into K1's migration: `pinned_at` and `archived_at` columns ride the same SQL file, and the Threads list reads them; no separate build item.

**K4. No unified thread listing or scope filter** (TA). The list is user-scoped RLS only; a per-product view needs `project_id` filtering plus a workspace-scope variant, and mission threads (agent runs) are not listable alongside ask conversations. **ADD**: a `threads` view keyed by kind (ask conversation | mission thread) with product and workspace scope parameters; the two-scope rail (This product / All of the workspace) reads one function.

**K5. No source back-link on memory candidates** (TA). `memory_candidates` has no `source_ref`, so an approved memory cannot cite the thread it came from and promote-to-memory loses its provenance. **ADD**: a `source_ref` (conversation/message id) column written by `proposeMemoryCandidate`; the Brain renders the back-link chip wherever it exists.

**K6. No unified artifact index** (TA). Prototypes, docs, specs, launch kits, and reports each live in their own table; the Library has nothing to list. **ADD**: a registry view or union query (id, kind, name, product, updated_at, share state, lineage refs) as the Library's one read function; per-family tables stay untouched.

**K7. No version history on any artifact family** (TA). `publishPrototypeFromPrd` inserts a new row per publish (duplicates rather than versions); docs carry only `updated_at`; no restore, no named stable points. The revisit bar is Lovable Versioning 2.0. **ADD, scoped**: one `artifact_versions` spine (artifact kind + id, version number, snapshot ref, label, created_by) with capture wired on publish/apply paths in the sprint; the restore UI surfaces as a ReceiptLine with Revert behind a dry confirm (spec 6.4) and lands with the Library face.

**K8. Share is prototypes-only** (TA). Docs, specs, launch kits, and reports have no share slug or public toggle; only prototypes have the `/p/$slug` viewer. **DEFER**: the Library links existing prototype shares on day one; extending the slug + private-by-default toggle + viewer pattern to the other families revives on the first non-prototype share ask or when the GTM lane needs shareable launch kits. The mechanism is proven, so the extension is mechanical when pulled.

**K9. No rename or delete on prototypes** (TA). The name is set once from the PRD title and no server functions expose rename/delete, which fails Library table stakes. **ADD**: `renamePrototype` and `deletePrototype` (soft-delete honoring share slugs) beside the existing publish function; the Library kebab consumes them.

---

## Tally

| Verdict | Count |
| --- | --- |
| ADD (this sprint) | 22 (A1-A5, B1, B3, B6, C1, C2, D1, D5, D6, E1, E7, E8, F1-F4, G1, I2) |
| CLUB (existing surface or scheduled lane) | 16 (B2, B4, B5, D3, D4, D7, E3, E6, F5, F7, G4, G10*, H1*, I1, I5, J1) |
| DEFER (conscious, with revive trigger) | 17 (C3, C4, C5, D2, E2, E4, E5, F6, G2, G3, G5-G9, I3, I4) |

\* G1 counts under ADD (sprint work even though mostly relocation); G10 and H1 are split entries counted once each under CLUB, with their deferred halves noted inline. 55 entries total.

**Round 2 addendum (2026-07-19 late, section K):** 13 raw GAP lines from TA resolved into 9 entries: ADD 7 (K1, K2, K4-K7, K9), CLUB 1 (K3, into K1's migration), DEFER 1 (K8). Register total: **64 entries**.

The register is closed: every raw GAP line from the research maps to exactly one entry above. New gaps found during the build join this file with a verdict in the same commit.
