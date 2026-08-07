# Pick up here

> _Written 2026-08-07, 22:05 IST. Tree CLEAN and PUSHED. tsc 0, 8289 tests pass, 0 fail, docs-doctor clean._

**Everything below is verified against the running system or the source, on the date shown. Where something was not verified, it says so.** The single board is [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md); this file is the narrow "what happened last, what is loaded in the chamber" note.

---

## The one thing that outranks everything else

**P1. `applyOutcome` has never once completed in production.** Zero outcome memories against 957 total. The compounding claim is the only defensible layer of the three, and it rests on a write path that has never run.

Settling ONE outcome does four things at once: exercises the path, gives `/proof` a real number, produces the only frame where the compounding claim comes from the running system rather than a slide, and unblocks the teaser video's closing shot. **Founder action, minutes.** Spec `60000000-0001-4000-8000-000000000031` on `helio-labs-harbor` via `/learn`.

An agent must NOT author the verdict word. The record's entire value is that nothing in it is invented.

---

## What changed tonight, in one pass

Signup was **open with auto-confirm**; it is now **private beta, invite code only**. That single decision moved seventeen surfaces and broke two things that had to be chased down. If you are reading unfamiliar copy anywhere, this is why.

| Area | State |
| --- | --- |
| Invite gate | Live. Migration, atomic redeem, admin mint/revoke at `/admin/invites`, six seeded codes. |
| Codes to hand out | [`../growth/invite-codes.md`](../growth/invite-codes.md). YC/investor code is `YC-COMPOUND-K7QR4V`. |
| Transactional email | **Working, verified by a real send at 21:58 IST.** Landed in the main inbox, not spam. |
| Waitlist welcome (A1) | Wired, sends on a genuine first signup, branded, in the founder's ruled voice. |
| Email sequences | All eleven rewritten. `docs/growth/email-sequences.md`. |
| Launch funnel | Readable at `/admin/launch`. Was write-only since July. |
| Email health | `/admin/observability`, first block. Reports whether the key is in the RUNTIME, and does a real test send. |

### Tonight's email outage, so it is not re-debugged

Root cause was **one value in the wrong variable**: the Resend API key went into `RESEND_FROM_EMAIL` while `RESEND_API_KEY` was empty, so every send was a correct silent no-op. Both variables were undocumented in `.env.example`, which is why it was guessable at all. Now documented, with the secret/not-secret distinction stated first.

**The key was rendered on the admin page** before that was fixed, because a From header was classified as non-secret and printed on the strength of the variable's NAME. It has been rotated. `looksLikeSecret` now masks anything token-shaped in that panel. **Lesson worth keeping: a misconfiguration panel runs precisely when names and contents have come apart, so no environment value may be echoed because of what it is called.**

---

## Founder actions, blocking real things

1. **Settle one outcome.** P1 above. Highest value action available.
2. **Put `YC-COMPOUND-K7QR4V` in the YC application.** The exact find-and-replace is written out in [`../pitch/yc/fall-2026-application.md`](../pitch/yc/fall-2026-application.md) under the 🚨 block. Seven words in the Login credentials field, Surface 1. **The filed login still works**: the gate blocks account creation, not sign-in, so this is about the "or sign up with any email" clause only.
3. **Six product screenshots** into `public/images/`. `/product` shows six guarded empty frames. `docs/screenshots/` is gitignored, so they cannot be moved from there.
4. **Exact launch day**, privately. Product Hunt needs a date to schedule. Tue to Thu strongest. Show HN at D+7 minimum: HN vote-ring detection shadowbans the **domain**, not the post. The date stays publicly withheld by his ruling, and `LAUNCH_DATE` stays unset.
5. **P10, a real decision not a bug.** The gate is not server-authoritative: `supabase.auth.signUp` is called by the browser with the publishable key, so someone bypassing our form still gets an account. Every door the product SHOWS is locked and every account made through one is counted against a code. Closing it fully needs a Supabase auth hook on `auth.users`, which would block Google signup entirely. Not decided unilaterally.
6. **Postal address**, when the nurture emails go. CAN-SPAM applies to commercial mail; A1 is transactional and exempt. A2 to A5 and the launch announcement are not. A virtual mailbox is same-day and does not need incorporation.
7. **P6, `authorization_servers: []`.** Does the MCP server delegate to Supabase or issue its own tokens? No `authorize`/`token` route exists to settle it. Deliberately not guessed.

---

## Agent work, ready to start, nothing blocking

Ordered by launch cost.

1. **P5, `/brief` and `/investors` are invisible to crawlers.** Both render `BriefDeck`, which is a full-viewport iframe over `public/brief.html`. Google does not attribute iframe content to the parent, so the investor page is empty to search AND to AI answer engines, which the founder asked for by name. Also zero headings and zero landmarks in the parent, and `brief.html` reportedly carries 15 flat `<h1>`s. **Two agents were dispatched at this and both died on the monthly spend limit before writing anything. Nothing is half-done; the tree is clean.** Do NOT ship off-screen keyword text: that is cloaking.
2. **Launch-day operations runbook.** Bug triage severity a tired person can apply at 2am, what to watch and the number that means act, where feedback physically arrives, first-week rhythm, and which lever turns off what. **Same two agents died on this one too.** Ground every instruction in something that exists; the most valuable output is naming what the runbook needs and does not have.
3. **P11 is closed but the lesson is open.** "Join 100+ design partners" was removed from `/product` tonight; nothing was behind the number. A sweep of every public route found no other unsourced count. Keep sweeping when copy lands.
4. **P7 site-wide soft-404.** Unknown paths return 200 with the SPA shell. `/.well-known/*` is fixed, the rest is not. Needs the router to signal `notFound`.
5. **P8 app-shell JS on marketing routes.** 249.6 KB gzip, 34 preloads. `__root.tsx` ships QueryClientProvider, Radix AlertDialog and a Supabase auth listener to pages that render none of them.
6. **Teaser video.** Tool choice, flows and USP order can all be drafted now. Only the closing frame is blocked, and it is blocked on P1.
7. **Brownfield positioning.** `docs/strategy/brownfield-positioning-evaluation.md` exists and needs the founder's read, not more agent writing.
8. **P9 is closed.** Workspace invitations were broken by the gate for about an hour and are fixed: a workspace invitation is now its own proof of admission, CHECKED server-side rather than trusted. Do not "simplify" that into honouring `?next=` directly; that is a bypass.

---

## Rules that cost real money to relearn

- **Size type to the render, not the file.** LinkedIn draws a 4200px cover into an 804px box. The favicon was stroked for a 16px tab and served to a 48px mail avatar. Both shipped wrong for the same reason.
- **`public/` is generated, or it rots.** Five hand-maintained files were found there in one day: the OG card, the icon set, the FAQ schema, a LinkedIn JPEG no code ever wrote, and `favicon.svg`, whose generator had **zero callers**. Check an asset's date against the ruling that governs it.
- **Never edit a historical migration.** `ea899590` did, and the fix was inert against every database that had already run it.
- **Constrain audit agents to read-only tools.** Seven agent commits once went up unreviewed, authored as the founder.
- **Commit file-by-file while agents are running.** A `git add -A` swept one agent's privacy fixes into an unrelated commit tonight; the message does not describe its own contents.
- **Verify a board row before spending an agent on it.** Two rows tonight said not-started for work that had shipped hours earlier.
- **Claims law.** If a number cannot be pulled live, it does not render. Two false-claim clusters were found today: `/privacy` described a tracking cookie, four localStorage keys and an analytics vendor that do not exist, and `/product` claimed a hundred design partners. Both were placeholder text nobody revisited, and both claimed MORE than the product does.
- **Never say the product "remembers", "stores" or "logs".** All three claim less than it delivers. It learns, then guides.
- **No em or en dashes.** A pre-commit hook enforces it.

---

## Related

- [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md), the single board, section 0a for the access model.
- [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) section 0, the live cursor.
- [`../growth/invite-codes.md`](../growth/invite-codes.md), the six links and how to revoke one.
- [`../growth/email-sequences.md`](../growth/email-sequences.md), all eleven emails and the two blockers on the nine that cannot send.
