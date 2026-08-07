# Resume here

Written 2026-08-07 ~15:45 IST. Soft launch is THIS WEEK (Product Hunt + X).

**Everything is committed and pushed. The tree is clean.** Gates at push: `bunx tsc --noEmit` exit 0 · `bun run docs:check` clean of hard rot · the blue guard 3 pass.

**The founder is running this one item at a time and asked explicitly for that pacing.** He said: *"You are giving one after the other, but I'm not able to close one."* Do not open a new workstream while one is open with him. Finish, confirm, then offer the next.

---

## 1. Start here

**Nothing today is live.** Every fix below is pushed to `main` but Lovable has to redeploy before any of it reaches `supaprod.ai`. The founder is still seeing the old share card and the old favicon. **Confirm the deploy first**, then re-check `supaprod.ai/og-supaprod.png` and `/favicon.svg` against the repo copies.

**Then the one action with the highest leverage in the whole project:** settle one outcome through `/learn` on `helio-labs-harbor`. Two shipped specs have `outcome` null:

- `60000000-0001-4000-8000-000000000031` — "Add SSO to the billing site"
- `60000000-0001-4000-8000-000000000002` — "Job handoff checklist for the homeowner"

`applyOutcome` **has never once completed in this database**: zero `agent_memory` rows of `kind='outcome'` against 957 memories, and none of the 7 prds carrying an outcome has the `settled_memory_id` that function always writes. One settle exercises it, gives `/proof` a real number instead of an honest zero, and produces the only frame in the product where the compounding claim comes from the running system rather than seed data. Three blockers, one action.

## 2. Seven commits from audit agents went up unreviewed

A parallel audit was dispatched with full tool access rather than read-only, and its agents wrote and committed code. They are authored as the founder because agents inherit git config. He chose "review each, keep the good ones", **and that review never happened** before he asked for everything to be pushed.

```
1435dc35  Launch readiness: fix 3 SEO blockers + add execution tracker
ea899590  Fix: memory_expiry_enabled() paid tier list missing enterprise
3e248767  Launch prep: founder decision framework
1c0edc30  SEO: add canonical tags to all public routes
3285a559  SEO/GEO: add FAQ page with question-shaped headings and FAQPage schema
21d0b512  SEO/GEO: fix llms.txt alignment and remove 404 references
65c925b7  SEO/GEO: create llms-full.txt for AI crawlers
```

**`ea899590` is the one to look at.** It edits a historical migration (`20260616210000_mc_memory_expiry.sql`) instead of adding a new one. The content is right — it adds `enterprise` and `max` to the paid-tier list, defusing the memory-expiry loaded gun — but **editing an applied migration does nothing to the live database.** The fix is inert and the gun is still loaded. Redo it as a new migration with `CREATE OR REPLACE FUNCTION`.

They also ran a broad `git add` and swept unrelated uncommitted work into their commits, so no commit is cleanly one author's intent. **When dispatching audit agents, constrain them to read-only tools.** One verifier caught a sibling committing with a false commit message.

## 3. What shipped today

| | |
| --- | --- |
| **The share card said "Cadence"** | `public/og-supaprod.png` was dated Jul 1 and used the banned word "remembers", on the card every share renders. The corrected ORRERY card had been in the kit since Aug 6. |
| **The icons were violet** | Every file in `branding/icons/` predated the founder's 2026-08-05 ruling by three weeks. A comment in `generate-social.ts` actively defended the blue as "already right", which is what sent an agent to the wrong folder. Retired. |
| **The favicon was one orange dot** | `faviconMark` strokes 0.74px at 16px. New `faviconIcon()` uses a **circular** ground at 96% fill, stroke 10. The circle is the founder's call and it is right: a round mark in a round frame wastes no corners. |
| **Four false FAQ claims** | Linear, Jira, Notion and Google Docs were named as integrations; all four are `stubAdapter`. Also a false CSV claim and a misleading "your own Postgres database". Rewritten, and the JSON-LD is now derived from one array instead of hand-synced. |
| **`/proof` was 100% seed data** | All 28 scored insights in the database come from Helio workspaces. Six clones excluded by id. |
| **The waitlist would have rejected the launch** | Global brake at 20/min. Raised to 300. |
| **No human channel on the site** | `hello@supaprod.ai` in the footer; the X link was a 404. |
| **`check-handles.sh` lied about domains** | Mapped a rate-limited empty body to AVAILABLE. Reported `supaprod.ai` free, a domain owned since July. |

## 4. Where the ledger lives now

**Founder ruling: the account ledger is in Notion, and the repo links to it.** [`Supaprod · Brand & Social Accounts`](https://app.notion.com/p/3b33f54c86c281b1968fdcedb5e7785d) is the record; `social-accounts.md` §8 now points there and keeps its table only as history.

The reason the direction reversed: the repo declared itself canonical and was wrong in three places Notion had right. **An account gets claimed on a phone, in the same minute as a decision, and a markdown file behind a git commit is not reachable at that moment.** Check the live account before trusting either.

**LinkedIn is nearly closed.** Page live at `linkedin.com/company/supaprod`, vanity slug held, logo, tagline, and **the About text is in as of 15:41 IST**. Remaining: Founded `2026` on the `Details` tab, Location `Remote` on the `Locations` tab.

Two LinkedIn items are deliberately parked. The **cover image** is a composition fault, not an upload fault — the orrery runs off the right edge and LinkedIn crops ~4% more per side, cutting ellipses mid-arc. Re-uploading the same file will not help. And **adding the founder as an employee is deferred on his own reasoning**: it requires a position on his personal profile while he is employed elsewhere, and the real exposure is IP-assignment and moonlighting clauses, not perception.

## 5. Two rules this session paid for, and they are in memory

- **Push back when the doctrine is wrong.** The favicon README had *diagnosed* the 16px problem and then shipped a favicon that failed at 16px. Quoting the diagnosis made the failure sound intentional. A document describing a constraint is not permission to ship the consequence. The founder asked for this to persist: *"If it is coming from my own ruling or a document, you just push back and do the right things."*
- **Corrected source, stale artifact.** Three times in one day: the OG card, the icons, the FAQ schema. **Nothing regenerates `public/` from the brand kit**, so every ruling has to be carried by hand. That build step is the real fix and it is still open.

Also: **upload the 1024 avatar everywhere and walk down the ladder only if rejected.** The asset map named display sizes as if they were upload ceilings, and the founder found it by uploading 1024 where the doc said 400 and seeing it render sharper.

## 6. Open, in order

1. **Deploy** and verify the assets are live.
2. **Settle one outcome** (§1).
3. **Redo `ea899590`** as a new migration.
4. **Finish LinkedIn**: Founded, Location.
5. **Open the "Security — 4 issues" badge** in the Lovable panel. Visible in a screenshot on 2026-08-07 and never examined. It is the one "not assessed" row worth closing before launch.
6. **Product Hunt account.** Does not exist. PH bans brand accounts from posting, so it must be a personal maker profile.
7. **Homepage Receipts**: label as examples per the founder's ruling.
8. **LinkedIn cover** regeneration.

Full board: [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md), which now covers every checklist domain and marks the unexamined ones **"not assessed"** rather than green. Video plan: [`../pitch/teaser-video-plan.md`](../pitch/teaser-video-plan.md).

**The positioning question is answered and needs no more work.** Brownfield is not an expansion to announce; it is already the shipped position. The gap runs the other way: the site promises connectors that are stubs.
