# The first visit: one sentence and one door, on all nine

> _Created: 2026-09-04 · Last updated: 2026-09-04_

> _Written 2026-09-04 (A3, packet P-63). Design for `a1-delete-probe` — the demo user's own
> workspace with no sources, no runs and no decisions — for each of `PRIMARY_NAV`'s nine doors._

[`arrival-2026-09.md`](./arrival-2026-09.md) (P-33) walked the same empty-workspace ground for
Start alone and found the deeper defect: a second workspace could not even be created. This
packet assumes that wall is down and asks the narrower question P-33 left for later — once a
person is standing in a workspace with nothing in it, what does every other door say, and does
each one give them a way out of "nothing here"?

The rule, from the packet: never a blank, never a spinner, one sentence saying what will be here,
and — where a real next act exists — one door to it. Meridian's `Quiet` gained an optional
`action` slot for this (`src/components/meridian/Quiet.tsx`); it stays unset on every ordinary
empty-queue call site the component already had, which is why P-52's own rule ("no action, there
is nothing to do") is untouched everywhere it still applies. `NeedsSetup`'s own header already
drew the line this crosses: NeedsSetup is for a missing precondition ("fix that first"); this is
for a working surface with nothing in it yet ("do the first thing").

## The nine

| Door | Sentence | Door out | Where |
| --- | --- | --- | --- |
| **Start** | "Say what you want changed and what it should do. It does the work here, where you can watch, and tells you whether it worked." | The composer itself, always on screen — not a separate action, the surface's whole job. | `_authenticated.start.tsx` (`ORIENTATION`, P-62's own three answers each stand down to their own zero line already) |
| **Waiting** | "Nothing is waiting on you." + "When an agent stops to ask something, the question arrives here and the run holds until you answer it." | **Start a sentence** → `/start` | `ApprovalCard`'s zero case, `zeroAction` (new, P-63) |
| **Arriving** | "Nothing is connected yet, so there is nothing to read." + "Reading starts the moment a source is linked, or capture something yourself below." | **Connect a source** → `/settings?section=connections`; the capture box named in the sentence sits right below it on the same screen | `DiscoverSurface.tsx`, `Quiet` (action added, P-63) |
| **Run** | No sentence: no door. | — | `nav-model.ts`'s own comment: `/track`'s row does not draw while nothing is live, and the route needs a `$trackId` it has none of. Nothing to design until a run exists — recorded rather than papered over, same as the audit's "not in scope" precedent for a Runs-list door. |
| **Outcomes** | "Nothing is on the record yet." + "Every decision the crew makes and what came back from it lands here, the moment something has run." | **Start a sentence** → `/start` | `_authenticated.outcomes.tsx`, new `Quiet` block gated on `emptyRecord`, directly under `RecordHead` (P-63; `RetentionLine` already stood itself down for this exact case per P-33, and had nothing behind it) |
| **Team** | N/A — always populated. | — | `rosterCatalog()` is a static catalog of the product's own built-in agent roles, not a list of things the workspace has done; the roster grid draws in full on a workspace with zero activity. Nothing to design. |
| **Conversations** | "No threads in this product yet." (list pane) / "Nothing has been asked in this workspace yet." (detail pane) | **Start a sentence** → `/start`, both panes | `_authenticated.threads.tsx`, `NothingHere action=` (added, P-63) |
| **Sources** | "Nothing synced yet. Point a Notion database or a Google Docs folder at this workspace above and the documents appear here." | **Connect another source**, already a standing page action directly above the region the sentence points at | `_authenticated.sync.tsx` (already correct; no change) |
| **Settings** | N/A — always populated. | — | Account, workspace, connections, keys and billing all exist regardless of workspace activity. Nothing to design. |

Six real gaps, three already-served or not-applicable doors, recorded rather than skipped so a
later reader does not re-open the same question: Start (served by P-62), Sources (already paired
correctly), Team and Settings (structurally never empty), Run (structurally has no door to land
on while empty).

## What Meridian gained

`Quiet.action` (`src/components/meridian/Quiet.tsx`) and `ApprovalCard.zeroAction`
(`src/components/meridian/ApprovalCard.tsx`): both optional, both default to nothing, so every
call site P-52 and P-53 already wrote is unchanged. A caller opts in only where a genuine next
act exists — this is the same discipline `NeedsSetup` already states for its own slot, applied to
the sibling case its own header says is not its job.

## The guard

`src/lib/every-door-s-title-is-its-word.test.ts` is P-61's, not this packet's. This packet's own
guard is source-text, one test per touched call site, in the same files as the change: proves the
`action`/`zeroAction` prop is present at each of the six sites above and that `Quiet`'s and
`ApprovalCard`'s own refusal tests (no action by default) still hold. See
`src/components/meridian/__tests__/a-choice-and-a-quiet-are-not-cards-that-ask.test.tsx`.
