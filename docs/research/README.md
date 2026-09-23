# References

> _Created: 2026-08-04 · Last updated: 2026-09-23_

**Evidence, kept in original form.** Twenty documents of primary-source research: what the market does, what product managers say, what investors reward. This folder is deliberately raw. The distilled conclusions live in [`../strategy/`](../strategy/README.md); this is what they were drawn from.

**Two standing rules that make this folder usable:**

1. **Cite artifacts and companies, never gurus.** The community's allergy to guru-citation is our tailwind, so an outward-facing claim quotes a company's own post or a measurable artifact, never a thought-leader.
2. **Every claim carries a source URL and a date.** A number without a source cannot be used in an application, because an investor will ask and "our research says" is not an answer.

Nothing here is superseded by age. A 2026-06 competitor sweep is still true about 2026-06, and dated evidence is what makes a trend argument rather than an assertion.

---

## The strategy reset (2026-09-23): should Supaprod exist, and what instead

**Read these before any sweep on the market, the agentic stack, AI governance or pivot options, so it
is not run a third time.** The verdict they feed is
[`../strategy/strategy-reset-2026-09.md`](../strategy/strategy-reset-2026-09.md); the founder's
brief is [`../prompts/strategy-reset.md`](../prompts/strategy-reset.md). **Ruled 2026-09-23 (R-42):
Supaprod stops, and the finance-validation pivot these files evaluated was declined.** The evidence
stands; §14 of the verdict lists the constraints for the next search.

| File | What it holds |
| --- | --- |
| [`supaprod-internal-evidence-2026-09.md`](./supaprod-internal-evidence-2026-09.md) | **What the repo itself proves**: users, finished runs, the five positioning framings in ten weeks, the five rejections, and the 2026-08-11 finding that the business was contradicted, six weeks before anyone acted on it. Also the pieces of the build that travel |
| [`agentic-stack-and-absorption-2026-09.md`](./agentic-stack-and-absorption-2026-09.md) | **The 2026 agentic stack, layer by layer**, with 2025–26 deals and what the labs shipped into each; which categories labs flattened and which survived and why; the current thesis tested (code review, AI PM tools, decision tracking); what agent builders pay to fix; investor theses; B2B vs B2C; top five opportunities and the categories to avoid. Subagent report, verbatim |
| [`regulated-fs-agent-governance-2026-09.md`](./regulated-fs-agent-governance-2026-09.md) | **AI-agent validation in financial services, briefed to break the idea**: every regulator's position and date (SR 26-2 excludes agents; the RBI's 2026-06 draft covers them), the pain data, the competitors and acquisitions, buyers and sales cycles, India, and the three wedges that survive. Subagent report, verbatim |
| [`leading-indicators-2026-09.md`](./leading-indicators-2026-09.md) | **The 6–12 month forecast from signals published in advance**: YC's requests across Spring, Summer and Fall 2026, the dated regulatory calendar, where the money went, what labs shipped and did not |
| [`jev-and-laya-2026-09.md`](./jev-and-laya-2026-09.md) | **The typed decision models** (TypeSafe's Jev, Convai's open Laya three days later): contract, price, benchmarks and their caveats, what they change in the economics, and the assessment made after the verdict |

## Market and competitors

| File | What it holds |
| --- | --- |
| [`competitive-landscape.md`](./competitive-landscape.md) | The competitor grid, pricing, and the ranked threats. |
| [`chatprd-teardown-2026-08.md`](./chatprd-teardown-2026-08.md) | **ChatPRD torn down, and the category read that came with it** (2026-08-25): their shape and pricing, what we take / beat / refuse, the 90-dead-gates finding, and the prior art nobody had named — Cloverpop, eleven years on this exact thesis. |
| [`launch-research-briefs.md`](./launch-research-briefs.md) | Four sourced briefs from 2026-07-10: competitive landscape, frontier-agent UX patterns, the TAM/SAM/SOM arithmetic, and the HyperAgent grant terms. **The market ladder in every application traces here.** |
| [`agentic-product-patterns-2026-08.md`](./agentic-product-patterns-2026-08.md) | **How the frontier's products BEHAVE, and the delegation arc we sell into** (2026-08-26). Nine products torn down for the one mechanic each gets right — Claude Code, Codex, Cursor 2.0, Replit Agent 4, Devin, Manus, Linear for Agents, Notion Custom Agents, Amoeba. Holds the **assign · manage · operate · value-audit · review · ship** persona that replaces station vocabulary on every user-facing surface, and §3's three things all of them do that we do not — starting with **they verify before they hand over.** Read this before any "make it more agentic" work; it exists so no session pays for the sweep twice. |
| [`agentic-surface-patterns-2026-09.md`](./agentic-surface-patterns-2026-09.md) | **The six screen-level questions per product** (2026-09-02): what a new user sees first, what is shown while it runs, how the result is handed over, how to go one level deeper, what is hidden, where the person still clicks. Lovable, Replit, Devin, Claude Code, Codex, Cursor cloud, v0, Linear, Perplexity, Vercel. Ends with the six things they all do and the three none of them do. One URL per claim; four items marked unverified. The decisions drawn from it are in `the-first-run/A1-REPORT.md` §4. |
| [`external-strategy-synthesis.md`](./external-strategy-synthesis.md) | An outside read of the strategy. |
| [`market-validation-2026-08.md`](./market-validation-2026-08.md) | **The test of whether the Lenny findings generalise.** Four lanes run entirely outside that ecosystem: what the frontier labs shipped since Krieger named this layer, where the money went, what employers put in requisitions, and what engineers do instead of buying. **Confirms the problem, confirms the DIY default, contradicts the business.** Read it for the two findings that hurt: Notion shipped a free version of the lifecycle framing on 2026-07-09, and engineering wrote down the forecast-at-decision-time practice a decade ago and never tooled it. **The fifth lane landed as §8** on 2026-08-11: the category and analyst question. **Read §8.5 before any positioning work** — it is the least comfortable section in the file. |

## What we may and may not claim

| File | What it holds |
| --- | --- |
| [`claims-audit-findings.md`](./claims-audit-findings.md) | **The raw record: all 143 findings verbatim**, refuted and survived, each with its `file:line` evidence. Committed because the workflow journal behind it lives in a session directory and does not survive the session — losing it would mean paying for the same audit twice. Section B is the useful half on a good day: 100 claims that **survived** an adversarial fact-check, with the evidence to cite. Re-runnable via the committed harness at `.claude/workflows/claims-audit.js`. |
| [`claims-audit.md`](./claims-audit.md) | **143 claims tested against the codebase; 43 refuted.** Read before writing any outward copy — site, deck, application or sales call. Holds the live overclaims still on production (the data-residency promise with no data behind it, three wrong tool counts on machine-readable surfaces, a table count stale by 59), the full banned-vocabulary and banned-claim lists with rates and replacements, the four tense laws, and the traps — including superseded strings still printed under a heading called "Positioning canon". Ends on the gap that lets it recur: **there is no automated guard for any banned word**, so a surface that breaks the law ships silently and green. |

## What product managers actually say

| File | What it holds |
| --- | --- |
| [`pm-voice-and-ai-tooling-research.md`](./pm-voice-and-ai-tooling-research.md) | **The most-cited file here.** Seventeen sections of primary sources on PM sentiment toward AI tooling. Contains the wedge in users' own words, and §12.4 is the cite-artifacts-not-gurus rule. |
| [`podcast-corpus-lenny.md`](./podcast-corpus-lenny.md) | Lenny's Podcast, mined for operator evidence. 16 episodes, ASR transcripts, 2026-07-10. **Audited 2026-08-10 — five episodes are quarantined, see the row below before citing it.** |
| [`customer-voice.md`](./customer-voice.md) | **The answer to "have you talked to your users?"** The pain in practitioners' own words, named and dated: the judgment-gap quote, nine independent DIY clusters spanning four years, the product spec written by people who have never heard of us, and the 2026 sentiment numbers. Opens by stating plainly that we have run zero first-party interviews, and closes with the one-ecosystem limitation. |
| [`lennys-corpus-sweep-2026-08.md`](./lennys-corpus-sweep-2026-08.md) | **The full sweep — all 679 documents, 5.94M words, read in full.** Twelve theses scored; four falsified. The vocabulary table, the station-model verdict, the routed directives and the kill list. **Read this before any positioning or copy work.** |
| [`lennys-quote-verification.md`](./lennys-quote-verification.md) | The audit of our earlier quotes against the official paid archive. 131 quotes checked; 43 uncorroborated; **nine archive transcripts contradict their own titles.** Names what may still be cited and what may not. |
| [`lennys-data-archive.md`](./lennys-data-archive.md) | **Pointer, not content.** The paid 679-document Lenny archive: what it holds, how any agent on any machine gets it, and the licence that forbids committing a byte of it. **Read before quoting the corpus.** |
| [`podcast-corpus-aakash.md`](./podcast-corpus-aakash.md) | Aakash Gupta's channel, guest quotes via transcript extraction. |
| [`podcast-corpus-frontier.md`](./podcast-corpus-frontier.md) | Frontier voices on agents and the shape of the era. |
| [`lane0-cycle1-findings.md`](./lane0-cycle1-findings.md) | ⚠️ **SUPERSEDED 2026-08-11, kept only so a decision can be traced.** The first-cycle read, before the full corpus. Its ICP widening and its "decision memory + receipts" wedge were both overturned; its own header names exactly what it got wrong. **Do not cite it for positioning.** Its governance finding survived and was independently confirmed from outside. |
| [`research-references-aakash-gupta.md`](./research-references-aakash-gupta.md) | 139 KB the founder gathered and pasted in, kept raw on purpose. Different method and date from the podcast corpus above; neither supersedes the other. |

## Investors and the funding lens

| File | What it holds |
| --- | --- |
| [`investor-corpus-yc-vc.md`](./investor-corpus-yc-vc.md) | YC, a16z, Sequoia and others in their own words. What they reward and the red flags they name themselves, including run-rate theater. |

## Where the industry is going

| File | What it holds |
| --- | --- |
| [`ai-agent-trends-2026-gcp.md`](./ai-agent-trends-2026-gcp.md) | Google Cloud and DeepMind on agent trends, 2026. |
| [`future-of-ai-startups-2025-gcp.md`](./future-of-ai-startups-2025-gcp.md) | Google Cloud on AI startups, 2025. |
| [`new-age-product-development-research.md`](./new-age-product-development-research.md) | How frontier companies actually build. Feeds the six-month-forward doctrine. |
| [`launch-blockers-status.md`](./launch-blockers-status.md) | Running status of the mid-September launch blockers. |

---

## Where research goes, so it is never paid for twice

| Kind of research | Lands in |
| --- | --- |
| Market, competitor, operator, investor evidence | **here** |
| **Product and design patterns** lifted from a proven product | [`../design/REFERENCE-PATTERNS.md`](../design/REFERENCE-PATTERNS.md), in the same session |
| The reasoning a piece of research changed | [`../strategy/strategic-inputs-log.md`](../strategy/strategic-inputs-log.md), with the decision in [`strategy/session-decisions.md`](../strategy/session-decisions.md) |
| [`integrations/README.md`](./integrations/README.md) | **Integration research, one file per tool, written at the moment of need** (2026-08-26). Read before researching any tool — around twenty providers already exist in the repo, including Jira, Linear, GitHub, Slack and Figma, plus a generic MCP client. The folder exists so nobody pays for the same API research twice. |

**Read before starting a new research pass.** This corpus is large enough that the same sweep has been run twice before.
