# Session handoff (durable)

> _Created: 2026-07-28 - the tracked half of the handoff pair._

**This file is the durable, git-tracked session handoff.** It replaces
`.remember/remember.md` as the committed record, and here is why.

`.remember/remember.md` is owned by the `remember` plugin, which treats it as a
**one-shot mailbox**: its SessionStart hook reads the file, injects the contents
into the new session's context, then truncates it to zero bytes
(`scripts/session-start-hook.sh`, the `: > "$REMEMBER_HANDOFF"` line). That is
deliberate and useful, but it is incompatible with also being a committed
artifact: the file was the single git-tracked entry inside a directory whose
`.gitignore` is `*`, so every single session start showed up as a phantom
multi-kilobyte deletion in `git status` and got swept into unrelated commits.

**The convention, therefore, is to write both:**

| File | Owner | Lifetime | Purpose |
| --- | --- | --- | --- |
| `.remember/remember.md` | remember plugin | cleared on read | auto-injected into the next session's context. Untracked. |
| `docs/operations/session-handoff.md` | this repo | permanent | the durable cross-tool record, reviewable in git history. |

Write the handoff to **both** before you pause or end a session. The first buys
the automatic injection; the second buys the audit trail and survives the read.

Related: [`memory.md`](./memory.md) (the memory stack), [`commits.md`](./commits.md)
(git discipline), [`AGENTS.md`](../../AGENTS.md) (the session loop standing order).

---

# Session handoff - 2026-07-28 late night (YC application FINAL CHECK; queues re-armed; repos private)

## State: local main = `a5a79660`, pushed to `origin/rescue/real-main-2026-07-28`. Orphan origin/main untouched.

This session was the final pass over the YC application (the five editable surfaces) plus the founder-profile
Accomplishments boxes, checked against live screenshots with the founder present. Everything verified or
fixed; a short list of paste actions waits on the founder. All exact paste text lives in
`docs/pitch/yc/fall-2026-application.md` (fifth column) and `docs/pitch/yc/founder-profile-answers.md`
(form-check note near the bottom).

---

## 1. EXECUTED LIVE THIS SESSION (do not redo)

- **Five GitHub repos went private** via the founder's authed `gh` (Project-Cadence v1-v4 + build-in-public),
  executing the committed profile ruling. Box 3's "those repositories are private" is now literally true.
  **`Test-Project-Cadence` is still public** - flagged, founder's call, not in the original ruling (note: it
  holds the engine's 15 real PRs, which is why it existed; weigh that before hiding it).
- **Demo approval queues re-armed.** Root cause: the seed gives each pending approval an `expires_at` only
  HOURS out, so every demo workspace decays from 5 pending to ~1 within days, untouched (found: 1 pending +
  4 expired in ALL seven Helio prefixes, and the surviving pending row was itself past expiry). Reset
  undecided rows to pending with a 60-day runway (holds until late September); decision history untouched.
  **Re-arm again before any interview window and after any re-clone** - ritual documented in
  `docs/operations/demo-credentials.md`.
- **Verified as a partner would:** fresh browser, `explore@supaprod.ai` login on supaprod.ai -> lands on
  Mission Control "10 calls wait on you" (3 Decide, 5 Build, 2 Learn), PR-412 approval card with evidence,
  0 console errors. explore@ is what YC holds; **all future rehearsals/recordings on `harbor@` only.**
- Commit count verified **4,119** -> "4,000+" is literal truth in both commit-count fields.
- `supaprod.ai/brief` verified: HTTP 200, zero YC mentions, no stale dates. `/brief` is canonical,
  `/investors` serves the same page.

## 2. WAITING ON THE FOUNDER (paste actions; exact text in the two YC docs)

1. **"How far along" close**: `Next: public launch in September.` plus the brief-spotlight line ("The full
   company brief stays current at https://supaprod.ai/brief: product, market, plan, and team on one page.").
   **FOUNDER RULING 2026-07-28: launch is month-only, never a week or date** (supersedes "second week of
   September" in every editable field).
   **ALSO: the self-build sentence is rewritten** (founder challenged "Supaprod is building Supaprod on its
   own" as overclaim; he was right — engine PRs live on the test repo, grading ran on seeded content). New
   sentence: user zero, roadmap in the product, real code + real PRs behind the human merge gate, every call
   on the record. The same overclaim survives in README.md, the preserved telling, and the founder-video
   script — honesty-pass them before reuse (especially the video re-record). Lesson learned the hard way:
   **final checks must audit each ratified sentence against live wiring, not just the form against the sheet.**
   "Seven weeks" ages out 2026-07-31; every pasted duration is a snapshot (rule now in the paste checklist).
2. **"When version people can use"**: full replacement block (month-only; also fixes the live form's "Early
   version is" and "users feedback" grammar slips).
3. **"How long working"**: clean the "about ~4,000+ commits" mishmash to "4,000+ commits".
4. **Founder profile Box 3**: the form carries only paragraph 1 of 3. Paste the full three-paragraph block
   (adds the bubble-tea 0-to-1 and the four-rebuilds close). Overwrite the WHOLE field; the live text may
   have a doubled "on on" typo. Boxes 1, 2, 4 match canon verbatim - leave them.
5. Optional: the count-free credentials parenthetical; the two-line rename email to apply@ycombinator.com.

## 3. OPEN CALLS (founder facts, not text)

- **"Are people using your product?" radio = No.** Ruling stands: No + availability is consistent. Flip to
  Yes ONLY with literal outside users, then state the true count.
- **Founder video: still the submit-day 2:53.** The one open surface (ruled <=1:00; script v4, ~220 words /
  ~90s, ready in `video-scripts.md`).
- **Demo video: 4:51 against the form's stated 3:00 guidance.** Deliberate founder call, wedge front-loaded;
  a partner may stop at 3:00.
- **Two claims to defend cold in any interview:** which ISRO programme/subsystem, and where "200+
  institutions / 70+ countries" is published.

## 4. STANDING TRAPS (carry forward every session)

- **origin/main is an ORPHAN history** (no common ancestor with local main; **Lovable deploys from it**).
  Never bare push/pull. Session work goes to dated `rescue/real-main-YYYY-MM-DD` branches (2026-07-28 is the
  freshest). Reconciling = force-push = founder decision, STILL PENDING.
- **The two 2026-07-27 production bug fixes (MissionShellView scroll, SignalFeed hooks) exist ONLY on the
  orphan main** - they must be carried across whenever the histories reconcile.
- **Pushing does not deploy.** Lovable syncs the commit but serves the old build until the founder clicks
  **publish**.
- `.remember/remember.md` gets wiped to 0 bytes; restore from git HEAD before editing (happened again this
  session).
- A concurrent session-close hook may sweep dirty files into its own commit (this session: three doc edits
  landed inside `7d9c8018`).
- Prior session's deep context (demo-video cut method + the CRF quality lesson, both bug write-ups, the
  live-app render-reality table as of 2026-07-27) lives in the previous version of this file:
  `git show 7d9c8018:.remember/remember.md`.

## Next session, in order

1. Confirm the founder pasted section 2 (the four fields) and decided section 3.
2. The founder video re-record remains the one open YC surface.
3. The orphan-remote reconciliation still wants a clear-headed founder decision before any normal push.
