# The YC application — Fall 2026 (previous vs new, field by field)

> ⛔ **NOT THE PASTE SOURCE (2026-08-11).** Paste from [`APPLICATION-FINAL.md`](./APPLICATION-FINAL.md). **This file keeps the reasoning, the audit history and every superseded draft**, and those drafts still contain retired numbers (401/362 register counts, 133 missions, 3,979 commits, 387 migrations) and older phrasings on purpose, as the record of what was corrected. **Nothing in this file may be copied to the form.**

> **⭐ NOT YET SUBMITTED (founder, 2026-07-24) — apply the deck-session canon in the pre-submit pass.** Every text surface below is still editable; nothing is locked. Before pasting any column into the portal, sweep it against the 2026-07-24 canon (full version: [`../repositioning-2026-07-22.md`](../repositioning-2026-07-22.md) §0; deck: [`../investor-deck/`](../investor-deck/README.md)):
>
> 1. **Launch date: September 2026** everywhere forward-looking (supersedes August / "weeks away").
> 2. **Market sizing answers use the work-budget ladder:** TAM $300B+/yr (2.6M PMs x ~$115K loaded, the work paid as headcount); SAM $2B -> $12B/yr (650K existing teams + 500K new agent-native orgs by 2030, launch to value pricing); SOM ~$47M ARR (the agent-native tenth). Retire "$8B PM software" and "$18B" wherever they appear.
> 3. **The brain guides, it is never storage:** "every decision is recorded with its evidence and graded against what happened; it compounds, tells you what is right next time, and warns before you repeat what was wrong." Use this beat wherever the memory layer is explained.
> 4. **Engine wording (own-engine ruling):** our own build engine runs frontier models via API in the customer's repo; never "we dispatch to Cursor/Devin".
> 5. **Numbers card must be re-verified the morning of submission** (register, commits, missions move daily; the deck-session snapshot was 401 specced / 362 shipped and ~4,000 commits in 7 weeks).
> 6. **Employer framing:** legal name in form fields is fine; in prose, "Intellect, a leading BFSI technology OEM serving 200+ financial institutions across 70+ countries." Role arc: ISRO associate PM -> Infineon PM -> Intellect senior AI PM.
> 7. The door anchor ("Cursor for PMs") stays allowed on YC surfaces per §5 of the repositioning memo; the deck-only never list does not bind this file.

> _Created: 2026-07-10. Deadline: **July 27, 2026, 8pm PT** (verified). Reviews are rolling — the 10-minute interview can land any time once the application is read, so interview-ready means ready the day you submit (YC's posted outer bound: decisions by Aug 28, batch Oct–Dec in San Francisco, $500K standard deal)._
>
> **How to use this file:** five columns now. ① PREVIOUS (the rolled-over application) and ② NEW (2026-07-10) sit field-by-field below; ③ the ⭐ SUBMIT SHEET (2026-07-22) and ④ 🔥 THE NEXT ITERATION (2026-07-22) were the submit-day rewrites. **The application is SUBMITTED. The 🚨 UPDATE SHEET (⑤, 2026-07-23) is the only operative column now — YC's portal exposes exactly five editable surfaces, and ⑤ maps them one to one. Columns ①–④ stay untouched as the historical record and as interview prep (a partner may quote the locked text back at you).** Anything in `[square brackets]` is a slot you fill or confirm on paste day — never submit a bracket. The evidence behind every choice: [`research-findings.md`](./research-findings.md). Interview prep: [`interview-prep.md`](./interview-prep.md). Videos: [`video-scripts.md`](./video-scripts.md).

## ⚠️ 2026-08-10 — PASTE-READY CORRECTIONS FROM THE CORPUS SWEEP. DO THESE BEFORE ANY OTHER EDIT.

> _Grounded in a full read of the market — 679 documents / 5,935,025 words, plus the members-only PM community. Canon: [`../../strategy/positioning-locked-2026-08.md`](../../strategy/positioning-locked-2026-08.md). Four fields below carry claims that are now **falsified**, not merely dated. Ranked by damage if a partner tests them._

### 🔴 1. Surface 1 → the "How far along are you?" sub-field

> **⚠️ My first draft of this was wrong and is deleted. Recording the error because it is instructive.** I wrote a narrative "Progress Update" as though Surface 1 were one free-text field. **It is not.** It is three sub-fields — Product link, Login credentials, and *"How far along are you?"* — and only the last carries prose. Worse, my draft answered *"what did I learn this month"* rather than *"how far along is the product."* **A partner reading for under three minutes wants users, usage and velocity, not a research story.** Founder caught it; he was right.

**What a partner actually scans this field for, in order:** users · usage · velocity · one non-obvious thing · what's next. Everything else is filler and costs you the read.

**Audit of the version currently on the form** (see the full text further down this file):

| Keep | Cut or fix |
| --- | --- |
| The rename line — it must stay first | **No user number anywhere.** This is the single biggest gap; it is the first thing a partner looks for |
| "I am user zero" + roadmap-runs-inside-Supaprod | The decade/month/seven-weeks journey — that is backstory, and 9a already carries domain expertise |
| 4,900+ commits (velocity proxy) | *"It is almost there, not finished"* — hedging that buys nothing and costs credibility |
| September launch, brief link | *"feedback goes straight back in: design iterations, new roadmap items"* — vague. Name what changed, or cut it |
| | **No product numbers at all** — and we now have three good ones |

**PASTE THIS.** Plain words, real numbers, one thing admitted:

```
Cadence is now Supaprod. I renamed it after applying and the form won't
let me change the name. Same company, same person, live at
https://supaprod.ai.

Where it is now: it runs end to end. Signals come in from the tools a
team already uses, it argues against the weak ideas before I see them,
agents write the code and open pull requests, and nothing merges without
me. 4,950 commits and 510 database migrations in ten weeks.

The part I most wanted to work is working, and I want to be precise about
what that means. The loop is wired end to end: a shipped spec gets a
verdict, the verdict is written back against the decision that caused it,
and the next decision is ranked using it. I can show you that path running
on a live database. What I cannot show you is a long record of it, because
that record only starts when someone runs real work through it.

Two things I got wrong and fixed, and I would rather you heard both from me.

I had been telling people a competitor can't rebuild your decision history.
That isn't true. You can reconstruct most of it from Slack and call
recordings. What you can't reconstruct is what someone expected to happen
before it happened, because almost nobody writes that down. So I built that.

The second one is more embarrassing. I had three numbers here that I was
proud of, about lessons recorded and decisions made from earlier lessons. I
went to re-verify them and they were all my own demo data. The query that
told demo from real matched on the shape of a workspace id, and the function
that creates sample workspaces gives them ordinary ids, so the sample rows
counted as production. The true count on real work was zero. I found it, I
shipped a column so the two can never be confused again, and I am telling
you instead of letting you find it.

Everything above was decided, specced and built inside Supaprod itself.
That is how I know it works end to end before I ask anyone else to trust
it.

[FOUNDER: the real user count goes here, in one sentence, if any exist by
paste day. This is the number a partner looks for first, and nothing above
substitutes for it. Never pad it.]

Public launch in September. Full brief at https://supaprod.ai/brief.
```

> ### 🔢 NUMBERS: re-run these the morning you paste. I got them wrong once already.
>
> The draft above inherited **4,000 commits / seven weeks** from the 2026-07-23 pass and I did not check it. Live count on 2026-08-10 was **4,872 commits and 508 migrations across eight weeks** — a 20% understatement of our own velocity, in the field where velocity is the point. **A stale number here is worse than a missing one**: it undersells the work and it signals the founder is not close to their own metrics.
>
> ```bash
> git rev-list --count origin/main          # commits
> ls supabase/migrations/*.sql | wc -l      # migrations
> scripts/dashboard-tally.sh                # register: specced / shipped
> ```
> ### 🛑 THE THREE PRODUCT NUMBERS WERE SEED DATA. PULLED 2026-08-11.
>
> **119 lessons, 38 self-decided, 36 decisions from an earlier lesson are all removed from the copy above.** They were never real. Two lanes queried the live database independently and got the same answer, and every one of the following is checkable in about ten seconds:
>
> - **All 119 `learnings` rows sit in seeded workspaces.** "Sample sandbox" 17, "Sample workspace" 16 and 16, "Explore workspace" 16, seven fixture workspaces named "Helio Labs" 38, and one orphan. **Real count: zero.**
> - **37 of the 119 are dated before 2026-06-02**, the repo's first real commit. The earliest is **2025-12-05**, six months before the product existed. They describe outcomes that could not have happened.
> - **The orphan workspace `b13b3c2d` has no row in `workspaces` at all.** Sixteen learnings pointing at a workspace that does not exist.
> - **`38 self-decided` is arithmetic on the fixture.** The seven "Helio Labs" workspaces hold exactly 38 learnings between them.
> - **`36` is `artifact_lineage` where `parent_kind='learning'` and `child_kind='decision'`.** 71 rows total, **0 with `seeded = false`**. It read as 36 because the census told demo from real by matching the *shape* of a workspace id, and `seed_sample_workspace()` gives its workspace an ordinary random id. The test was wrong in both directions.
> - **The clinching one: `parent_kind='prd'` and `child_kind='learning'` returns zero rows.** Not zero real, zero. That is the edge written when a shipped spec gets its verdict. A product that had truly recorded 119 lessons from shipped work would have 119 of them.
>
> ```sql
> select count(*) filter (where not seeded) from artifact_lineage
>   where parent_kind='learning' and child_kind='decision';   -- the 36. returns 0
> select count(*) from artifact_lineage
>   where parent_kind='prd' and child_kind='learning';        -- the writer that never fired
> select count(*) from learnings where created_at < '2026-06-02';  -- 37 predate the repo
> ```
>
> **The rule this establishes, and it is the expensive lesson: never present a number as proof without the query that produces it beside it.** These three had no recorded SQL anywhere in the repo. The file told the founder to "confirm them the same morning" and gave him no way to do it. Any figure quoted outward now carries its query or it does not go.
>
> **Assume every number in `docs/` is suspect if it separates demo from real by the shape of an id.** The pattern is `_0000000-0000-4000-8000-000000000000` and it is wrong in both directions. A `seeded` column now exists so this cannot recur.
>
> **The replacement claim is the mechanism, not a metric**, which is the form `CLAUDE.md` already prescribes: the loop is wired and proven, and it begins accruing on first real use. **Do not substitute a smaller number.** A smaller number is still a number a partner can query, and it would still be zero.
>
> _Verify the two commit-side figures the morning you paste; those are sound and reproduce from the commands below._
>
> **Every number in this file now routes through [`../verified-numbers.md`](../verified-numbers.md).** Read it before typing a figure anywhere. It carries the query beside each one, the honest set excluding seeded workspaces, and the retired list. **This file still contains stale vintages of the same quantities in the draft blocks further down**, including 83, 176 and 145 for missions and 384, 387, 393, 508 and 510 for migrations. The copy-paste sheet is the only authority here, and `verified-numbers.md` is the authority over that.
>
> **Why "I'm my own first user" is gone.** It was in the draft and it reads badly to a partner: *if you are the customer, who pays you?* The dogfooding fact is genuinely strong, but it is **proof the product functions, not proof anyone wants it** — so it now says what it actually proves and stops there. It cannot stand in for a user count, and the slot above says so explicitly.

**Why it is written this way.** A partner reads hundreds of these and is pattern-matching for *is this a real problem, is this person unusually good, do people want it*. So: **no vocabulary a stranger would have to decode.** Not "the loop closes", not "evidence bar", not "the judgment gap" — every one of those is our word, not theirs. *"The thing gets less wrong the longer you use it"* says compounding without the term.

**What carries the answer now that the product numbers are gone.** *4,950 commits and 510 migrations in ten weeks* is rate of progress, which YC weights heavily, and it reproduces from a one-line command. The rest of the weight moves to the **admission**, and that is not a consolation prize: the field now contains a founder catching his own false metric, naming the exact mechanism that produced it, and shipping the fix. **Do not go looking for a third number to replace the ones that were pulled.** The reason the old ones were dangerous is that they were checkable and wrong, and a partner who queries and finds zero has learned something far worse about us than that we are early.

**Two hard rules on the numbers.** Say **lessons, never outcomes** — `agent_memory` holds zero `kind='outcome'` rows and a partner who checks will find it. And **no user count unless one is true** — the empty slot is more honest than a padded number, and a padded one will not survive the interview.

**The paragraph I would fight to keep is the admission.** It is the only part that cannot be written by someone who is not really building this, and YC weights *updating on evidence* more heavily than being right the first time. It is four plain sentences and it earns more trust than any claim in the field.

**Also update, same surface:** Product link → `https://supaprod.ai`, and the login line's last clause → `or sign up with invite code YC-COMPOUND-K7QR4V` (signup closed 2026-08-07; the old "any email" path now hits a wall). Both are detailed further down.

### 🔴 2. Field 7f — the closing paragraph states the falsified claim

**Current, replace it:** *"What makes it compound: every decision is recorded with its evidence, and every outcome is checked and remembered. That record becomes the brain of your product org…"*

**Two defects.** "Remembered" is banned vocabulary (it claims less than the product delivers), and **"that record becomes the brain" is the exact claim the sweep falsified** — the record is reconstructable. **Paste this instead:**

```
Here is the part I think nobody else has. Every decision is saved with
the evidence behind it and with what you expected to happen. When the
result comes in, it checks the two against each other. You can dig up why
a call was made months later from Slack and old calls. You cannot dig up
what people thought was going to happen, because almost nobody writes
that down. So over time the system knows what happened, what you
expected, and how often you are right.

Agents do the work. You answer for it. Supaprod is how you answer.
```

### 🔴 3. Field 9b — the competitor set is wrong, and this is the answer most likely to impress

**Current** names Samepage, Brief, Productboard, Notion, and closes on *"it cannot be copied quickly, because it only accumulates with time."*

**Both halves are weak now.** The corpus says **the real competitor is DIY — the folder** — and the time-accrual claim is the falsified one. This rewrite is also strictly more interesting to a partner, because it concedes the strongest objection and then answers it:

```
My real competitor isn't another product. It's a folder of notes.

I went and checked instead of assuming. Last month six product managers
in a private group talked someone out of buying anything in this
category: don't switch tools, use simpler ones. One of them had tried
four products built for exactly this and gone back to a plain folder of
markdown files. Their strongest argument was that simple files work
better with AI, because an agent can read and write them easily.

They're right about that, and it's still the wrong conclusion. An agent
can write into a Notion page or a GitHub issue. It can't write a decision
into one that carries the evidence behind it, who made it, a slot for the
verdict, and a gate so a human signs off. Simple files are easy for an
agent to write and impossible for an agent to govern. Someone else in
that same group tried a folder, gave up, built his own system, and still
couldn't solve it: he could not tell who changed what, which notes he
could trust, why they changed, or stop the ones that shouldn't.

That gap opens the moment a second person or a fleet of agents touches
the work. That's where I sell.

The startups here, Samepage and Brief and Productboard's Spark and
Notion's Ship OS, all stop one step earlier. They collect, draft, or
dispatch. None of them goes back and checks whether the thing you shipped
did what you said it would.
```

### 🟡 4. Field 9a — strong already; one sentence makes it much stronger

Keep it. **Add this after the 1,500-hours line**, because a practitioner naming the pain unprompted outranks YC's own RFS as evidence:

```
Then a working PM named it better than I had, unprompted, in a private
community: "PMs got faster at shipping but didn't get better at
defending why. The judgment gap got exposed."
```

### 🟡 5. Surface 3 — Team Update: one word

The answer is strong and should stay. **One change:** it closes *"with receipts for everything they did."* **"Receipts" is retired vocabulary** — it appears 17 times in 5.7M words of this market's own writing, effectively zero. Replace with:

```
with a record of every action and who approved it.
```

### 🟡 6. Surface 4 — Founder Video (≤1:00)

**Do not open with "the agentic-first operating system for product teams."** Platform words burn the first five seconds, which is the only part of a one-minute video that is guaranteed to be watched. **Open on the three beats** (§5G of the canon):

> *"The half of the job that was doing the reps is going to agents. What doesn't compress is deciding what's worth doing, defining what good looks like, and catching when the system is confidently wrong. Supaprod runs those three."*

Then the rename, then user-zero, then the forecast line in one sentence. **Sixty seconds allows roughly 150 words — that is four sentences and a sign-off. Cut everything else.**

### 🔴 7. Surface 5 — Demo Video (≤3:00): one hard constraint

**Do not demo the full station walk.** Three lineage hops had no writer until 2026-08-10 — `mission → changeset`, `changeset → deployment`, `prd → learning` — so the ~35 production edges of those shapes are **demo seed**. A "watch it flow to shipped" walkthrough traverses exactly the region that is not real yet, and it is the single most testable thing in the application.

**Demo the Discover → Decide → Learn half.** It is real, it has always been real, and it is where the 36 lineage edges live. That is also the strongest three minutes available: signal in, Critic red-teams it, human decides, outcome settles, and the next decision visibly uses it.

### ✅ Already handled elsewhere

- **9c** — paste-ready correction sits at its own section below (the spliced Mosseri/Lemkin arithmetic).
- **Interview prep** — brutal question #13 in [`interview-prep.md`](./interview-prep.md) covers the spliced claim if a partner quotes locked text back.
- **7b (50 characters)** — *"Cursor for PMs, but for the whole product org."* survives the sweep unchanged. No edit needed.

### ❌ Three things that must not appear anywhere in this application

1. **No present-tense accumulated-learning claim.** *"We learn from your corrections"* does not survive one query against `agent_memory`, which holds zero outcome rows. Say *wired and proven, accrues on first real use.*
2. **No unbroken signal → shipped → learned chain.** It is broken in two places: Discover promotes 3 of 86 themes, and Build writes no changeset or deployment edges.
3. **No inevitability language.** The most credentialed post of its era called web3 *"risky and inevitable"* and pointed readers at FTX nine months before it collapsed.

---

## The five laws this application is written under

1. **True on the day you hit submit, with zero outside users.** Plans appear as dated plans. Nothing depends on August going well. YC verifies numbers ("if you state numbers in the interview we may ask for verification").
2. **The honesty dial (founder calibration, 2026-07-10).** Truthful is not the same as self-deprecating. Candor goes where the form asks (users, revenue, stage) and is stated as fact plus what happens next — never as apology, never volunteered in fields that don't ask. Exactly one vulnerability beat in the whole application (pricing, framed as the experiment it is). Everywhere else: PG's formidability bar, "justifiably confident."
3. **Unconditional commitment (founder calibration, 2026-07-10).** No "if accepted, I'll…" framing anywhere. The company is happening full-time regardless; YC changes the speed and the zip code, never the decision. (This is also Close's seventh deadly sin inverted: neediness and contingency read as weakness.)
4. **Plain words.** No marketing-speak (PG: "We're immune to marketing-speak; to us it's just noise"), no AI cadence, short sentences, exact numbers however small. Full banned-words list at the bottom.
5. **Lead with the delta, land the scope.** YC's FAQ: progress since a prior application "is a strong signal" — make it impossible to miss in a 90-second skim. And "Cursor for product managers" is the door, not the room: the answers escalate to what this actually is, the operating system a whole product org runs on.

**What a partner is scanning for, in order:** (1) do I get what this is in one sentence, (2) is there an earned insight, (3) is this founder formidable, (4) is anything real and live. Every answer below serves one of those four.

---

## 🚨 THE UPDATE SHEET — fifth column (2026-07-23). SUBMITTED; five surfaces remain editable. This is the operative section.

> _Status: the Fall 2026 application is in (YC portal id `6e83e72d-8136-4cad-87…`). The portal now shows only **Update your application** with five surfaces — Progress Update, Fundraising Update, Team Update, Founder Video, Demo Video (founder screenshots, 2026-07-23). Everything else (7f, 9a, 9b, 9c, the 50-char, company name) is locked with whatever was live at submit — and for the Progress and Team fields that is still the ① PREVIOUS text ("three weeks ago… Cadence… no users… 6 weeks away"). **So these five surfaces are the only place the current truth and the sharpened positioning ever reach a partner. Written for the real read: tens of thousands of applications per batch, under five minutes per file including videos — first sentence carries the whole answer, numbers argue, nothing is volunteered twice.**_
>
> _Numbers pulled live 2026-07-23: repo **3,979 commits · 387 migrations**; register **401 specced / 362 shipped** (`scripts/dashboard-tally.sh` reproduces it); homepage counters **83 missions run · 26 decisions recorded · 16 outcomes graded · 840 AI calls**. The counters are STRICT: the 2026-07-22 seeding correctly flagged the demo workspaces (Sample sandbox, Explore workspace, Helio Labs `10000000-…`) as samples, so the public numbers dropped from the 145/81/54 in column ③. That is the Receipts law doing its job (undercount, never inflate) — the copy below quotes the strict numbers and says so out loud. Raw totals including seeded content are 151/103/86/4,333; never quote those. **Re-pull every number the hour you paste — the counters render live and a partner can check them.**_
>
> _Founder pass #2 (2026-07-23, plan-approved): hard numbers are OUT of the pasted copy — they live on the interview numbers card ([`interview-prep.md`](./interview-prep.md) §2) — except the ~4,000-commits line, kept in BOTH "how far along" and "how long" (founder ruling 2026-07-23: it is journey evidence). The listening/user spotlight is in. The audit is phrased as what it actually was (a Claude-based review, not an outside firm). No solo-founder self-reference anywhere. Product Hunt / Hacker News appear as presence, not the distribution strategy. And every field below now shows ON THE FORM NOW vs PASTE THIS side by side, so paste day is compare-and-go._
>
> _Founder pass #3 (2026-07-23): the homepage-numbers pointer is CUT (flagged twice = veto). No meta labels ("Why this matters now"). The telling is reordered to how the founder says it to a human: what-to-build leads (reads your feedback/data/competitors/market → tells you what is worth building), Cursor is a plain analogy clarified as end-to-end ("the whole product lifecycle, not just writing code"), and the brain closes with the concrete beat ("shows you how you decided last time and whether it worked"). **RFS references go implicit in update copy** — no verbatim "Cursor for product managers" / "company brain" / "AI operating system" quoting (reads as copying YC's words); one attribution sentence instead ("YC's own recent RFS essays have been circling this same company"); the locked 9a still carries the dated explicit citations, which is fine. Build+listen is a parallel loop, never sequential ("I keep building, with the beta live; feedback goes straight back into the build"). BYOK is enterprise-scoped. Connectors stay OUT of the tech stack (privacy/PII questions invited for no gain; the signal sources are already implied in "reads everything you already know"). The canonical layman two-liner + sub-50 live in [`../repositioning-2026-07-22.md`](../repositioning-2026-07-22.md) §3._
>
> _Founder pass #4 (2026-07-23): **answer the question asked** — every field re-audited for drift. "How far along" now answers PROGRESS (the journey: decade of pain → prototype → seven weeks → beta live with building and listening in parallel, design iterations, roadmap reshaped by feedback → launch next), not what the product does; the loved what-it-does telling is preserved right below that field and in `README.md`. "Almost done, not finished" replaces any fully-done claim. "Full-time in every sense but the paperwork" is gone — the employment line is one true clause with no gray area. The batch line adds mentorship. The stack answers only what WE use (the customer BYOK offer removed — they asked what we use, not what we sell). "When version" drops the demo-login echo and names forums (Hacker News, Product Hunt) as presence. "Who writes code" now leads with everything built in-house by me + agents (design, development, coding, testing, user analysis) and spotlights the independent Claude-based security review._
>
> _Founder pass #5 (2026-07-23): stack made explicit and audited legit — Language: TypeScript end to end (verified: server functions in the same TanStack Start app, no other backend language); Backend named as its own line; Deployment verified real (wrangler.jsonc + the Cloudflare Vite plugin compile the app into a Worker; serverless at the edge; published through Lovable); PostHog/Sentry verified present in the observability layer + the form allows "planning to use." "When version" softened: "live and open for beta users; people can get their hands on it" — never "fully usable/done."_
>
> _Founder pass #6 (2026-07-23): "when version" now leads with the DATE — "By the second week of September (six weeks from now)" — target first, current standing second (confidence + drive), and the how-far-along close carries the same date so a cross-reading partner sees one consistent target. The tech stack is FOUNDER-FINALIZED in his own structure (Backend and data merged with TypeScript named; bare "Cloudflare Workers"; "feature gates" added to the chokepoint list). Two corrections applied to his paste: "featuregate" smoothed to "feature gates," and "users bring their own keys" kept OUT per his own round-4 ruling (the question asks what WE use, not what we offer customers) — restore it only if he re-rules._
>
> _**✅ STATUS (2026-07-23, end of day): FILED.** The founder pasted the three text surfaces into the YC portal: the Progress Update fields and the Team Update (Fundraising untouched — nothing to file). **REMAINING: the founder video (≤1:00) and the demo video (≤3:00).** Before filming, the scripts need a truth pass against the live app — two founder-reported gaps are logged at the top of [`video-scripts.md`](./video-scripts.md): the post-login home is no longer a Today view, and the lifecycle now runs plan → design (prototype) → build → ship. From here until the interview: the one-line daily delta per [`interview-prep.md`](./interview-prep.md) §5._
>
> _**🔎 FINAL CHECK PASS (2026-07-28, screenshots vs canon, founder present).** The 07-23 text surfaces are live on the form and match this sheet nearly verbatim. What changed tonight: (1) **launch phrasing is month-only** — "in September", no week or date (founder ruling 2026-07-28); both date-carrying paste blocks below are updated and need a re-paste. (2) **The company-brief pointer** (`https://supaprod.ai/brief`) joins the how-far-along close — the investor-spotlight the founder asked for; verified live, zero YC mentions inside the deck. (3) **Commit count 4,119** (2026-07-28): "4,000+" is settled wording in both fields; the form's "about ~4,000+ commits" mishmash gets cleaned by the re-paste. (4) **The five repos from the profile ruling went private** 2026-07-28 via authenticated API (Project-Cadence v1–v4 + build-in-public; verified, 46 public remain, all forks except `Test-Project-Cadence`, flagged to the founder). (5) **Demo-login queue re-armed** — the seeded 5-pending approval queues had decayed to 1 pending + 4 expired in EVERY demo workspace via `expires_at`; reset 2026-07-28 with a 60-day runway (details in the credentials note below). (6) **Demo video: replaced** — the 4:51 / ~46 MB Supaprod cut is up (the 11:46 Cadence video is retired); it runs past the form's stated 3:00 guidance, a deliberate founder call, wedge front-loaded. (7) **Founder video: still the submit-day 2:53/2:54** — Surface 4 remains the one open surface. (8) The "Are people using your product?" radio stays a founder-fact call: the ruling below still governs (No + availability is consistent; flip to Yes only with literal outside users, then state the true count)._

> _**🔧 TECH-STACK PASS (2026-08-03, founder-requested, verified against the repo and the live database).** The tech-stack paste block is updated and needs a re-paste. Four changes, each checked before writing: (1) **Cohere embed-v4 named** as the embedding provider (`src/lib/rag/embed.server.ts:26`; 1,005 live `cohere/embed-v4.0` calls in `ai_events`). (2) **Qwen named, and a "running today" clause added** because the live model mix is Qwen and Gemini on the agent loop with GPT-5 occasional (14-day `ai_events`: qwen-plus 2,398, gemini-2.5-flash 1,748, gpt-5 33) — naming what actually runs proves the chokepoint is real rather than aspirational. (3) **Bun, Vite and shadcn added** (`bun.lock`, `bunfig.toml`, Vite 7, `components.json`). (4) **The PostHog/Sentry claim corrected.** It read "extended with PostHog … and Sentry", which implies live; neither SDK is installed (no `@sentry/*` or posthog package in `package.json`, no import anywhere in `src/`). Only the vendor-neutral facade in `src/lib/observability/` exists, so the line now says the facade is the thing and the vendors drop into it. **Deliberately EXCLUDED, do not re-add without a ruling:** ZeroEntropy (`zembed-1` is the embedding provider for the founder's local gbrain tool, NOT in Supaprod — zero hits in `src/`, `supabase/`, `scripts/`); the connector list (founder pass #3 ruling); and the delegate seam (OpenHands/Devin/swe-agent are wired in `src/lib/delegate/provider.ts`, but Investor canon forbids "we dispatch work to Cursor, Lovable, or Devin"). Paste-block wraps were also reflowed to one line per labelled item, per the standing formatting rule._

### The name, the referral, and why we do NOT file a new application (ruling, 2026-07-23)

The company-name field is locked at `Cadence`. Do not start a fresh application over it:

1. **The alumni recommendation is attached to this application.** A new application starts with zero referral history, and Badis would have to re-file against the new record, with no guarantee it links before review.
2. **This record IS the "progress since applying" story.** YC's FAQ calls progress since submission a strong signal; the update surfaces exist precisely to carry it. A new application throws away the recorded slope and the early-review timestamp.
3. Two live applications for one company in one cycle reads disorganized — the opposite of formidable.

The rename travels through the surfaces we do control: the first line of the Progress Update, the product-URL field (`supaprod.ai`), both re-recorded videos, and one parenthetical in the Team Update. Renames are routine at YC. Optional belt-and-braces: a two-line note to `apply@ycombinator.com` (YC's published address for application questions) — application id, "Cadence renamed to Supaprod, now at supaprod.ai," nothing else asked. **Badis changes nothing** — his recommendation points at this application; keeping the application keeps the referral.

### The Fall 2026 RFS check (fetched live 2026-07-23)

The RFS page has fully rotated to 13 Fall 2026 categories (The Primer, American Defense, A Cloud for Small Software, **Multiplayer AI**, Compute at Sea, Consumer AI for 1B, AI for the Aging Population, OS for the Physical World, Crypto, Data for the Real World, Proving You're Human, AI-Native Compliance, Self-Maintaining APIs). The Summer cells ("company brain," "AI operating system for companies") are no longer on the live page. Two binding consequences:

1. **Date the three circles whenever cited** — "Spring 2026" / "Summer 2026," never "the current RFS." They stay fully verifiable (the locked 9a already cites them); a partner glancing at today's page must never catch a tense mismatch.
2. **The one honest Fall echo is Multiplayer AI** (Aaron Epstein): _"working with AI is largely single-player"_ — teams should _"drop into the same live agent session to watch it work, redirect it, and hand it off."_ That is a fair description of the fleet as wired today (signed runs, traces, approval gates, human handoffs). It gets one sentence in the Progress Update, no more. No other Fall category applies to us; do not stretch. (Recorded in [`../repositioning-2026-07-22.md`](../repositioning-2026-07-22.md) §10.)

### Surface 1 — Progress Update (the crown field; it carries everything)

#### Product link

- On the form now: `https://cadence-flow-beta.lovable.app`
- **PASTE THIS:** `https://supaprod.ai`

#### Login credentials (single-line field)

- On the form now: `demo2@redcadence.app / Cadence!Demo2026 (You can als…)`
- **PASTE THIS:**

```
explore@supaprod.ai / Supaprod!Explore2026 (seeded workspace: calls are waiting on your judgment, each opens to the evidence it was made on; or sign up with invite code YC-COMPOUND-K7QR4V)
```

> ### 🚨 RE-PASTE THIS ONE LINE. 2026-08-07, and it is the only field the gate touched.
>
> **Change exactly seven words** at the end of the parenthetical:
>
> | | |
> | --- | --- |
> | **Find** | `or sign up with any email` |
> | **Replace with** | `or sign up with invite code YC-COMPOUND-K7QR4V` |
>
> **Where:** YC portal → Update your application → **Surface 1, Progress Update** → Login credentials (single-line). It is one of the five surfaces still editable, so this is a real fix rather than a note for the interview.
>
> **THE LOGIN ITSELF IS FINE AND DOES NOT CHANGE.** Signup closed on 2026-08-07 (private beta, invite code only), and the gate stands in front of account CREATION, not sign-in. `explore@supaprod.ai` is an account that already exists, so a partner who uses the credentials as filed lands exactly where they always did. Nothing about the demo workspace, the approval queue or the password moved.
>
> **What broke is the alternative path we advertised.** "Or sign up with any email" was true when it was written and stopped being true that evening. A partner who ignored the credentials and tried to create their own account would have hit the wall, and would have read it as the product being broken rather than as a beta gate. That is the whole exposure: one clause, one audience, one fix.
>
> `YC-COMPOUND-K7QR4V` is unlimited, never expires, and is revocable in one click at `/admin/invites` if it ever leaks (the redemption count survives revocation, so we can see how far it travelled). Link form, if a link is ever more useful than a code: `https://supaprod.ai/signup?invite=YC-COMPOUND-K7QR4V`. Every other audience has its own code: [`../../growth/invite-codes.md`](../../growth/invite-codes.md).
>
> **Nothing else on this application needs touching for the gate.** The product link, the how-far-along field, the team update and both videos never mention self-serve signup. Verified by reading every field on 2026-08-07, not assumed.

_(2026-07-28: the parenthetical is now count-free on purpose. The live form's short version, "(seeded workspace; or sign up with any email)", works but wastes the one line that can tell a partner what to do first; this version points at the approval queue without naming a number that can go stale. Health behind it: the seeded queues DECAY — each clone ships five pending approvals whose `expires_at` sits hours out, so by 2026-07-28 every demo workspace had rotted to 1 pending + 4 expired on its own. Re-armed 2026-07-28 across all seven Helio prefixes (undecided rows only, back to pending, 60-day runway; decision history untouched). Re-arm the same way before any interview window. explore@ stays the YC login: it is already filed, owns its own isolated clone, and its queue is live again; the four reserve logins stay untouched for other programmes. All future rehearsals and recordings happen on `harbor@`, never on `explore@`, because explore@ is now what YC holds.)_

_(Updated 2026-07-25. `explore@supaprod.ai` now owns its OWN isolated workspace (`70000000-`), provisioned by `20260725120000_investor_demo_accounts.sql`. It used to be an admin of the shared Helio Labs alongside `ember@` and the founder's own testing, which meant a partner could open a workspace someone else had been working in, with an approval queue already emptied by a rehearsal. `ember@` is retired from the showcase workspace: four named, isolated investor logins (`voyage@`, `compass@`, `meridian@`, `lantern@`) now serve that purpose per [`../../operations/demo-credentials.md`](../../operations/demo-credentials.md), and `harbor@` is the founder's rehearsal copy so practice never spends a queue anyone will be shown. The copy above points at the five pending approvals because that is the first thing a partner can act on; it is true as of the 2026-07-25 seed (`agent_approvals` pending = 5, verified live). GATE unchanged: one incognito login on supaprod.ai before pasting. Fallback if it fails: `harbor@supaprod.ai / Supaprod!Harbor2026` (identical workspace, identical story), then fix. The old `demo2@redcadence.app` fallback is DEAD as of 2026-07-25: password rotated, profile suspended. Never quote it.)_

#### "How far along are you?"

> ### ⛔ SUPERSEDED 2026-08-10 — DO NOT PASTE THE BLOCK BELOW.
>
> **The current version is at the top of this file**, in the corrections section. The block below still says *"seven weeks, 4,000+ commits"* (true on 2026-07-23, now a 20% understatement — live count is **4,872 commits, 508 migrations, eight weeks**) and it contains *"I am user zero"*, which reads to a partner as *if you are the customer, who pays you?* Kept here as the record of what was on the form, not as paste material.

- On the form now (stale): _"Early, and I will be honest about it. I started three weeks ago, solo, putting in about 35 to 40 hours a week… no users or revenue. Three weeks, alone, from idea to a working core taking shape."_
- **PASTE THIS:**

```
Cadence is now Supaprod. I renamed it after submitting, and the form will
not let me change the name; same company, live at https://supaprod.ai.

The journey so far: a decade of living this problem as a PM, a month of
nights and weekends on a prototype, then ten weeks of building it for
real, 4,900+ commits and counting. In that time it went from an early
spine to running end to end. It
is almost there, not finished; I am shaping the last stretch with users,
not assumptions. The strongest proof of progress: I am user zero.
Supaprod's roadmap runs inside Supaprod, its agents write real code and
open real pull requests behind a merge gate no agent can cross, and
every call along the way is on the record with its evidence.

Where I stand today: the beta is live, and building and listening run in
parallel. I talk to users constantly and their feedback goes straight
back in: design iterations, new roadmap items, and rework on whatever
they do not love.

Next: public launch in September.

The full company brief stays current at https://supaprod.ai/brief:
product, market, plan, and team on one page.
```

_(2026-07-28, three changes. **Launch phrasing** is now "in September", month only — founder ruling 2026-07-28: no week or date named anywhere, so a moving day inside September never contradicts the form. **The brief pointer** is the investor-spotlight the founder asked for: partners get one door to the full positioning (the deck at `/brief` carries the door-body-brain telling the locked fields cannot). `/brief` is the canonical URL per the 2026-07-24 ruling; `/investors` serves the same page for anyone who types it. Verified 2026-07-28: both return 200, the deck has zero YC mentions and no stale dates. **The self-build claim is rewritten to match the wiring** — the founder challenged "Supaprod is building Supaprod on its own" and he was right: the engine's real PRs live on the test repo, 10 of 176 missions completed, and outcome grading has run almost entirely on seeded content, while the Team Update tells YC plainly that Claude Code, Codex and Kimi write the code. The claim-never-outruns-wiring law applies to pasted copy above all. The new sentence claims exactly what is true and survives the "show me" probe: user zero, roadmap in the product, real code and real PRs behind the human merge gate, every call on the record. The same overclaim still lives in the preserved what-it-does telling below, `README.md`, and the founder-video script — apply the same honesty pass wherever that telling is reused, especially before the video re-record.)_

_[FOUNDER slot: if real user conversations or beta users exist by paste day, add one sentence with the true count. Never a padded one — the customer-evidence rule (memo §8) stays binding.]_

**📌 Preserved reference — the what-Supaprod-does telling (founder-loved, v4 of this field).** NOT for this field: the question asks progress, and this answers "what does it do." Use it for README, deck, pitch, or anywhere the product needs explaining (canonical short forms: [`../repositioning-2026-07-22.md`](../repositioning-2026-07-22.md) §3; also stored in `README.md`):

```
Supaprod is building Supaprod on its own: it plans its own roadmap, its
agents write the code behind a merge gate no agent can cross, and it
grades what actually shipped.

Code is commoditized; agents build whatever you point them at, cheaply.
The scarce thing left is knowing what to build and whether the call was
right. That is what Supaprod does: it reads everything you already know
(your user feedback, your product data, your competitors, your market) and
tells you what is worth building next. You make the call; agents build and
ship it. Think of it like Cursor, but for the whole product lifecycle end
to end, not just writing code.

Then it remembers. Every decision is recorded with its evidence and
checked against what actually happened, so when a similar call comes up,
Supaprod shows you how you decided last time and whether it worked. Your
product judgment compounds in the system instead of living in someone's
head. YC's own recent RFS essays have been circling this same company from
different angles; I read that as confirmation.

I keep building, with the beta live for users today; I talk to users
constantly, and their feedback goes straight back into the build, in a
loop.
```

#### "How long have each of you been working on this? How much of that has been full-time?"

- On the form now (stale): _"Three weeks of active building, solo, around 35 to 40 hours a week. I am fully committed to this…"_
- **PASTE THIS:**

```
Nine weeks on this build, seven days a week; the repo shows 4917
commits and 508 database migrations over that stretch, and a month of
nights and weekends on the prototype before that. Completely full-time: I
am on a break from my product role, and leaving it for good is already
decided, not contingent on this application. I am building this either
way; what the batch adds is speed, the right network, mentorship, and
honest course-correction.
```

_(The employment line states whatever is literally true the day you paste — "on a break" / "on sabbatical" / "my notice is in; last day [date]" — pick the true one, keep it one clause, no gray area. Rehearse the same words for the interview.)_

#### "What tech stack are you using…?"

- On the form now: _the old mix (Cursor-era tools; missing PostHog, Sentry, Conductor)._
- **PASTE THIS:**

```
Coding agents: Claude Code, Codex, and Kimi K3 write the code; HyperAgent runs the agentic workflows; I direct them in parallel through Conductor, with Lovable and Antigravity in the mix.
AI models: model-agnostic by design. Every AI call goes through one runtime chokepoint (budget, cache, guardrails, tracing, fallback, feature gates), so Claude, GPT, Gemini, Qwen, DeepSeek, or local models plug in. Running today: Qwen and Gemini carry the agent loop, GPT-5 where reasoning depth earns its cost, and Cohere embed-v4 for every retrieval vector.
Frontend: TanStack Start (React 19, Vite) with Tailwind and shadcn.
Backend and data: TypeScript and Supabase Postgres with row-level security; pgvector for retrieval; pg_cron schedules the autonomous engine; Bun for builds and packages.
Deployment: Cloudflare Workers.
Observability: the system captures its own telemetry by design, every agent action and AI call written to the audit trail, behind one vendor-neutral facade so PostHog and Sentry drop in without the product depending on either.
```

_(Confirm the exact Kimi model name on paste day — the live field currently says just "Kimi.")_

#### "Are people using your product?" (radio)

- On the form now: **No**.
- **KEEP: No** — unless outside users are literally in on paste day. No + "usable today" below is consistent: availability is not adoption. If beta users land first, flip to Yes and state the true count.

#### "When will you have a version people can use?"

- On the form now (stale): _"I'll put an early version in front of first beta users within roughly (6 weeks), then bring the full end-to-end platform up and running over about the next three months."_
- **PASTE THIS:**

```
Supaprod launches publicly in September; you will see it on forums like
Hacker News and Product Hunt. An early version is already live and open
for beta users today; people can get their hands on it at
https://supaprod.ai, and the last stretch is being shaped by their
feedback.
```

_(Founder ruling 2026-07-28: name the month only, never a week or a date — "(six weeks from now)" is gone so the field can never drift stale. If the launch month itself moves, update it here AND in the how-far-along close. This block also fixes two grammar slips that reached the live form: "Early version is" and "shaped by users feedback".)_

**Demo video slot on this form:** see Surface 5.

### Surface 2 — Fundraising Update

File nothing. No investment taken, not fundraising; the surface exists for changes and nothing changed. (The locked §10 answers already say exactly this.)

### Surface 3 — Team Update

#### "Who writes code, or does other technical work on your product?"

- On the form now (stale): _"…what you are seeing is a prototype I have built that way… This is also the whole point of Cadence…"_
- **PASTE THIS:**

```
Everything is built in-house by me and my AI agents: design, development,
coding, testing, and the analysis of what users do with it. I direct the
work and make every call; the agents execute, primarily Claude Code,
Codex, and Kimi K3 for code and HyperAgent for the agentic workflows. No
non-founder has touched it. And the code does not go unchecked: a separate
Claude-based reviewer, independent of the agents that build, audits the
codebase for security and verifies the work against my build register.
Building this way is the whole point of Supaprod (Cadence's new name): one
person directing a fleet of agents, with an audit trail for everything they did.
```

#### "Are you looking for a cofounder?"

- On the form now: "Solo, and moving fast. Open to a cofounder who shares the vision and energy and adds a fresh perspective I do not have. For now, solo."
- **KEEP unchanged** — it already reads secure.

### Surface 4 — Founder Video (≤1:00; replaces the 2:54 currently attached)

Re-record per [`video-scripts.md`](./video-scripts.md) Part 1 — the bullet card now opens with the rename line and the "Supaprod is building Supaprod" proof. One take, webcam, look at the lens, bullets not script. This video and the Progress Update are where the rename is said out loud.

### Surface 5 — Demo Video (≤3:00 / 100 MB per the form; replaces the 11:46)

Re-record per [`video-scripts.md`](./video-scripts.md) Part 2 (~2:10). The old video opens on a "Welcome to Cadence" login screen — the most stale artifact still attached to this application (the live product is already Supaprod-clean). Deliberate choice: the demo spends zero seconds on the rename; the founder video and the Progress Update first line carry it. Product on screen from frame one; the wedge inside 30 seconds; never cut the miss/rollback beat.

### Website changes this session surfaced (call-outs, priority order)

1. ~~Homepage counters dropped 145→83~~ — **correct behavior, not a bug.** The 07-22 seeding flagged the demo workspaces as samples; the strict public counters are the quotable ones. No data change; the copy above wears the strictness as an integrity line.
2. **Real gap the diagnosis exposed:** outcome grading has run almost entirely inside seeded workspaces; the founder's real workspaces show 0 graded outcomes. Before launch (and certainly before any interview), run the outcome loop on the real roadmap workspace so "outcomes graded" grows from real use.
3. The demo video is the last big Cadence-branded surface. Re-recording (Surface 5) retires it.
4. `src/components/plan/LoopsPanel.tsx` is the one remaining UI file mentioning "Cadence" — check whether it is user-visible and rename if so.
5. Credential rotation: `explore@supaprod.ai` becomes the public demo identity (YC form), `ember@` is retired from the showcase workspace, and the redcadence logins are disabled outright.
6. Standing memo §7 items stay open (stub connectors badged, `/updates` changelog refresh, `/proof` sample labels, `DECISION_BRAIN_SUPERSESSION` on for demo workspaces) — pre-launch work, not paste-blocking.

### Paste-day checklist (in this order)

1. Incognito: log in `explore@supaprod.ai` on supaprod.ai; land on a populated Today view. Fail → use fallback creds, fix after.
2. Numbers stay OUT of the pasted copy (founder ruling 2026-07-23) except the commit count, which appears in BOTH "how far along" and "how long" as "4,000+ commits" — settled 2026-07-28, the repo reads 4,119, so "4,000+" is literal truth in both places (the "about" hedge is retired). Counters and register numbers live on the interview card ([`interview-prep.md`](./interview-prep.md) §2); re-pull them before any interview window.
   **The weeks count ages too:** "seven weeks" appears in BOTH fields and anchors to the 2026-06-03 first commit — true through 2026-07-31, then it undercounts. On any later update, restate the true count ("eight weeks" from Aug 1, and so on), or expect a partner reading in late August to see a number three weeks stale. Every duration in pasted copy is a snapshot; re-pull it the day you paste, same as the commit count.
3. Paste the Progress Update fields; set the radio truthfully; save.
4. Paste the Team Update; save.
5. Read each pasted field aloud once (AI-cadence check); the banned-words list at the bottom of this file still governs; no em dashes in anything pasted.
6. Record and upload both videos within 48 hours; the old ones stay attached until the new ones replace them.
7. Optional: the two-line rename email to apply@ycombinator.com.
8. Log the update date here. ✅ LOGGED: text surfaces filed 2026-07-23 (see the STATUS line in the header note); videos pending. From now until the interview, keep the one-line daily delta per [`interview-prep.md`](./interview-prep.md) §5.

---

## ⭐ THE SUBMIT SHEET — the third column, NOW (2026-07-22)

> _This is the copy-paste sheet for submit day: every changed field's FINAL text, superseding the "New" blocks below where they differ. Written under the ratified triple-RFS positioning ([`../repositioning-2026-07-22.md`](../repositioning-2026-07-22.md)): door (Cursor for PMs) → body (the OS) → brain (the outcome memory, the crescendo). Numbers pulled live 2026-07-22: homepage stats 145 missions run · 81 decisions recorded · 54 outcomes graded · 4,117 AI calls (they render live on supaprod.ai, so a partner can check them); repo 3,966 commits in seven weeks · 384 migrations; register 401 specced / 366 shipped (corrected tally). Alumni-playbook rules applied: first line of every answer is the TL;DR, numbers over adjectives, competitors named with the insight, submit days early. Remaining founder-only slots are marked `[FOUNDER]`._

**§2 Personal website:** `https://supaprod.ai`

> ⤵️ _A fourth column now exists below (🔥 THE NEXT ITERATION) — where it rewrites a field, it supersedes this sheet. This third column stays for side-by-side comparison._

**§4 Who writes code:**

```
I direct all of it; AI agents write the code. I run parallel Claude Code
lanes with one model doing judgment and review over what the build models
produce. Every change goes through typecheck, build, and a review pass
before merge. Seven weeks in, this codebase has about 3,970 commits and 384
database migrations, and when I had an outside AI code auditor review the
codebase and my build register, the register held up. No non-founder has
touched it. Building this way is also the whole point of Supaprod: one
person directing a fleet of agents, with an audit trail for everything they did.
```

**§7a Company name:** `Supaprod` · **§7c Company URL:** `https://supaprod.ai`

**§7b 50 characters:** `Cursor for PMs, the whole product org.` (39 chars — KEEP; the door, per the telling order)

**§7e Product link:**

```
https://supaprod.ai

Demo login: explore@supaprod.ai / Supaprod!Explore2026 (or sign up; you get a
seeded workspace with sample products to explore.)
```

_(Checklist: verify this exact login works on supaprod.ai in incognito before submit; the legacy credential domain is intentional.)_

**§7f What is your company going to make:**

```
Supaprod is where a product org runs when AI agents do the work. The
shortest way to say it: Cursor for product managers, but one system for the
whole lifecycle, not a copilot bolted onto one step. You connect the tools
where your product signals live and the agents take it from there: they
read the signals, cluster them into opportunities, argue against the weak
bets before you commit, write the spec with the evidence attached, plan the
work, and hand builds to coding agents. You approve the calls that matter.

The part that makes it a company: every agent action lands in the audit trail, and
every decision gets checked later against what actually happened. Supaprod
answers "why did we decide this" in seconds, learns which calls were right,
and re-ranks what to build next from its own track record. Agents earn
autonomy the way a new hire earns trust, and anything they produce rolls
back with one key.

AI made building cheap. What a company runs on now is decisions and whether
they were right. That is the layer I own. Agents do the work. You answer
for it. Supaprod is how you answer.
```

**§8a How far along:**

```
The product works end to end today, and the numbers in this answer render
live on the homepage. In ten weeks, solo: an autonomous engine that
advances product missions every minute (live right now: 145 missions run,
81 decisions recorded, 54 outcomes graded, 4,117 AI calls through one
audited path); agents that open real pull requests behind a merge gate no
agent can cross; permissions agents earn from their track record; one-key
rollback on anything they produce; and decisions that get re-checked
against outcomes, which then re-rank what to build next.

I track the build in a public-style register: 401 features specced, 366
shipped. An outside AI code auditor reviewed the codebase against that
register and it held.

Everything until now was building the machine. Now I am putting people in
it: the beta opens this week, and the public launch follows in weeks, not
months.
```

**§8b How long working on this:**

```
Seven weeks on this build at roughly sixteen hours a day, seven days a
week; the repo shows 3,966 commits over that stretch. Before that, about a
month of nights and weekends on the prototype that became Supaprod. I am
going full-time on Supaprod regardless of anything. That decision is made.
The batch changes where I sit, not whether I am in.
```

_[Intellect one-liner: DECIDED 2026-07-23 — locked in the §8b note below; rehearse verbatim.]_

**§8e Are people using your product:** _(submit whichever is literally true that day)_

```
Not yet outside my own daily use. Supaprod runs its own roadmap, and its
agents built most of it. The beta opens this week from a named prospect
list, and anyone can walk the real product today with the demo login above.
```

**§8h Same idea as a previous batch:**

```
Same idea, one batch later, roughly ten times the product. Since the
rollover: the product got its name, domain, and public site (supaprod.ai);
the autonomous engine went live and has now run 145 missions and recorded
81 decisions; agents open real pull requests behind human gates; recorded
outcomes now re-rank what to build next; an outside AI code audit of the
build register held up; and the public launch is weeks away. The pace is
the pitch.
```

**§9a Why this idea / domain expertise / how do you know people need it:**

```
I have spent close to a decade in product: communication systems at ISRO,
then product roles at Infineon and Bosch, and most recently the AI platform
that 200+ financial institutions use to build their own AI products. In
every one of those jobs the real work was being the glue across a dozen
tools, and re-answering "why did we decide this" from memory.

Supaprod started as a dashboard I built to stop drowning in that. Then I
noticed YC kept describing the company I was already building, three
times: a "Cursor for product managers" (Spring 2026 RFS), an "AI operating
system for companies," and a "company brain" (both Summer 2026 RFS). My
insight is that those are one product. You cannot be the company brain
without owning the loop that generates the outcomes, and you cannot run
that loop without being the operating system. The product org is where the
loop is tightest, so that is where I started.

How I know people need it: the top-voted thread in the biggest PM community
is literally "So why did we decide on X? Cue hours of finding that Slack
conversation from months ago" (480 points), and that community's biggest
post this year is a senior PM hand-building exactly this out of Claude
Code, MCP connectors, and a memory system. And I need it myself, every
single day.
```

**§9b Competitors / what do you understand that they don't:**

```
Nobody runs the whole loop; my real competitor is the stitched stack:
Linear or Jira for tracking, Notion for docs, ChatPRD for specs (100k+
PMs), a coding agent for the build, and the PM as the glue. The space is
moving fast: Samepage raised $4.85M in June to surface signals for product
leaders, Brief captures decision context for agents, Productboard shipped
Spark, and Notion launched Ship OS this month claiming "customer feedback
to a merged PR."

What I understand that they don't: every one of them stops one step short.
Samepage surfaces, ChatPRD and Spark draft, Brief remembers context, Linear
and Ship OS dispatch. Nobody checks the shipped outcome against the
decision and feeds it back, and that last step is the only one that
compounds. And the part of it a competitor cannot rebuild is what the team
believed would happen before they found out. Everything else about a
decision survives in chat logs and call recordings, and an agent can
reconstruct it in an afternoon. A forecast leaves no trace unless something
captured it at the moment of the call.

I also deliberately do not build the code generator. Cursor and Devin are
in a capital knife fight there, and the models keep absorbing that layer.
Supaprod decides what is worth building, dispatches to whichever generator
wins, and keeps the evidence. If a frontier lab ships a "PM agent," it
ships capability. The accountability layer across your tools is the part
they structurally will not own.
```

**Everything else:** §3a/3b/3d, §5, §7g, §8c, §8g, §8i, §9c, §9d, §10, §11a/11b, §12 — the "New" blocks below stand as final (name updated to Supaprod where noted). `[FOUNDER]` slots remaining (updated 2026-07-23): ~~IIM Bangalore venture line (§3c)~~ and ~~Intellect one-liner (§8b)~~ both DONE; still open — messaging Badis before naming Asendia (§11a), and both video re-records (§6, §7d).

**The NOW pre-submit checklist (continuous, in priority order):**

1. Verify `explore@supaprod.ai` login on `https://supaprod.ai` in incognito. Its workspace (`70000000-`) is already seeded and funded with 5000 credits, verified live 2026-07-25.
2. Re-record the founder video (≤1:00, bullet card) and demo video (~2:15) per [`video-scripts.md`](./video-scripts.md).
3. Fill the three `[FOUNDER]` text slots; message Badis.
4. On submit day: re-read the homepage stats and sync the numbers in §8a/§8h/§4 to what the site shows that hour (they render live).
5. Read every answer aloud; the retell test with one outside reader; the neediness scan.
6. Attach the chosen Claude Code session transcript (§8d).
7. Submit early — July 25 or 26, not the 27th.

---

## 🔥 THE NEXT ITERATION — fourth column (2026-07-22, founder-energy pass, panel-revised)

> _The FOURTH column: where a field appears here, this is the final submit text, superseding the third-column sheet above. Written under the founder's rulings of 2026-07-22 (humble AND strong, zero bragging; OS opens 7f, Cursor is the handle, the brain closes; the own-engine story; RFS as quiet confirmation; no point-count citations; under-five-minute read) and revised against a three-partner adversarial panel (clarity skimmer: SHORTLIST; skeptic: BORDERLINE-to-INTERVIEW with fixes, all applied; verifier: every claim checked against the live site, git, and code — its blocker and wording fixes applied). Fields not rewritten here carry forward from the sheet above._

### 7b — 50 characters

```
Cursor for PMs, but for the whole product org.
```

### 7e — Product link

```
https://supaprod.ai

Demo login: explore@supaprod.ai / Supaprod!Explore2026. You log in as a
product manager mid-week. Agents worked overnight; five calls are now
waiting on your judgment, and each one opens to the evidence it was made
on and what happened the last time you bet this way. Or sign up with
email; you are in a working workspace in about a minute.
```

_(Provisioned in-database by migration `20260722211500_demo_accounts_supaprod_domain.sql` — `explore@supaprod.ai` for YC plus the codename twin `ember@supaprod.ai` / `Supaprod!Ember2026` held back for later investor use; both seeded, both with Helio Labs access, onboarding pre-completed. The `redcadence.app` logins are RETIRED as of 2026-07-25: passwords rotated, profiles suspended, replaced by `harbor@supaprod.ai` for internal use. VERIFIER FLAG: the login fails on production until the migration ships and Lovable deploys — checklist item 1 gates submission on a passing incognito test.)_

### 7f — "What is your company going to make?"

```
Supaprod is the operating system a product team runs on when AI agents do
the work. It reads the signals from your users and your market and tells
you what is worth building. It argues with you before you commit. Then it
writes the spec, builds it, ships it behind gates you control, and checks
what actually happened. The closest familiar thing is Cursor, but for the
whole product lifecycle instead of the code editor.

The build lane is built in: agents deliver spec-shaped pull requests
behind a merge gate, with an audit trail on every action and one-key rollback,
plugging in whichever model is best at each job in the lifecycle:
sensing, deciding, designing, building, researching, learning. Your team
runs no separate coding tool for it.

What makes it compound: every decision is recorded with its evidence, and
every outcome is checked and remembered. That record becomes the brain of
your product org. It answers "why did we decide this" in seconds, and it
gets sharper about your next call with every outcome it records.

Agents do the work. You answer for it. Supaprod is how you answer.
```

### 8a — "How far along are you?"

```
The product works end to end today, and the proof is that it runs its own
development: Supaprod plans, builds, and ships Supaprod. The numbers on
the homepage render live from that run: 145 missions run end to end
(multi-step agent jobs, decision to shipped change), 81 decisions
recorded with the evidence behind them, 54 outcomes graded. Those are my numbers as its
first user, not customer traction, and anyone can watch them move.

Underneath: agents open real pull requests behind a merge gate no agent
can cross, autonomy is earned per agent from track record, and anything
an agent produces rolls back with one keystroke. I track every feature in
a register: 401 specced, 362 shipped. I had an outside AI auditor check
that register against the code in July, and it held up.

The doors are open: self-serve signup is live, the demo login is above,
and I am recruiting the first beta cohort now from a named list of 25
PMs and founders. The public launch follows in weeks, not months.
```

### 8b — "How long have you been working on this?"

```
Ten weeks on this build, seven days a week; the repo shows more than
4,900 commits over that stretch, and a month of nights and weekends on the
prototype before that. Full-time in every sense but the paperwork: I
built it alongside a product role that is winding down, and quitting is
decided, not contingent on this application. I spent close to a decade
doing product work inside other companies, and this is the company I
could not leave unbuilt. The batch changes my speed and my zip code, not
my direction.
```

_(Resolved 2026-07-22 with the founder: employed while winding down, quitting decided and unconditional. The form text above is the exact truth stated with a decided posture. 3c drops the "my current employer" flag (see below). INTERVIEW CARD, rehearse verbatim: "I'm employed on paper while I wind it down; Supaprod has had all of me for seven weeks, and I'm leaving regardless of your decision." Never say "on a break," never make the resignation conditional on acceptance.)_

### 3c — one-line fix to the carried-forward answer

The 3c bullet "At Intellect (my current employer) I led product on the AI platform..." becomes:

```
- At Intellect, where I lead product on the AI platform that 200+
  financial institutions across 70+ countries use to build their own AI
  products. I didn't write that code; I shipped the product.
```

### 8e — "Are people using your product?"

```
Not yet, outside my own daily use. The doors just opened: self-serve
signup is live, and I am recruiting the first beta cohort now from a
named list of 25 PMs and founders. Anyone can walk the product today
with the demo login above or a one-minute signup.
```

### 8h — "Did anything change since your previous application?"

```
Same idea, one batch later: ten weeks of building, eight of them since
that submission rolled over. In those five weeks the product got its
name and public site, supaprod.ai. The engine went from an early spine
to running the whole loop on its own, nights included: 145 missions, 81
recorded decisions, real pull requests behind human gates. Recorded
outcomes now re-rank what to build next. This is what one person
directing a fleet of agents ships in five weeks.
```

### 9a — "Why did you pick this idea? Do you have domain expertise? How do you know people need this?"

```
I lived this problem for close to a decade before building the fix.
Communication systems at ISRO, then product at Infineon and Bosch, then
an AI platform that 200+ financial institutions build on. Different
industries, same job underneath: carry context across a dozen tools, and
answer "why did we decide this" from memory, months later, with the
evidence long buried.

Supaprod began as a system I built to run my own work. Two things told me
the itch was not just mine. Product people at companies like OpenAI and
DoorDash now hand-build their own versions out of Claude Code, Codex,
connectors, and memory files; one PM described spending 1,500 hours on
her setup. People do not do that for a mild annoyance. And YC's own
recent requests for startups describe the same gap from three angles: a
Cursor for product managers, an AI operating system for companies, a
company brain. I read those as confirmation I was standing in the right
place.

I remain the most demanding user I have. I run my company on it every
day.
```

### 9b — "Who are your competitors? What do you understand that they don't?"

```
Nobody runs the whole loop; my real competitor is the stitched stack:
Linear or Jira for tracking, Notion for docs, ChatPRD for specs, a coding
agent for the build, and the product manager as the glue. The space is
moving fast. Samepage raised a $4.85M seed and launched in June to
surface signals for product leaders. Brief captures decision context for
agents. Productboard shipped Spark. Notion launched Ship OS this month,
which promises customer feedback to a merged pull request.

What I understand that they do not: every one of them stops one step
short. They surface, draft, remember, or dispatch. None of them checks
the shipped outcome against the decision that caused it and feeds that
back, and that last step is the only one that compounds. It cannot be
rebuilt from chat logs afterward is what the team believed would happen
before they found out. I built the whole system around it.

On the build, I own the harness, not the model: code generation is a
commodity you call through an API, so I built the lane once, gates,
the audit trail, rollback, the outcome feed, and plug the best model into it.
My users never buy a second coding tool, and when a better model ships,
Supaprod gets better the same day.
```

### 9c — "How do or will you make money? How much could you make?"

```
Free tier runs the full loop on a small credit budget; paid plans are a
workspace subscription plus usage credits for agent runs, so revenue
grows with how much work the agents do, not with headcount. Land: solo
founders and PMs on small teams, who feel this hardest and can start
without procurement. Expand: teams and enterprises, where the audit
trail is the thing they actually budget for. That budget already exists;
today it is split across Linear, Notion, a spec tool, a coding agent,
and status meetings.

How big: every software company is heading toward small pods where one
PM directs a fleet of agents. Supaprod is the operating system that pod
runs on and the system of record for its decisions, and systems of
record are the biggest outcomes in software. Pricing gets its first real
test in beta this month.
```

### 11a — "What convinced you to apply to Y Combinator? Did someone encourage you to apply?"

```
Two reasons and one honest nudge. The mission needs speed: every company
is about to run on fleets of agents, and someone has to build the layer
where a human still answers for the work. That layer gets decided in the
next two years, not the next ten, and YC compresses exactly that kind of
time. Second, the bar: this is the hardest room my company can be tested
in, and I want it tested there. The nudge: I watched a friend's company
go through a recent batch up close, from application to Demo Day, and
the rate they improved at settled it for me. I am building Supaprod
either way. I would rather build it at YC speed.
```

### The fourth-column pre-submit checklist (supersedes the sheet's checklist)

1. **GATE:** migration `20260722211500` is committed and pushed this session; after the next Lovable deploy, test `explore@` AND `ember@` in incognito on supaprod.ai — the verifier confirmed the login FAILS live until the migration applies. Do not submit until both logins pass and land on a populated Today view.
2. One fresh-email incognito signup: confirm it completes, and whether the new workspace arrives seeded (`SAMPLE_WORKSPACE_ENABLED` in Lovable env). If unseeded, flip the flag or trim the seeded claim in 7e.
3. Check demo-account credit balances and workspace state before submit and again before any interview window; re-run the reseed if a visitor left a mess.
4. ~~The employment fact~~ RESOLVED 2026-07-22: 8b now carries the true decided-posture version and 3c drops the "current employer" flag. Rehearse the interview card in the 8b note. If a resignation date lands before submit, upgrade 8b to the dated version ("my notice is in; last day [date]").
5. ~~The IIM venture line (3c) [FILL] bracket~~ RESOLVED 2026-07-23 (bubble-tea venture filled in). Still do: confirm the previous-submission date in the YC portal (anchors 8h's "five weeks"), and ask Badis to file the recommendation through YC's official recommender flow.
6. Submit-day sync: homepage numbers (145/81/54 drift daily), commit count (3,968 as of the panel check), register count (362 strict today per the fixed scripts/dashboard-tally.sh; quote only what the script reproduces).
7. Read every answer aloud; retell test with one outside reader; neediness scan; bragging scan. Submit July 24 or 25. Keep the old videos attached until the new ones replace them; record and swap both within 48 hours of submitting.
8. Interview prep cards to load now: (a) the 8c-vs-7f reconciliation, one breath: "I build Supaprod with commercial IDE tools because I am a solo founder in an editor; my users' org runs Supaprod's own build lane — spec-shaped gated pull requests with receipts and rollback"; (b) the 1,500-hours source (DoorDash PM, April 2026 podcast) ready to cite; (c) one concrete outcome-grading story with the ledger entry on screen; (d) a real beta number ready for "how did the beta go" by interview time.

---

## 1. Founders — Role

| Field | Previous | New |
| --- | --- | --- |
| Title | CEO | **KEEP** |
| Equity % | 100 | **KEEP** |
| At least 10% equity | yes | **KEEP** |
| Technical founder | no | **KEEP** (honest; the "who writes code" answer carries this — see §4) |
| Currently in school | no | **KEEP** |
| Commit exclusively if accepted | yes | **KEEP** |

## 2. Founders — Background / Social

| Field | Previous | New |
| --- | --- | --- |
| LinkedIn / Education / Work | filled | **KEEP** (make sure LinkedIn is current before submit — partners open it) |
| Personal website | github.com/RohitGajaraj/Project-Cadence-v2 | **CHANGE** → `https://cadence-flow-beta.lovable.app` (the live product beats a stale repo; the v2 repo stays linked in "things you've built" as history) |
| X URL | twitter.com/rohit_gajaraj | **KEEP** |
| GitHub URL | github.com/RohitGajaraj | **KEEP** |

## 3. Founders — Accomplishments

### 3a. "Please tell us about a time you most successfully hacked some (non-computer) system to your advantage."

**Previous:** the ISRO story — did the product work before having the title, used the proof to talk his way into the role; "build the evidence first, then ask."

**New: KEEP, one word-level trim.** It is specific, true, and the pattern (evidence first, then ask) is literally what this application does. Final text:

```
I wanted to move from hardware and communication engineering at ISRO into product,
but I didn't have the title or the obvious path. So instead of applying and waiting,
I started doing the work before anyone gave me permission, and used that proof to
talk my way into the role. I've repeated the same move every time I switched
industries since: build the evidence first, then ask.
```

### 3b. "The most impressive thing other than this startup that you have built or achieved." — WAS UNANSWERED. Must fill.

PG calls this the most important question on the application. One concrete thing, not a list.

```
At 21 I was building communication systems at ISRO, India's space agency, for
missions where a mistake is unrecoverable. The systems I worked on flew.
```

### 3c. "Tell us about things you've built before. Include URLs if possible." — WAS UNANSWERED. Must fill.

```
- Supaprod itself is the third build of this idea. The first version was a side
  project I hacked together on Lovable to run my own work:
  https://github.com/RohitGajaraj/Project-Cadence-v2. It kept growing until I
  rebuilt it properly as what you see today.
- At Intellect (my current employer) I led product on the AI platform that 200+
  financial institutions across 70+ countries use to build their own AI products.
  I didn't write that code; I shipped the product.
- Earlier, at IIM Bangalore, I founded a food-and-beverage venture: one of the
  first attempts to bring bubble tea to the Indian market. I took it from
  ideation through recipe formulation, user testing, and competitive analysis;
  it was selected into IIM Bangalore's entrepreneurship cell and recognized by a
  Government of India startup initiative. I set it down to go build product
  full-time, which is the depth I'm bringing back to founding now.
```

### 3d. "List any competitions/awards you have won, or papers you've published."

**Previous:** MBA from TUM ("one of Europe's top-ranked programs"), NSRCEL incubation, Startup India recognition.

**New: KEEP, drop the ranking adjective** (adjectives doing evidence's job):

```
MBA from TUM School of Management, where my thesis explored the creator and
ownership economy in Web3. An earlier venture of mine was incubated at IIM
Bangalore's NSRCEL and recognized under the Government of India's Startup India
initiative.
```

## 4. "Who writes code, or does other technical work on your product? Was any of it done by a non-founder?"

**Previous:** good honest answer (AI tools write, I steer, no non-founder touched it).

**New — same story, now with the evidence attached.** YC said out loud this cycle that they evaluate exactly this: Garry Tan — "you can upload a transcript of your Codex or Claude Code making a feature… You can tell a lot about whether someone can build just from how they prompt the agents." Harj Taggar: "The Parker Conrad of today is just in Claude Code."

```
I direct all of it; AI agents write the code. I run parallel Claude Code lanes
with one model doing judgment and review over what the build models produce.
Every change goes through typecheck, build, and a review pass before merge.
Seven weeks in this codebase that has produced about [3,400] commits and [320]
database migrations, and when I had an outside AI code auditor review the
codebase and my build register, the register held up. No non-founder has
touched it. Building this way is also the whole point of Supaprod: one person
directing a fleet of agents, with an audit trail for everything they did.
```

_[Update the commit/migration counts on submit day: `git rev-list --count HEAD` and `ls supabase/migrations | wc -l`.]_

## 5. "Are you looking for a cofounder?"

**Previous:** "Solo, and moving fast. Open to a cofounder who shares the vision and energy and adds a fresh perspective I do not have. For now, solo."

**New: KEEP.** It is honest and reads secure. Do not add more words.

## 6. Founder Video

**Previous:** 2:54. **Over the limit — YC's rule is 1 minute,** "nothing except the founders talking," and "do not recite a written script: use bullet points instead." Re-record. Bullet card + direction: [`video-scripts.md`](./video-scripts.md) Part 1. One take, webcam, look at the lens, energy over polish. YC: "Statistically we're much more likely to interview people who submit a video."

## 7. Company

### 7a. Company name

`Supaprod` — **CHANGE** (rename executed 2026-07-17; was `Cadence`).

### 7b. "Describe what your company does in 50 characters or less."

**Previous:** `Cursor for PMs, the whole product org.` (39 chars)

**New (recommended — KEEP the previous):**

```
Cursor for PMs, the whole product org.
```

Why: it does both jobs in one line — the instant anchor a tired reader gets in a second (the accepted pattern: Dendron's "Superhuman for note taking") plus the scope escalation ("the whole product org") that signals this is bigger than a PM copilot. Anchor-only fallback if ever needed: `Cursor for product managers.` (28 chars).

### 7c. Company URL

**Previous:** unanswered. **New:** `https://cadence-flow-beta.lovable.app` _(swap to the custom domain if it lands before July 27)._

### 7d. Demo video

**Previous:** 11:46. **Far too long — partners watch 60–90 seconds.** Re-record at ~2:15 max using the shot-by-shot script in [`video-scripts.md`](./video-scripts.md) Part 2: real screen recording, your voice, product doing something impressive inside the first 30 seconds, "dense, factual, fast," one take, no editing polish.

### 7e. "Please provide a link to the product, if any."

```
https://cadence-flow-beta.lovable.app

Demo login: explore@supaprod.ai / Supaprod!Explore2026 (or sign up with your own
account; you get a seeded workspace with two sample products to explore.)
```

_[Before submit: log in with these exact credentials yourself, re-seed the demo workspace, and check the credit balance — see checklist.]_

### 7f. "What is your company going to make? Please describe your product and what it does or will do."

**Previous:** solid but long; some claims ahead of wiring; buries the evidence idea.

**New (~185 words — the anchor opens it, the real scope closes it):**

```
Supaprod is where a product org runs when AI agents do the work. The shortest
way to say it: Cursor for product managers, but it's one system for the whole
lifecycle, not a copilot bolted onto one step. You connect the tools where
your product signals live and the agents take it from there: they read the
signals, cluster them into opportunities, argue against the weak bets before
you commit, write the spec with the evidence attached, plan the work, and
hand builds to coding agents. You approve the calls that matter.

The part that makes it a company: every agent action lands in the audit trail, and
every decision gets checked later against what actually happened. Supaprod
answers "why did we decide this" in seconds, learns which calls were right,
and gets smarter about your product with every outcome it records. Agents
earn autonomy from their track record, the way a new hire earns trust, and
anything they produce rolls back with one key.

AI made building cheap. What a company runs on now is decisions and whether
they were right. That's the layer I own. Agents do the work. You answer for
it. Supaprod is how you answer.
```

### 7g. "Where do you live now, and where would the company be based after YC?" + location explanation

**Previous:** "Bangalore, India / San Francisco, USA" + relocation paragraph. **KEEP both** (trim "access to capital" if you want it one line shorter; it reads fine as is).

## 8. Progress

### 8a. "How far along are you?"

**Previous:** honest but stale ("started three weeks ago… core pieces coming together in early form").

**New — the field where the rollover pays.** Everything below is true today; refresh numbers on submit day:

```
The product works end to end today; the login above is live. In ten weeks,
solo: an engine that advances product missions on its own every minute (live
database right now: [133] missions run, [129] agent runs, [72] decisions
recorded); agents that open real pull requests behind a merge gate no agent can
cross; permissions that agents earn from their track record; one-key rollback
on anything they produce; and decisions that get re-checked against outcomes,
which then re-rank what to build next.

I track the build in a public-style register: [385] features specced, [293]
shipped. I had an outside AI code auditor review the codebase against that
register, and it held.

Everything until now was building the machine. Now I'm putting people in it:
the beta is opening with the PMs and founders from my discovery calls, and
the public launch follows in weeks, not months.
```

_(Note the register: zero users is stated once, in 8e, where the form asks — not volunteered here as "the gap." Law 2.)_

### 8b. "How long have each of you been working on this? How much of that has been full-time?"

**Previous:** "Three weeks… around 35 to 40 hours a week."

**New:**

```
Seventy days on this build at roughly sixteen hours a day, seven days a week;
the repo shows more than 4,900 commits over that stretch. Before that, about a
month of nights and weekends on the prototype that became Supaprod. I'm going
full-time on Supaprod regardless of anything. That decision is made. The batch
changes where I sit, not whether I'm in.
```

_[Interview one-liner, locked 2026-07-23 — rehearse verbatim: "I'm a Senior AI Product Manager at Intellect, building an AI platform for the banking and finance domain (Jun 2023 – present). Supaprod gets sixteen hours a day; I'm serving out my transition and going full-time, resignation planned." Matches LinkedIn. If a resignation date lands before the interview, add it ("last day [date]"). Do not improvise this one.]_

### 8c. "What tech stack are you using… Include AI models and AI coding tools you use."

> **⛔ SUPERSEDED — do not paste from here.** The canonical, current tech-stack answer is the paste block under ["What tech stack are you using…?"](#what-tech-stack-are-you-using) near the top of this sheet (founder-finalized in his own six-label structure at pass #6, then updated by the 2026-08-03 tech-stack pass). This 2026-07-23 version is kept only as history: it predates the six-label structure, still names Cursor, and carries the "users can bring their own keys" clause the founder ruled OUT (the question asks what WE use, not what we offer customers). One answer, one place.

_Archive — the 2026-07-23 version, preserved verbatim:_

```
Built almost entirely with Claude Code, plus Lovable, Cursor, and Antigravity.
Frontend: TanStack Start (React 19, Vite), Tailwind, shadcn. Data: Supabase
Postgres with row-level security, pgvector, pg_cron driving the autonomous
engine. Deployed on Cloudflare Workers. Model-agnostic by design: every AI call
goes through one runtime chokepoint (budget, cache, guardrails, tracing,
fallback), so Claude, GPT, Gemini, DeepSeek, or local models plug in, and users
can bring their own keys.
```

### 8d. "Optional: attach a coding agent session you're particularly proud of."

**KEEP the habit, upgrade the pick.** YC now reads these as evidence a founder can build (Tan/Taggar quotes in §4). Choose a transcript that shows judgment, not just prompting: one where you scope a feature, catch an agent's wrong turn, and drive it to a merged PR. _[Pick the session and export it fresh before submit.]_

### 8e. "Are people using your product?"

**Previous:** "No."

**New — TRUE as of 2026-07-23 (no outside users yet; the dogfooding is real):**

```
Not outside users yet — I'm opening the first access now. The daily user is me:
I run Supaprod's own roadmap inside Supaprod, and its agents built most of it.
The live homepage numbers — 145 missions, 81 decisions, 54 outcomes — are that
real usage, not a demo, and a partner can watch them move. Anyone can try it
today through the demo login above; self-serve signup is already on.
```

_[If real beta users land before July 26, lead with the number instead: "Yes,
since [date]: [N] users from [M] discovery calls," then keep the dogfooding
line. Do not invent a discovery-call count — quote only what actually happened.]_

_Archive — the 2026-07-10 two-variant version (column ②, preserved verbatim from the founder's saved copy; superseded by the text above):_

Variant A (beta users exist):

```
Yes, since [date]: [N] beta users from [M] discovery calls. Too early for
patterns; the first thing they reach for is asking "why did we decide X" and
getting the decision back with what we believed at the time. I use it daily myself to run Supaprod's own roadmap.
```

Variant B (not yet):

```
The first beta users are getting access now, from the [N] discovery
conversations I've run with PMs and founders this month. Until they're in,
the daily user is me: Supaprod runs its own roadmap, and its agents built
most of it.
```

### 8f. "When will you have a version people can use?"

**Previous:** "roughly 6 weeks… full platform over about three months."

**New:**

```
It's usable now: the link and demo login above. Self-serve signup is already
on; the public launch is weeks away, not months.
```

### 8g. "Do you have revenue?"

`No.` — **KEEP.**

### 8h. "If you are applying with the same idea as a previous batch, did anything change?"

**Previous:** "First time applying with Cadence."

**New — this is now the single most valuable field on the form.** YC's FAQ: progress since the last application is "a strong signal."

```
Same idea, one batch later. I submitted this application late in the previous
cycle and it rolled forward. Since then the product went from an early spine to
working end to end: the autonomous engine is live ([133] missions, [129] agent
runs), agents open real pull requests behind human gates, every decision now
gets an outcome check that re-ranks what to build next, an outside AI code
audit of the build register held up, beta is opening, and the public launch
is weeks away. Roughly ten times the product in five weeks. That pace is the
pitch.
```

### 8i. Incubator / accelerator

**Previous:** "No. Cadence has not been part of any program. This would be the first." — **KEEP the substance, update the name:** "No. Supaprod has not been part of any program. This would be the first."

## 9. Idea

### 9a. "Why did you pick this idea? Do you have domain expertise? How do you know people need what you're making?"

**Previous:** dashboard origin + Perplexity/Comet + RFS mention + decade in product. Good bones; re-balanced so the decade comes first and YC's RFS is confirmation, not origin:

```
I've spent close to a decade in product: communication systems at ISRO, then
product roles at Infineon and Bosch, and most recently the AI platform that
200+ financial institutions use to build their own AI products. In every one of
those jobs the real work was being the glue across a dozen tools and a dozen
stakeholders, and re-answering "why did we decide this" from memory.

Supaprod started as a dashboard I built for myself to stop drowning in that. It
kept growing. Then I noticed YC kept describing the same gap from the outside:
an RFS essay asked for a "Cursor for product managers," and the current RFS
asks for a "Company Brain" and an "AI operating system for companies." That
told me the itch I was scratching wasn't just mine.

How I know people need it: I've spent the last month talking to PMs and
founders and reading how they hand-roll this today: [N] discovery
conversations so far. The most upvoted thread I found in a PM community was
literally someone asking how to answer "why did we decide X." And I need it
myself, every single day.
```

_[The `[N]` is the one number that most upgrades this application. See checklist item 1.]_

### 9b. "Who are your competitors? What do you understand about your business that they don't?"

**Previous:** honest stitched-stack answer + frontier-labs paragraph. **New — keeps that shape, now names the real neighbors (including YC's own portfolio) and states the structural difference in one breath:**

```
Nobody runs the whole loop today; my real competitor is the stitched stack:
Linear or Jira for tracking, Notion for docs, ChatPRD for specs (100k+ PMs,
genuinely impressive), a coding agent for the build, and the PM as the glue.
The space is moving toward me: Linear now lets teams hand issues to Cursor and
Devin, and YC has funded planning layers for coding agents from the engineering
side (Scott AI, Fission). All of them make doing the work faster.

What I understand that they don't: none of them records whether the call was
right. Decisions, the evidence behind them, what shipped, and what happened
after live in five different tools, so nothing learns. That connected record is
the product. It can't be bolted onto a tracker, because it needs the whole loop
under one roof, and it can't be copied quickly, because it only accumulates
with time.

I also deliberately don't build the code generator. Cursor and Devin are in a
capital knife fight there, and the models keep absorbing that layer. Supaprod
decides what's worth building, dispatches to whichever generator wins, and
keeps the evidence. And if a frontier lab ships a "PM agent," it ships
capability; the accountability layer across your tools is the part they
structurally won't own.
```

### 9c. "How do or will you make money? How much could you make?"

**Previous:** per-seat plus usage; land solo founders, expand to enterprise; pricing unvalidated.

**New — matches how the product actually charges today (credits), keeps the honesty:**

```
Free tier runs the full loop on a small credit budget; paid plans are a
workspace subscription plus usage credits for agent runs, so revenue grows
with how much work the agents do, not with headcount. Land: solo founders and
PMs on small teams, who feel this hardest and can start without procurement.
Expand: teams and enterprises, where the audit trail is the thing they
actually budget for. The budget already exists. Today it's split across
Linear, Notion, a spec tool, a coding agent, and status meetings.

How big: every company that builds software is becoming a product org run
this way: the product-staff seat. One PM directing 20 agents across a 4–6 person
pod (Mosseri, 2026). The math: 1.2 humans + 20 agents = 10-human output (Lemkin,
2026). Supaprod is the console for the product-staff seat — the operating system
that org runs on, and the system of record for its decisions. Systems of record
are the biggest outcomes in software. Pricing gets its first real test in beta
this month.
```

> ## ⚠️ 9c CARRIES AN UNSUPPORTED CLAIM — PASTE THE CORRECTED PARAGRAPH BELOW
>
> _Lane 0 quote audit, 2026-08-10, against the paid Lenny archive (679 documents). The founder confirmed the portal field is editable._
>
> **What is wrong with the second paragraph above, in three parts:**
>
> 1. **Mosseri never says "agents."** Verified verbatim, his pods are *"four to six engineers"* plus *"one, we call product staff"* plus whatever specialist the work needs — *"a much smaller core, which is more on the order of six or seven."* He says "agents" **once** in the whole episode and never "fleet." He also partly credits team size, not agent leverage: *"another part of it is just the small teams, I think, often are just more effective."*
> 2. **The Lemkin arithmetic is uncorroborated and from the wrong function.** It describes a **sales/GTM** team, not a product pod. Worse, the archive's transcript filed under that episode's exact title and date is a **different conversation entirely** — "1.2 humans," "20 agents" and "Amelia" appear **nowhere in all 679 documents**.
> 3. **The two were spliced.** "One PM directing 20 agents across a 4–6 person pod" is a sentence **neither source states**, presented with both their names attached. This is the one claim in the application a partner is most likely to pull on, and it would not survive the pull.
>
> **Paste this in place of the second paragraph. Every number is verified verbatim, and the argument gets stronger — the mechanism becomes accountability concentrating into one seat with no system of record, which needs no borrowed arithmetic:**
>
> ```
> How big: every company that builds software is converging on one shape.
> Instagram replaced its ~13-person canonical team with pods of four to six
> engineers led by a new role it calls product staff — a PM who absorbs design,
> data and research (Mosseri, July 2026). That seat is our buyer. One person is
> now accountable for calls that used to be split across five specialists, and
> that seat has no system of record. Supaprod is the operating system it runs
> on. Systems of record are the biggest outcomes in software. Pricing gets its
> first real test in beta this month.
> ```
>
> Full audit and the verification method: [`../../research/lennys-quote-verification.md`](../../research/lennys-quote-verification.md). Interview fallback if a partner quotes the old text back: §4 of [`interview-prep.md`](./interview-prep.md).

### 9d. "If you had any other ideas you considered applying with, please list them."

**Previous:** "This is the one. The closest was the earlier dashboard version that became Cadence. I am building what I kept wishing existed." — **KEEP the substance, update the name:** "This is the one. The closest was the earlier dashboard version that became Supaprod. I am building what I kept wishing existed."

## 10. Equity

| Field | Previous | New |
| --- | --- | --- |
| Legal entity formed | no | **KEEP** _(if you incorporate before July 27, update)_ |
| Planned ownership | Rohit 100%, meaningful equity for right cofounder, option pool | **KEEP** |
| Investment taken | no | **KEEP** |
| Currently fundraising | no | **KEEP** |

## 11. Curious

### 11a. "What convinced you to apply to Y Combinator? Did someone encourage you to apply?"

**Previous:** "Followed YC for a long time… I have friends in a current batch and have watched their journey closely. I have not been to a YC event yet."

**New — the friends get named (verifiable beats vague):**

```
Friends of mine just went through YC: Asendia AI. Badis and I overlapped at
TUM and later worked on the same team at the same company, and I watched their
batch up close, from application to Demo Day. That settled it. Add that YC's
own RFS keeps describing the company I'm building, and this felt like the
right moment, not just a good idea. I haven't been to a YC event yet.
```

_[Checklist: message Badis BEFORE submitting — heads-up + ask about an alumni recommendation. If anything feels lukewarm, revert to the previous unnamed line.]_

### 11b. "How did you hear about Y Combinator?"

**Previous:** "I have been following Y Combinator on socials for a very long time. That is how." — **KEEP.**

## 12. Batch Preference

**Previous:** current. **New:** `Fall 2026` (the current open batch — confirm the exact dropdown label).

---

## The pre-submit checklist (now → July 27, 8pm PT)

**This week (July 10–14):**

1. **Start discovery calls — the one thing that most changes this application's odds.** Target 20–30 real conversations from the prospect list before July 25 (Lago got in pre-product on "100+ growth leaders interviewed"). Log each: name, role, the quote, would-they-use. The true count fills `[N]` in 9a and 8e. Never inflate; YC verifies.
2. Message Badis (heads-up + alumni recommendation ask).
3. ~~Decide the employment one-liner (8b bracket) and rehearse it.~~ DONE 2026-07-23 — Senior AI PM at Intellect (banking/finance AI platform); locked in the §8b note.
4. ~~[FILL] the IIM Bangalore venture line in 3c.~~ DONE 2026-07-23 — bubble-tea venture, IIMB entrepreneurship cell + Government-of-India recognition; no URL.

**Launch week (July 15–21):** 5. Ship the beta per the campaign plan; first outside users in. 6. Re-record the founder video (≤1:00, bullet card, one take) — [`video-scripts.md`](./video-scripts.md) Part 1. 7. Re-record the demo video (~2:15, script Part 2). Re-seed the demo workspace first; verify demo-account credit balance.

**Submit window (July 22–26 — do NOT wait for the 27th):** 8. Refresh every `[bracketed]` number: commits, migrations, missions, agent runs, register counts, users, dates. 9. Choose 8e Variant A or B by what is literally true that day. 10. Log in with the demo credentials in an incognito window; click the first three surfaces. 11. Read every answer ALOUD once (the AI-cadence and jargon check); red-pen pass (PG: cross out every word you don't need). Then two final scans: **the retell test** — have one friend read the application and retell it back as a story (who you are, what exists today, who wants it); if they can't, rewrite the unclear field (Dalton's stated reading method). And **the neediness scan** — nothing anywhere may read as "I need YC to make it" (the seventh deadly sin); the posture is "this is happening; YC makes it faster." 12. Verify links: product URL, LinkedIn (current), X, GitHub. Personal-website field → product URL. 13. Attach the chosen Claude Code session transcript (8d). 14. Submit by July 26 evening IST at the latest. Earlier is genuinely better — YC: "applying early is strongly encouraged."

## Banned words (never in any answer)

revolutionize · disrupt · transform · cutting-edge · bleeding-edge · leverage · seamless · empower · unlock · game-changing · AI-powered platform · world-class · massive opportunity · delve · landscape · testament · realm · embark · navigate · "not just X but Y" · mission-statement openers · any adjective doing a number's job

## One honest note on odds

Roughly 7% of applications get interviews and under 2% get in; nobody can make that "100%." What this rewrite does is remove every self-inflicted rejection reason the record shows (vagueness, buzzwords, walls of text, stale videos, unanswered fields, hidden weaknesses) and stack every controllable signal YC itself says it rewards: a working product they can click, visible slope since the last application, an earned insight in plain words, named verifiable specifics, and real user contact by the deadline. The rest is the interview — [`interview-prep.md`](./interview-prep.md).
