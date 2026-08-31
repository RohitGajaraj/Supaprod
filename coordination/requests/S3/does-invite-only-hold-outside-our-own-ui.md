# S3 → S0: the invite gate holds in our UI, both doors. Nobody has checked whether it holds outside it.

> Filed 2026-09-01 by S3 · THE PLATFORM. Founder ruled invite-only for launch and
> asked specifically whether Google users still go through the gate. **They do.**
> This is the question that ruling raises next, and it needs your Supabase access.

## What I verified, and it is good

`passesGate` (`signup.tsx:211`) is called by **both** doors before anything happens:

- The email path calls it before `supabase.auth.signUp`.
- `signupGoogle` calls it **before the handoff**, with its own note: *"Google is a
  door too, and gating only the email form would have left the louder of the two
  buttons open. Same server verdict, same refusal copy."*

The verdict is **server-side** — `checkInviteCode` is a server function, not a
browser check — and the workspace-invite token path is *"CHECKED, never trusted:
`next` is a string anyone can type, so it is treated as a claim and the server
decides."* A round trip that never landed is reported as "try again", never as a
bad code. Measured today: `invite_codes` holds **6, all 6 usable**.

**So a person using the product cannot get in without a code, whichever button
they press.** That is the founder's question answered, and the answer is yes.

## The question nobody has answered

**Our gate is a product gate, not a database one.** It stops the UI. It does not
stop a direct call to Supabase's auth endpoint with the publishable key, which
ships in every visitor's bundle by design.

Whether that path is closed depends on **Supabase's own "allow new users to sign
up" setting**, which lives in the dashboard, is not in this repository, and which
I cannot read. I searched the migrations: `invite_codes` is created and seeded
(`20260810155822`), and **nothing anywhere adds a trigger on `auth.users` or
otherwise refuses an uninvited account at the database.**

**Please check that setting and write the answer down.** Three outcomes:

1. **Public signups already disabled** — then invite-only is real at every layer
   and this note becomes a one-line fact in the ledger. Best case, and likely,
   since somebody clearly closed signup at some point (`admin.invites` reasons
   about "the migration that closed signup").
2. **Public signups enabled** — then invite-only is a UI convention, and on an
   invite-only launch that is worth knowing before launch rather than after.
   The fix is one dashboard toggle, not code.
3. **Cannot be determined** — say so and it goes to the founder.

**I did not test it empirically on purpose.** The only way to test from here is to
attempt an account creation against production, which would write a real row, and
"you do not WRITE the database" is my constraint. A dashboard read costs nothing
and answers it exactly.

## Why this is worth a unit of yours before tomorrow evening

The founder has just ruled invite-only **for launch**. That makes this the
difference between a launch gate and a launch-shaped gate, and it is the cheapest
possible check: one setting, one sentence in the ledger, no code.
