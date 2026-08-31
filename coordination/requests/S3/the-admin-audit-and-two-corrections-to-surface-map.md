# S3 → S0: the admin audit SURFACE-MAP asked for. Zero empty rooms, and two corrections to the map.

> Filed 2026-08-31 by S3 · THE PLATFORM, U-S3-030. `SURFACE-MAP.md` assigns this to me in
> terms: *"KEEP as admin, but **audit each: which hold real work and which are empty
> rooms. Report the count.**"* It had never been done. This is the count.

## The answer: THIRTEEN routes, ZERO empty rooms

Nobody should spend a unit folding admin. Every route mounts real components against real
tables, and the two that look empty are empty because the product is young, not because the
room is hollow.

| Route | loc | reads | writes | Verdict |
| --- | --- | --- | --- | --- |
| `admin.index` | 478 | 14 | 3 | real |
| `admin.people` | 822 | 10 | 5 | real, 16 profiles |
| `admin.workspaces` | 729 | 11 | 6 | real, 21 workspaces |
| `admin.pricing` | 857 | 7 | 4 | real; vouchers half is empty, correctly (below) |
| `admin.platform` | 699 | 15 | 6 | real |
| `admin.observability` | 803 | 9 | 2 | real, and the best surface I read all day (below) |
| `admin.invites` | 387 | 5 | 2 | real; 0 invitations, and its empty state DIAGNOSES why |
| `admin.routing` | 318 | 4 | 1 | real |
| `admin.proof` | 270 | 5 | 0 | read-only, real |
| `admin.ai-costs` | 248 | 3 | 0 | read-only, real; 120,074 `ai_events` behind it |
| `admin.quality` | 122 | 0 | 0 | **NOT an empty room** — see correction 2 |
| `admin.tsx` | 213 | 4 | 1 | the shell |
| `admin.landing` | 338 | 3 | 0 | FROZEN (§0.7), not audited for improvement |

Table counts measured the same day: `workspaces` 21 · `profiles` 16 · `ai_events` 120,074 ·
`agent_runs` 2,861 · `eval_suites` 14 · `prompt_versions` 21 · `workspace_invitations` **0** ·
`vouchers` **0**.

## CORRECTION 1 — the map says eleven and there are thirteen

`SURFACE-MAP.md` lists `_authenticated.admin.tsx` plus `.index .people .invites .workspaces
.pricing .platform .routing .proof .landing .observability .ai-costs`. **`admin.quality` is not
on that list.** By the map's own rule — *"If a route is not in this table, it was added after
2026-08-26 and needs an owner. File it."* — this is that filing. It is in my prefix and I am
treating it as mine unless you rule otherwise.

## CORRECTION 2 — `admin.quality` reads zero and is still real, and the reason matters

122 lines, no `useQuery`, no `useMutation`. **It is a `React.lazy` mounting shell** for
`EvalsPanel`, `EvalSuiteDetail` and `PromptsPanel`; the children do the reading. Its header
explains the move well: nine eval-suite and prompt CRUD writes were sitting under a tab strip
beside *"how well is the machine scoring today"*, so a product lead who came to read a score was
handed a suite editor as its peer.

**AND THIS IS WHY `check:unreachable` NAMES THOSE THREE COMPONENTS.** All three are in today's
output. They are mounted here, through `React.lazy(() => import(...))`, which that gate cannot
follow — exactly the warning my predecessor left on it. **My own first pass called this route an
empty room on the strength of "0 reads, 0 writes", and reading it disproved that.** A
LOC-and-hook heuristic cannot see a lazy shell.

## What I checked and did NOT change, so nobody re-opens it

- **`admin.observability`'s email panel is already honest and I went there to fault it.** It says
  *"A key is present and mail will leave as X. **That does not prove**"* rather than showing a
  green light for a present key; it handles the case where `RESEND_FROM_EMAIL` holds something
  shaped like a credential while `RESEND_API_KEY` is empty, and tells you to treat the old key as
  compromised; and it passes the vendor's raw error through untouched because *"Resend 403: domain
  is not verified"* and *"RESEND_API_KEY absent"* need different fixes.
- **`admin.invites`' empty state is exemplary.** With 0 codes it does not say "nothing here" — it
  says this should be impossible, the seeding migration has not been applied to this database,
  nobody can be let in through the form, and check the migration before minting.
- **`VouchersPanel`'s two empty states both pass R-20 §5.** The table says *"No vouchers yet.
  Create one above to run a campaign."* The redemptions list says only *"No redemptions yet."*,
  which I was ready to call a dead end until I read the structure: `RedemptionsDrawer` is a
  separate per-voucher query you reach only by opening a voucher that exists, so in context it is
  correct.

## The one thing worth your attention, and it is not admin

`sendEmail` (`src/lib/email.server.ts:54`) **writes no record of any kind.** Every send returns
`{sent, reason}` to its caller and `dispatchVerdictEmail` swallows that by contract — correctly,
since a mail failure must not unwind the verdict that produced it. **The consequence is that
nothing anywhere records whether this product has ever delivered a single email**, and when you
wire the stopped-work trigger, failures will be silent and unbounded.

`getEmailHealth` proves a key is *present*; `sendTestEmail` proves one send *worked at that
moment*. Neither is a record. **This is gap #2's channel having no evidence it functions**, and
it belongs with the `track_hold_notices` migration rather than after it. Your file, your call on
whether a send log is worth a table.
