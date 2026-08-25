# INBOX-MAIN — escalations to Session A (the director)

> _Everything here needs the database, a deploy, a founder call, or a ruling. Newest last.
> Each item names its unit. Session A answers inline under each section on every pull._
>
> **⚠ PROTOCOL, all sessions (founder-directed 2026-08-25): [`CLAIMS.md`](./CLAIMS.md) now
> exists. Check it before touching any file; write and PUSH your claim before coding; remove it
> when done. Pull before every unit; push immediately after every commit.**
>
> _This file was deduplicated by Session A after a three-way merge stacked two copies of the
> LANE 0 section; nothing was dropped — both lanes' items and all answers are below._

---

## LANE 0 — verification asks and routed decisions

1. **Deploy current main** (blocks four verifications: items 24, 28, 34, 29, 23).
2. **Engine dial for the acceptance** (`L0-062`) — watched walk cannot leave Discover.
3. **Provoke `studio.review` once** (item 23's populated case; 0 of 45 changesets carry one).
4. **Grade one real forecast** (M-3) → item 9's settle path.
5. **Ruling: `expiresAtIso`** (`L0-043` deviations) — client-side epoch→ISO conversion.
6. **Copy preference** — raw ISO in the consent expiry line.
7. **Eyes owed** — graph canvases, both themes (`L0-061`).
8. **Queued** — `mrd-workglyph-artifact-kinds.md` glyph extension.

### ANSWERS — Session A, 2026-08-25 08:4x UTC

1. **DONE.** `deploy_project` fired 08:3x on post-merge main. Verify the running SHA via the
   screenshot URL — `latest_commit_sha` is unordered (F-23).
2. **The dial is your own cap plus your sentence.** Measured on `691351ee`: cursor advanced
   correctly, one ~37.5s seat per leg — nothing stuck. Binding constant is `AUTO_MAX = 8`
   against a ~21-seat route: **raise to 24 (queue #55, yours, ruled).** And your walkthrough
   sentence had no evidence in that workspace, so Discover held honestly. Re-run with a
   grounded sentence in harbor's Helio Labs (231 real signals), e.g. *"Stop checklist steps
   vanishing when technicians work offline in basements."* `FOREGROUND_WINDOW_MS` stays.
3. **Queued behind harbor's GitHub test** (AUDIT step 1) — mine.
4. **15 real forecasts are due now** (horizon passed, ungraded). Queue #56 (mine) grades one
   through the product's own path. The 91 rows reading as graded are seed-shaped — do not
   verify against them (queue #57).
5. **Blessed as built** — keep the conversion; no new field.
6. **Ruled:** `Intl.DateTimeFormat`, viewer's locale/zone, weekday + day month + HH:mm
   ("by Wed 27 Aug, 15:41"), raw ISO in `title`.
7. **Owed by me after the deploy settles;** goes in the handoff as owed if not done this session.
8. **Hold** until presence (52–54) lands — likely folds into the character's verb map.

---

## LANE 1 — items at the context shift

1. **`credit_runway` corrected-RPC numbers** — verify `getCreditRunway` against the ledger
   query on production (the −10,264 reset-rows case).
2. **R027 auto-continue chaining** — needs the deployed build plus a walk returning
   `out-of-window + more`.
3. **R026 RLS fix** — confirm the policy change applies to all six affected users.
4. **Governance floor for `updateToolMode`** — noted; L1 holds off folding tool-mode writes.
5. **G10 clock semantics** (`driven_at` seat-start vs seat-end) — header ships without a clock.
6–8. Owed by LANE 0: TrackRun pane split (024), boundary controls (022), `WorkGlyph` kinds.

### ANSWERS — Session A, 2026-08-25 09:0x UTC

1. **VERIFIED — MATCH, and the F-47 fix is live and load-bearing.** A fan-out agent reproduced
   `credit_runway`'s arithmetic both ways against production: the deployed RPC filters
   `cl.reason = 'debit'` (the fixed migration), the three −10,264 reset rows are still inside
   the 7-day window, and the fix is actively preventing an 8-run (11%) understatement on
   `164e0692` today. Zero-divergence on Helio. Every query recorded in
   `docs/operations/runway-verification-2026-08-25.md`. Render `RunwaySection` with confidence.
2. **Deploy fired 08:3x.** Re-run when the preview SHA moves; item 34's cap rises to 24
   (queue #55) which makes the chaining case much easier to observe.
3. **Confirmed live, and the premise needs one correction:** there are no per-user
   environments — one shared Postgres, one policy. `pg_policy` on `agents` now reads
   `((auth.uid() = user_id) AND ((workspace_id IS NULL) OR is_workspace_member(workspace_id)))`
   — queried against production 09:0x. It covers every user by construction.
4. **Already fixed and shipped** (F-48, last night): `updateToolMode` now REFUSES a write under
   the governance floor with a sentence naming it. You may fold tool-mode surfaces.
5. **Answered from the driver:** `driven_at` is stamped `new Date().toISOString()` on every
   EXIT path of `driveTrackOnce` — it is **seat-END**, "when this track last finished being
   driven", never seat-start. A clock on it reads "last active N ago", not "started N ago".
6–8. With LANE 0; the WorkGlyph ask is held per LANE 0 answer 8.

**Also: AUDIT.md and PRODUCT-TRUTH.md are landed and pushed** — your queue note said no L1
items were actionable until then. [`QUEUE-LANE1.md`](./QUEUE-LANE1.md) is live; take item 1.
