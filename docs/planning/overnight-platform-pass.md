# Overnight platform pass, 2026-07-07: handoff + parking doc

> _Created: 2026-07-07 · Last updated: 2026-07-07_

> **What this is.** The morning handoff for the founder after an autonomous overnight end-to-end platform pass. It records what shipped (every surface, with commits and verification), what is FLAGGED as needing a real migration before it can render truthfully (never faked), what is PARKED behind a gate (a secret, an OAuth client, or a founder call), and what design work is DEFERRED by the velocity ruling. Status lives in [`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md); this doc is the one-page "here is where we landed and what needs you."

---

## 1. The mission (founder brief, restated)

Take Cadence to a fully consumer-ready, enterprise-ready application: not a UI reskin, a genuine functional + user-lens pass matching the depth already given to Discover and Decide. Apply the dim-17 doctrine (every object is traceable, timestamped, status-visible, and opens on click) and the shared DetailKit anatomy across every surface. Use only real data (real DB columns; flag anything that needs a migration, never fabricate). Build or modify features where a user-value gap exists. Park anything gated and keep moving. Close with the documentation, `AGENTS.md`, and `.remember/remember.md` true. Never leave the tree red.

## 2. What shipped (all pushed to `origin/main`, each gate-green)

| Surface | Commit | What changed |
| --- | --- | --- |
| Design-system docs | `aabd7a0b` (+ `design-anatomy.md`) | New canonical [`../conventions/design-anatomy.md`](../conventions/design-anatomy.md) (card + detail anatomy, trace-ref registry, ranking/designation logic, color + naming, the WHY); cross-linked from DESIGN-LOOM dim 17 + AGENTS/README/CLAUDE/GEMINI + the conventions/features indexes; plan.md §4 + SSOT refreshed. |
| Decide (ranking + designations) | `9105db54` `1a2bce05` `57ca39da` | Deterministic ranking + best bet; system designations (best bet / needs validation / quick win / heavy lift / watch this week); one pencil wink per screen; glacier priority band; compact stat strip; plain-language rank spotlight badge. |
| Today (`/today`) | `6cc4f6c8` | `CallDetailSheet` (DetailKit) for all 4 call families; CallCard click-to-open; LRN/MIS trace + time; new ASM trace prefix. |
| Brain (`/brain`) | `39a28d82` | `LearningDetail` + `DecisionDetail` rebuilt on DetailKit; new DEC trace prefix; graph nodes single-click-to-open; LRN/DEC trace tails. |
| Define + Build (`/plan`, `/build`) | `0f50aaf3` | `SpecDetail` on DetailKit; PRD/OPP/MIS trace + time tails; mission slide-over + `/build/$missionId` get MIS ref + started time + spec provenance; `specRecommendation()`. |
| Trust Ledger + Engine Room | `29618527` | `ReceiptDetailSheet` (DetailKit); plain-language ledger summary + "Tamper check"; `IncidentsPanel` rebuilt; new ACT + INC engine trace codes; semantic status tones. |
| Engine Room governance panels | `2026-07-07` (W4 reskin, see [`../features/obsidian-port.md`](../features/obsidian-port.md) OBS-09 + plan.md §4) | The six remaining panels (Approvals, Evals, Gauntlet, Guardrails, Drift, Prompts) reskinned to Obsidian: semantic tokens only, ember-misuse + wrong-bridge fixes (rose->madder, coral/ember->madder/marigold, deep-green->moss, action-blue->glacier, near-white modal scrim fixed), inline semantic RiskChip, calm mono-caps loading + designed empties + error/retry, `relTimeCaps`. Functionality and server calls unchanged; monetization untouched. |
| Settings + Connections (`/settings`, `/sync`) | `9ff499bc` | Workspace bindings + connected accounts as first-class objects (status + last-synced); hex + ember-misuse fixes; `latestIso()`. Monetization block untouched. |
| Auth + boundaries | `75e90675` | On-brand dark `AuthScaffold`; login/signup/forgot/reset with full states + double-submit guard; `authErrorMessage()` (12 tests); neutral, non-enumerating copy; branded 404/500 boundaries. Auth mechanism unchanged. |
| Chrome / spacing | `9f2bf9bb` | Engine Room active-state gap fixed; new `--surface-active` token (removed a raw hex); Today padding rhythm; shell machine-map truthed for Decide. |

**Final verification (2026-07-07):** `tsc --noEmit` = 0; `bun run build` = success; `bun test` = 2403 pass / 3 fail. The 3 fails are the pre-existing, environment-dependent `resolveEmbedRoute` cases (no Supabase/gateway env in the test runner), not a regression from this pass.

**Trace-ref registry after this pass:** `SIG` signals, `THM` themes, `OPP` opportunities, `PRD` specs/drafts, `MIS` missions/outcomes, `LRN` learnings, `DEC` decisions, `ASM` assumptions, `ACT` autonomous-action receipts, `INC` incidents.

## 3. FLAGGED: needs a real migration before it can render truthfully (never faked)

Each of these is a place where a genuinely valuable field or history does not exist in the schema yet. The honest floor (`created_at` / `updated_at`) is shown today; the richer view waits on a migration. None was fabricated.

1. **Per-transition stage history, platform-wide.** Specs, missions, opportunities, and decisions show created/updated only. A full "moved from X to Y at T" timeline needs a lightweight `stage_events` table plus a write on each stage change. This is the single most repeated flag across surfaces.
2. **Today.** `agent_approvals` has no snooze/defer column (so no honest "Later" verb on a call); ship-gate approvals lack `mission_id` in the queue read (so ship-gate provenance links to `/build` generally, not the specific mission).
3. **Brain.** Decisions lack an alternatives-considered field and a cited-by-agents recall counter; learnings lack Historian/mission attribution and a cited-by table.
4. **Trust Ledger.** A "Proven right" outcome and a per-record change timeline need write-time seal persistence and outcome-link edges (the LOOP-PROVE follow-up); guardrail / pipeline / budget / runaway incidents carry no `trace_id` (they key to an event), so those incident cards stay inline-detail rather than click-to-trace.

## 4. PARKED: gated on a secret, an OAuth client, or a founder call

1. **OAuth connect flows (Connections / Settings).** The full UI and a calm "not configured" state are built; going live needs provider credentials: GitHub App -> `GITHUB_APP_ID` + `GITHUB_APP_SLUG`; gateway providers (Notion / Google / Slack / Linear / etc.) -> the provider's `clientIdEnv` + `LOVABLE_API_KEY`.
2. **Monetization / billing / credit block.** CLOSED per standing founder ruling and deliberately untouched this pass. Go-live is founder config only (live Stripe keys + price IDs + the `credits_enabled()` / routing flips), tracked in SSOT §4.
3. **Stakeholder digest Slack write-back.** Email leg works; the Slack write-back needs a real Slack bot token / OAuth client.

## 5. DEFERRED by the velocity ruling (functional today, design polish batched)

1. ~~**Engine Room governance panels** (Approvals, Evals, Gauntlet, Guardrails, Drift, Prompts): functional but not yet fully reskinned.~~ **SHIPPED 2026-07-07** (governance_panels_reskin): all six reskinned to the Obsidian look, functionality unchanged (see section 2 and [`../features/obsidian-port.md`](../features/obsidian-port.md) OBS-09 W4 note). No longer deferred.
2. **No mobile / collapsed nav.** The shell is `hidden lg:flex`, desktop-first by design (DESIGN-LOOM §0.1). A mobile nav is a feature, not a spacing fix.

## 6. Suggested next picks (founder call)

- Land the `stage_events` migration (unblocks the per-transition history flagged on every surface at once).
- Register one OAuth provider end to end (GitHub App is the highest-value first connector).
- Extend the Engine Room design-language depth (axed data-palette charts + richer default views) from Spend to the remaining rooms' drill panels.

## 7. Engine Room deep redesign (founder-directed, 2026-07-07, commit `294e60d1`)

A follow-up after founder review found the overnight Engine Room pass was a reskin, not a rethink. Shipped: the white-dropdown systemic fix (native `<select>` option popups forced dark under `[data-obsidian]`); a plain-outcome naming model with the technical term kept subtly beneath each view ("the engine calls this ..."), single-sourced in `ROOM_TAB_META`; an interpretive chassis (honest verdict + one-line descriptor + a plain recommended-action on watch, derived from real state); and the first design-language pass (Spend "Over time" as a proper axed chart in the tangerine spend data-palette). Full naming map + the pattern: [`../conventions/design-anatomy.md`](../conventions/design-anatomy.md) §6. Remaining depth (per-panel charts across the other rooms) is the third next-pick above.

## Related

- [`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md), live status (the authoritative cursor + progress log)
- [`../conventions/design-anatomy.md`](../conventions/design-anatomy.md), the design-system reference this pass applied everywhere
- [`../../DESIGN-LOOM.md`](../../DESIGN-LOOM.md) §0.1 dimension 17, the binding doctrine
- [`../../plan.md`](../../plan.md) §4, the dated build log
