# Invite codes and the links to hand out

> _Created: 2026-08-07 · Last updated: 2026-08-07_

> _Created 2026-08-07, the evening signup went invite only._

Signup is private beta. Nobody creates an account without a code. These six exist already, seeded by migration, so a link can be pasted into an email right now without minting anything first.

**Copy the LINK, not the code.** The link prefills the field and the person sees the code sitting in it, which is what tells them it worked. A bare code makes them find the field themselves, and about a third of people will not.

---

## The six links

| Give to | Link to paste | Uses | Expires |
| --- | --- | --- | --- |
| **YC partners, investors in a deck** | `https://supaprod.ai/signup?invite=YC-COMPOUND-K7QR4V` | Unlimited | Never |
| **Investor outreach outside YC** | `https://supaprod.ai/signup?invite=SP-INVESTOR-M4XT2B` | 60 | Never |
| **Accelerators and incubators** | `https://supaprod.ai/signup?invite=SP-ACCEL-R9WQ7D` | 40 | Never |
| **Journalists and newsletters** | `https://supaprod.ai/signup?invite=SP-PRESS-H3KN8F` | 25 | **90 days** |
| **Your own share link** | `https://supaprod.ai/signup?invite=SP-FOUNDER-V6PL5J` | Unlimited | Never |
| **Design partners** | `https://supaprod.ai/signup?invite=SP-DESIGNPARTNER-Q2ZY9C` | 15 | Never |

**If you only remember one, remember `SP-FOUNDER-V6PL5J`.** It is uncapped, never expires, and exists so that nothing fails in your hands in the middle of a conversation.

---

## Why six and not one

The redemption count is the only attribution this gives us. One shared code answers "did anyone come in", which the accounts table already answers. Six codes answer "did the investor list convert better than the press list", which is a real question in three weeks and impossible to reconstruct after the fact.

It is also the blast radius. A code posted publicly by accident gets revoked on its own, without shutting the door on the other five audiences.

---

## The caps are signals, not limits

Each `max_uses` is set to roughly what that audience could honestly consume. An exhausted code tells you something (the list was bigger than you thought, or it leaked). An unlimited code never tells you anything, which is why only two are uncapped and both have a reason.

**Press is the only one with an expiry**, and deliberately: press access is granted for a story, and a code that outlives the story is a code sitting in a publication's Slack channel forever. Ninety days, re-mint on request.

**Nothing else expires.** An expiring code fails in the worst possible place: a partner opens a deck three weeks after the meeting and the link is dead, with no way to tell that from the product being broken. Revocation is a deliberate act. Expiry is an accident waiting on a calendar.

---

## Managing them

`/admin/invites` (admin login required).

- **Mint** a new one any time, with a note, an optional cap and an optional expiry.
- **Revoke** one that leaked. Revocation is a flag and not a delete, on purpose: **the redemption count survives**, so you can still see how far it travelled before you caught it.
- A revoked code and a code that never existed return the **same** refusal to whoever tries it. Telling a stranger "that code was real once" hands a prober a confirmed hit.

---

## What a person sees if they arrive without one

Not a dead end, and this was a founder ruling on the evening the gate shipped:

> **Invite only, for now**
> Not a no, a not yet. Leave your name and your code arrives the moment a place opens.
> **[ Join the waitlist ]**
> Already have one? Paste it below. The whole invite link works too.

The field accepts a pasted **invite URL** as well as a bare code, because somebody handed a link pastes the link.

---

## One thing this does not do

The gate stands in front of `supabase.auth.signUp`, which the **browser** calls with the publishable key. Someone who skips our form and calls that endpoint directly still gets an account.

Every door the product *shows* is locked, and every account created through one is accounted for against a code. But the wall has a window, and it is worth knowing that before describing this as airtight to anybody. Closing it properly needs a gate inside the database on `auth.users`, which would also block Google signup. Tracked as **P10** on [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md), open, and a founder decision rather than a bug.

---

## Related

- [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) §0a, the access-model change and what moved with it.
- [`../pitch/yc/fall-2026-application.md`](../pitch/yc/fall-2026-application.md), which had to change one line because of this.
- `supabase/migrations/20260807210000_signup_closes_entry_is_by_invite_code.sql` and `..._220000_seed_shareable_invite_codes.sql`, the schema and the seeds.
