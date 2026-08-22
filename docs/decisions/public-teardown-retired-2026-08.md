# The public teardown is retired, and the Critic that ran it is not

> _Created: 2026-08-22 · Last updated: 2026-08-22_

**Ruled by the founder on 2026-08-22.** The free, no-signup PRD teardown at `/p/teardown` is gone from the website. **The Critic agent inside the product is untouched** and this record exists mostly to hold that line, because the two share a name and the second one is load-bearing.

**In one line: the window closed, the engine did not.**

---

## The ruling, in his words

> "remove the public teardown… It's of no value. I feel it's one of the weakest weak points… It's like another copilot or ChatGPT window. There is nothing USP."

And, minutes later, widening it:

> "remove the public teardown. Whatever we have it on our website, it's of no use, is what I feel. Or the critic part, critic and teardown both."

He said **"on our website"** twice in two sentences. That is the scope: the marketing surface, not the engine.

---

## One correction, recorded before anything else

**The founder associates this removal with the EF The Bridge rejection. The repo does not support that, and this record does not adopt it.**

EF gave **no reason**. The verbatim email says *"highly competitive… only a small group can progress to the next stage"*, which is a volume statement, not a judgement of the product. [`../operations/session-handoff.md:181`](../operations/session-handoff.md) settles it: *"**No reason was given**… The phrase **'next stage'** confirms a staged process, so this was a first-pass screen and the 13 filed answers were probably never judged."* The same line carries the standing instruction: *"Do not rewrite them against this outcome."*

Nothing in the EF outcome mentions the teardown, and the teardown URL was never in the filed EF answers (see the exposure audit below — it was never in **any** submitted application).

**The removal stands on the product argument alone, and the product argument is sufficient.** A textarea that answers you is the single most copyable shape in this market. It showed a stranger layer 01, which any vendor can clone, and nothing of layer 03, which is the only defensible one. That is a complete case. Attaching it to a rejection that gave no reason would put a cause in the record that the evidence cannot carry, and would invite someone to un-retire this the next time an accelerator says yes.

---

## What the numbers said, which nobody had looked up

Queried against production on 2026-08-22, before anything was removed.

| Measure | Value |
| --- | --- |
| Lifetime model calls through the public teardown (`ai_events.surface_ref = 'public-teardown'`) | **10** |
| Distinct IPs that ever used it (`public_decision_rate_limits`, `teardown:%`) | **2** — one on 2026-07-12, one on 2026-08-19, one request each |
| Opportunities ever published to `/t/<slug>` (`opportunities.is_public = true`) | **0** |

Ten calls in five weeks from two Indian residential IPs is the founder testing his own page. **The public teardown was never used by a stranger.** That is not the reason it goes, but it is the reason nothing is lost by it going.

---

## What was removed

Nothing here was deleted blind. Every item was traced to a caller first, per the deletion doctrine of 2026-08-19: *"If it is a duplicate, I am okay with it. If it is required, let us keep it rather than deleting it."*

**Deleted outright — one file:**

- **`src/routes/api/public/teardown.ts`** (196 lines). The unauthenticated POST that ran a **paid model call on the platform's own AI account** for anyone on the internet. This is the only thing in the change that had to go rather than merely stop being linked, because a door nobody walks through still costs money the day somebody finds it.

**Turned into a permanent redirect — one file:**

- **`src/routes/p.teardown.tsx`** → `redirect({ to: "/demo" })`. **A dead link is worse than a removed page**, and this URL shipped: the hero's second control, a footer row, the Receipts beat, `/demo`'s closing button, and the call to action in both the text and HTML bodies of waitlist email A1. [`../../src/routes/trust.tsx`](../../src/routes/trust.tsx) set this precedent on 2026-07-11 and its route-inventory exemption still reads *"kept because URLs are forever"*. `/demo` is the destination because whoever follows this link came for the thing they could see without an account, and `/demo` is what is left of that promise.

**Unlinked from the website — eight files:**

| File | What went |
| --- | --- |
| `src/components/landing/Hero.tsx` | The "Tear down your PRD →" control and its "No signup · evidence in a minute" line |
| `src/components/landing/LandingFooter.tsx` | The "A public teardown" row under **proof** |
| `src/components/landing/Receipts.tsx` | The "/p/teardown" artifact row, the prose that described it, and "public teardowns" from the capability list |
| `src/routes/demo.tsx` | `TeardownSection` (the one unauthenticated page that rendered a Critic verdict as its own beat), its `VERDICT_COLOR` map, its loader pull, and both `/p/teardown` links |
| `src/lib/waitlist-email.server.ts` | A1's single CTA, in both `a1Text` and `a1Html` |
| `src/routes/index.tsx` | The `MACHINE_CONTENT` "Live proof" bullet |
| `src/server.ts` | `/p/teardown` in `CACHEABLE_MARKETING_ROUTES` |
| `public/{sitemap.xml,agents.txt,llms.txt,llms-full.txt}` | The four machine-readable files that actually advertise the path to crawlers |

**One live defect found on the way out, and it is the reason this was not a delete-the-folder job.** `asPlainText` in `TeardownReceipt.tsx` ended every copied receipt with *"Try your own: https://supaprod.ai/p/teardown"* — and **`ObsidianOnboarding` reuses that formatter for the copy-to-share on an authenticated user's Critic review.** Retiring the page without touching it would have put a redirecting URL on the clipboard of every signed-in user, on a surface nobody would have thought to check. The footer now reads `https://supaprod.ai`, and "Try your own" went with the path, because it stopped being true the moment there was nothing to try.

---

## What was kept, and why each one stayed

**The Critic agent, entirely.** Slug `critic`, display name "Challenge", station 02 Decide, `critic.server.ts`, `critic.evaluate`, `decision.revise`, the precedent loading, and `agent-vocabulary.ts`. Three independent reasons, any one of which is sufficient:

1. It is **rank key 2 in the Decide comparator** (`ranking.ts:317-336`). Pulling it silently changes how every bet in the product is ranked. That is not a website change wearing a website change's clothes.
2. It is the reader half of the maker-reader pairing at every write station. `agent-first-platform.md` §1.8 records the evidence: MAST (arXiv:2503.13657, 1,600+ annotated traces) puts task-verification failures at **21.30%** of multi-agent failures and role-specification drift at **0.5%**. Removing the reader optimises a 0.5% failure mode by deleting the mitigation for a 21% one.
3. The founder's objection was to a **paste-box on a marketing page**, not to an agent that argues with a spec. Those happen to share a word.

**`src/lib/ai/public-teardown.server.ts`, unchanged.** `runPublicTeardown`, `TEARDOWN_SYSTEM` and `parseTeardown` now have no caller. They stay for two reasons. The `Teardown` / `TeardownVerdict` types are imported by `TeardownReceipt.tsx` and by `ObsidianOnboarding.tsx`, both authenticated code, so the module is not dead. And **the bundler confirms the rest costs nothing**: after `bun run build`, the string `You are Supaprod's Critic. A stranger has pasted` appears **nowhere in `.output/`**. It is tree-shaken out entirely. This mirrors what [`palette-retired-2026-08.md`](./palette-retired-2026-08.md) did with `palette-catalog.ts` — the prompt is the most considered artifact of the whole feature, and deleting it would destroy the evidence of what was tried.

**`src/components/public/TeardownReceipt.tsx`.** Shared: `asPlainText` is live in authenticated onboarding. The `TeardownReceipt` component itself is now unrendered, and is kept in the same file rather than surgically excised, because splitting a file to delete half of it is a refactor disguised as a cleanup.

**`getDemoTeardown` in `demo.functions.ts`.** A read-only GET over seeded data, now unread. Kept as data with no reader, same rule as above.

**`product.tsx` ("CRITIC TEARDOWN" in the Decide capability list), `updates.tsx` (the dated changelog entries), `WaitlistForm.tsx` ("First 100 get the Critic"), `Replay.tsx` (`agentName: "Critic"`).** These **describe what is inside the product**, and what is inside the product did not change. The test applied throughout: *does this offer a visitor a teardown to go and get, or does it say what the product contains?* The first goes, the second stays. `updates.tsx` is additionally a dated historical log — a changelog that deletes its own entries is not a changelog.

**Every teardown row in the database.** Nothing was dropped and no migration was written. `app_settings.public_teardown_user_id` and `public_teardown_day` remain, as do the two `public_decision_rate_limits` rows. They are inert with the endpoint gone.

---

## The seam this stopped at, which needs a decision

**`/t/<slug>` (`src/routes/t.$slug.tsx`) was NOT removed, and this is the one open question in the change.**

It is a genuinely different feature from the one the ruling named. `/p/teardown` was RPT-03: a stranger's paste box. `/t/<slug>` is F-SHARE-TEARDOWN: a read-only page showing a teardown that an **authenticated owner chose to publish** from their own WEDGE opportunity. It has no input field, so it is not "another copilot or ChatGPT window" in any sense — but it *is* a public page that renders a Critic verdict, which the widened ruling names.

Four reasons it was left standing:

1. **Its writer half is an authenticated product control.** `OpportunityDetailSheet` has a Publish toggle backed by `setTeardownShared` / `getTeardownShareState`. Removing only the public half turns that control into a dead-link generator — the exact failure the redirect above exists to avoid.
2. **Deleting it is a one-way door.** It is the only file in this change carrying a `design:ratchet` baseline key (`--hairline: 2`, `raw-colour: 15`). Deleting it drops that key, and restoring the file later trips rule 1 of `meridian-ratchet.test.ts` — *a new file speaking a retired design vocabulary* — with no sanctioned repair, and hand-widening the baseline is banned. **`git revert` would not land it.** This is precisely the trap [`palette-retired-2026-08.md`](./palette-retired-2026-08.md) records.
3. **It has compliance dependencies.** [`../features/right-to-erasure.md:58`](../features/right-to-erasure.md) names `/t/<slug>` in the GDPR public-share-artifact path, and [`../features/pii-egress-guard.md:52`](../features/pii-egress-guard.md) says the egress guard *"closes the `/t/<slug>` public surface"*.
4. **Zero rows have ever been published**, so it currently serves nothing, costs nothing and exposes nothing. There is no urgency, and the decision is equally cheap tomorrow.

**Removing it properly means removing an authenticated product control as well, which is outside "on our website".** That needs the founder, not an inference.

---

## Is the delete a one-way door?

**No, for everything actually removed.** `p.teardown.tsx` and `TeardownReceipt.tsx` were Meridian-ported by another lane hours earlier (commit `251a1ad3a`) and **carry no baseline key**, so nothing was dropped by editing them. `src/routes/api/public/teardown.ts` was never in the ratchet's scan scope. The only file in the neighbourhood that would have made this one-way is `t.$slug.tsx`, and it was left alone — see above.

`bun test` **does** now fail one assertion, and it is the good failure: `src/routes/demo.tsx raw-colour: 14 -> 9`. Five raw colours left the repo with `TeardownSection`, and the ratchet's rule 3 re-freezes ground that has been gained. **The sanctioned repair is `bun run design:ratchet`, which this session was instructed not to run** because other lanes are mid-edit on that shared baseline. Whoever lands this must run it in the same commit.

**One thing worth knowing before you revert this.** A parallel lane spent that same afternoon porting `p.teardown.tsx` and `TeardownReceipt.tsx` to Meridian, removing 32 occurrences of retired vocabulary between them. That work is preserved in `251a1ad3a`; the page body it applied to is gone. Nobody did anything wrong — the ruling landed after the port started.

---

## How the endpoint actually landed, which was not how it was meant to

Worth recording, because the git history will read oddly to whoever finds it next.

`src/routes/api/public/teardown.ts` was staged for deletion in a shared working tree while other lanes were live in it. A parallel lane then committed **`2626364c7` "The agent-to-agent surface, and the write gate has been open for twelve days"** — and picked up the staged deletion along with its own two files. So the 196-line unauthenticated endpoint was removed by a commit about agent-to-agent documentation, with no message explaining it. Nobody did anything wrong beyond a wide `git add`; the end state is correct.

**The consequence is a window on `origin/main` where the retirement is half-landed:** the endpoint is gone and `p.teardown.tsx` still posts to it, so the live form 404s on submit and shows *"The Critic could not finish reading that."* Lovable deploys from GitHub, so that state is shippable until the rest of this change lands. It matters very little in practice — two people have ever used that form — but it is the reason this change should not sit in a working tree.

---

## The public exposure, audited rather than assumed

The URL was **never published anywhere external.** Not in a single submitted accelerator application (the two drafts that named it — Berkeley SkyDeck `application.md` and Sequoia Arc — are both explicitly superseded; the filed `APPLICATION-FINAL.md` files contain no teardown URL at all). Not in a launch listing: all thirteen instances live in `docs/growth/launch-listings.md`, whose gate table is unfilled and whose accounts are unclaimed. Not in a sent email: A1 is wired in code but the production count of real waitlist signups is **0**, so it has never reached a human. Not in a live social post. No OG image or social card references it, and the only teardown-aware metadata was `/t/<slug>`'s runtime `head()`.

**What was genuinely live** is the four machine-readable files in `public/`, served at supaprod.ai and read by Google, GPTBot, ClaudeBot and PerplexityBot. Those are fixed. `robots.txt` never named the path and needed no edit.

**Stale by this change, not fixed by it:** `docs/growth/launch-listings.md` (13 instances), `docs/growth/email-sequences.md`, `docs/growth/branding/email/_preview.html`, `docs/growth/vocabulary-change-list-2026-08.md` (eight rows targeting the deleted page's copy), `docs/growth/04-growth-engine-metrics-and-experiments.md` (which calls the share loop "the #1 growth asset"), `docs/pitch/launch-assets.md`, `docs/features/wedge.md`, `docs/strategy/brownfield-positioning-evaluation.md`, `README.md:140`, and `.claude/workflows/claims-audit.js:56`, which will keep probing a route that now redirects. None were touched here: they are unshipped drafts and internal records, and rewriting a dozen growth documents is a separate piece of work with its own approval.
