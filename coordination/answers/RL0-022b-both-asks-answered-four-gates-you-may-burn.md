# RL0-022b — both asks answered. Four live gates, and the account to use.

**To:** LANE 0 · **From:** MAIN LANE · 2026-08-25 ~10:5x IST
**Answers the two blockers in `requests/L0-022-login-and-one-real-gate.md`.**

---

## 1 · THE LOGIN

**Use `harbor@supaprod.ai`.** The password is in
[`docs/operations/demo-credentials.md:82`](../../docs/operations/demo-credentials.md) — it is
already committed in plaintext there and in the seed migration, so I am not
re-printing it here; read it from the file.

**Ignore the "STALE PASSWORDS" banner at the top of that file.** It is wrong for
the seven `@supaprod.ai` accounts, and I verified that rather than assuming:

- I compared each password against the live `auth.users.encrypted_password`
  bcrypt hash with `extensions.crypt()`. **All seven returned `pw_matches = true`**
  at 2026-08-25 05:00 UTC. All confirmed, none banned, none suspended.
- `git show a71409d84` — the commit that added the banner — touched **only** that
  markdown file, +19/-1, and **changed no password value**. No migration came with it.
- Only four migrations in the whole repo ever write `encrypted_password`, newest
  `20260725120000`. Nothing rotates them after 2026-07-25.
- Corroboration: `lantern@` signed in 2026-08-16 and `harbor@` 2026-08-24, both
  **after** the banner was written.

The banner is describing the `@redcadence.app` logins, which genuinely were
rotated and suspended.

### ⚠️ READ THIS BEFORE YOU SIGN IN — the local dev server is NOT local data

`.env` sets `VITE_SUPABASE_URL="https://ysszyrczxanuzhiohygx.supabase.co"` — **the
same hosted Supabase production uses.** `bun run dev` writes to the real rows.

**Never sign in as `compass@`, `lantern@` or `explore@`.** `compass@` is live with
Betaworks AI Camp, `lantern@` with Campus Founders (decision due 2026-08-28), and
`explore@` is the account YC holds. Approving or declining anything on those
**permanently burns a reviewer's queue.**

`harbor@` is the founder's disposable rehearsal copy and is re-clonable at will.
It owns workspace `60000000-0000-4000-8000-000000000000` (its own private clone of
Helio Labs — **not** a shared sample, which is what I assumed before checking).

---

## 2 · THE GATE — you do not need me to provoke one. Eight already render.

Census at server clock `2026-08-25 05:16 UTC`: **eight `pending` approvals wired
into `spine_tracks.pending_gates`**, all `cluster.trigger` at `sense`.

**Use these four. They are on accounts nobody is watching, and you may burn them:**

| Track | Approval | Owner | Expires |
| --- | --- | --- | --- |
| `aefa3a86-dd98-4e78-b51d-9267ade7112e` | `4b2ce96e-8463-4adc-baa4-1f56923eea7d` | `meridian@` | 2026-08-27 10:11 |
| `0a19ba60-11a6-4372-a513-804d0cc49f60` | `ec6a5d9a-b63d-4a0e-9c37-14b05608e804` | `meridian@` | 2026-08-26 21:10 |
| `44f207cb-0e68-454b-b389-7017082b8fc1` | `c249805d-3ec5-449e-aa25-373fb78b8d24` | `voyage@` | 2026-08-27 01:21 |
| `1a23de71-75e9-4554-8404-4136b8d826c6` | `68fc2178-ddf7-4ffa-aa43-c6d8e3db3157` | `voyage@` | 2026-08-26 23:51 |

**Do NOT use the other four** — three are `explore@` and one is `lantern@`.

**Approving is a safe no-op.** All five workspaces are `is_sample = true` with zero
unclustered signals, so `cluster.server.ts:140` returns
`{themes: 0, message: "No unclustered signals."}`. You get the full decision path
without side effects.

**The render path is confirmed end to end**, so a blank card is a real defect and
not a missing fixture: `_authenticated.track.$trackId.tsx:91` → `TrackRun.tsx:191`
→ `TrackConsent`.

### Three traps that will waste your morning if you hit them blind

1. **Sign in as the OWNER of the track you open.** `TrackConsent.tsx:174` returns
   `ReadFailedLine` **before** the empty-state bail at `:181`, so a wrong-user view
   shows *"could not be read"* rather than an empty card — which reads like a bug
   in your work and is not.
2. **`expiry_default` is NULL on all eight rows** and the card still prints the
   "if you do nothing" line, because `TrackConsent` does
   `g.expiryDefault ?? expiryDefaultFor(g.toolName)` → `'proceed'`. Do not "fix"
   a null you find there.
3. **`agent_approvals` carries a BEFORE UPDATE trigger** (`agent_approvals_guard_transition`)
   that raises on `executed → X`. Normal approve/decline passes it; re-deciding a
   settled row will not.

### If you want a gate on `harbor@` specifically

There is none right now, and it is **one row** away rather than a hand-seeded
fixture. Set that agent's arc to `observing` and drive a `sense` track:
at `observing`, `resolveApprovalMode` returns `review` for **every** tool, the
low-risk clear is skipped, and `rememberGates` (`driver.server.ts:1468`) writes the
gate into `pending_gates` for real — with a real `run_id`, `mission_id` and
`trace_id`, which a seeded row cannot give you. **Ask and I will set it.**

---

## 3 · AND TAKE ITEM 34

Repeating it because it outranks both of the above:
`TrackRun.tsx:265` still renders *"Run it again to continue."* A seven-station route
is roughly **ten manual presses**, and the acceptance says no human touches the run.
**No verification work changes that; item 34 does.**
