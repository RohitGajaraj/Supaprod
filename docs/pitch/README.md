# The Pitch Room

> _Created: 2026-07-10 · Last updated: 2026-08-04_

**Everything outward-facing lives here: investor decks, accelerator applications, demo scripts, objection answers.** If you are writing anything a person outside this company will read, you start in this folder and you do not write from scratch.

Deep reasoning stays in [`../strategy/`](../strategy/README.md). This folder holds the founder-ready distillation, with pointers back.

---

## Writing a new application? Follow this, in order.

Most work here is an accelerator, incubator, residency or grant application. There is a fixed procedure, because assembling one from memory produces a weaker application than assembling one from the track record, and produces two applications that contradict each other.

**1. Check it is worth applying to.** [`applications/README.md`](./applications/README.md) tracks 144 programs researched against their own sites. Check two blockers first, because they kill most European and Indian programs before you write a word:

- **Solo founder.** Many programs require a team of two. Check the team-size bar before scoring fit.
- **No entity exists yet**, and the founder is **US-primary**, so we deliberately do not incorporate in India. The India grant stack is a fallback only.

**2. Learn what that program selects for.** [`applications/positioning-doctrine.md`](./applications/positioning-doctrine.md) is how we get **selected**, not just how we apply: the asset track record, the counter to every standard objection, the per-program positioning axis, and the quality gate. Then read that program's own `positioning.md` if one exists.

**3. Pull the answers; never write them fresh.** [`applications/answer-bank.md`](./applications/answer-bank.md) holds every reusable answer at every length.

**4. Take the facts from the canon, not from memory.** These are the ones that get fumbled:

| Fact | Value |
| --- | --- |
| Contact | founder@supaprod.ai (founder surfaces) · investors@supaprod.ai (investor relations) |
| LinkedIn | linkedin.com/in/rohit-gajaraj |
| Public launch date | **mid-September 2026**, on every external surface |
| Employer | "Intellect, a leading BFSI technology OEM". **Never** "Intellect Design Arena". |
| Role arc | ISRO associate PM, then Infineon PM, then Intellect senior AI PM |
| Education | TUM only |
| Market ladder | TAM $300B+/yr (2.6M PMs x ~$115K loaded) · SAM $2B to $12B/yr · SOM ~$47M ARR |
| Tagline | "Agents that know what to build, ship it, and remember." |

**The never list.** No commit counts or feature-register numbers. No YC mentions in generic materials. Self-build story implicit only. No "Cursor for PMs" phrasing on a surface. Never say we dispatch work to Cursor, Lovable or Devin; they are the era's proof, not our subcontractors.

**5. Position it.** The claim is that Supaprod **learns and guides**, never that it "remembers" or "stores". Full vocabulary table: [`../../README.md`](../../README.md). Telling order is door, then body, then brain, one headline per surface, brain as the crescendo: [`repositioning-2026-07-22.md`](./repositioning-2026-07-22.md).

**6. Tag every claim.** `PROVEN` (live and verifiable) · `WIRING` (built, not yet demonstrably run, and **never said publicly until it runs**) · `ROADMAP` (say so). Honesty is the product here.

**6b. Run the pressure test. Added 2026-08-13, and nothing sends without it.** [`.claude/workflows/application-pressure-test.js`](../../.claude/workflows/application-pressure-test.js) drafts, fact-verifies against git and the live database, then has three adversarial readers score the whole application and name the one **real action** that would flip them. Full description and the failures each phase answers: [`applications/README.md`](./applications/README.md). **Verification runs before evaluation, deliberately** — a reader panel improves copy and does not make it true, which we learned when a synthesis step invented a flattering attribution and all three readers rated it the strongest sentence in its field.

**7. Log where it went.** Record the submission in [`applications/README.md`](./applications/README.md), and if the program needs a login, take one from [`../operations/demo-credentials.md`](../operations/demo-credentials.md). **One login per application, never shared:** reviewers open them weeks apart, and whoever opens second finds an approval queue the first one already cleared, which deletes the single most important beat in the demo. Rehearse on `harbor@` only.

---

## The files

### Applications

| File | Open it when |
| --- | --- |
| [`applications/README.md`](./applications/README.md) | Picking a program, or logging a submission. 144 researched, with deadlines and fit. |
| [`applications/positioning-doctrine.md`](./applications/positioning-doctrine.md) | Working out how to get selected by a specific program. |
| [`applications/answer-bank.md`](./applications/answer-bank.md) | Writing any answer. Pull, do not compose. |
| [**`verified-numbers.md`**](./verified-numbers.md) | **Quoting any number outward. Read it before you type a figure.** Every number with the query that reproduces it, the honest set excluding seeded workspaces, and the retired list. **Three numbers presented as proof in the YC application were seed data and a fourth set claimed ten weeks against ten weeks; none had a recorded query.** The rule: a number carries its query or it does not go. |
| `applications/<program>/` | Per-program: `positioning.md`, `application.md`, `how-to-apply.md`. Currently Betaworks AI Camp, EF The Bridge SF, South Park Commons, The Residency. |

### YC specifically

| File | Open it when |
| --- | --- |
| [**`yc/APPLICATION-FINAL.md`**](./yc/APPLICATION-FINAL.md) | **PASTE FROM HERE. The finished Fall 2026 application, every field, nothing but final text.** Rebuilt 2026-08-11 after three claims on the form were found to be false: three product metrics that were seed data, a thirteen-month timeline against ten weeks of commits, and the falsified moat claim still sitting in the submit sheet. Every number in it reproduces from a command. Two fields marked `[YOU]` need something only the founder has. |
| [`yc/fall-2026-application.md`](./yc/fall-2026-application.md) | The reasoning, the audit history and every superseded draft behind the file above. **Not the paste source any more.** |
| [`yc/research-findings.md`](./yc/research-findings.md) | You need the evidence behind a choice. YC's own rules, the seven deadly sins, language forensics, every claim sourced. |
| [`yc/interview-prep.md`](./yc/interview-prep.md) | The interview lands. Numbers card, spoken answers to the top 25 plus the 12 brutal ones, the 90-second screen-share. |
| [`yc/application-strategy.md`](./yc/application-strategy.md) | Thinking about positioning. Partner psychology and the positioning ladder. |
| [`yc/founder-profile-answers.md`](./yc/founder-profile-answers.md) | Filling the YC founder-profile fields. Separate from the application itself. |

### The story, and telling it

| File | Open it when |
| --- | --- |
| [`one-pager.md`](./one-pager.md) | You need the whole story on one page: what it is, how it differs, what we can prove today. |
| [**`founder-story.md`**](./founder-story.md) | ⭐ **The why, in the first person, at three lengths: 100 words for an About page, 250 for a Product Hunt first comment, 500 for an investor or accelerator narrative.** Sourced from `answer-bank.md` §2 and the Betaworks video scripts rather than composed, so all three are the same story cut to fit. Carries the problem observed, why now, the defensibility argument with two of three layers conceded, and the deliberate honesty section on what is not yet proven, with guidance to take **one** limit per artifact rather than all five. Two `[FOUNDER TO FILL]` slots block it from shipping: the About byline location, and one real instance of a decision you were asked to justify and could not reconstruct. The **third-person** bio a journalist prints is [`../growth/press-kit.md`](../growth/press-kit.md) §4; both trace to `answer-bank.md` §2 and neither is merged into the other. |
| [**`founder-answer-playbook.md`**](./founder-answer-playbook.md) | ⭐ **Before any investor call, accelerator interview or partner conversation.** Venue-neutral. Teaches the three postures, answer length per room, confidence calibration, the numbers card, ~50 drilled answers, and where to be flatly honest versus where to play the longer game. **A live file: it is updated after every application and every interview.** |
| [`qa-bank.md`](./qa-bank.md) | The short objection list by audience. The playbook above supersedes it for depth. |
| [`demo-story.md`](./demo-story.md) | **Start here before any demo.** The narrative spine. The demo tells a story; it does not tour features (founder ruling 2026-07-25). |
| [`demo-script.md`](./demo-script.md) | The concrete walkthrough: evidence on screen, the loop closing live, the failure path shown on purpose. |
| [`compounding-memory-narrative.md`](./compounding-memory-narrative.md) | You need the commercial argument for the memory layer, including the limits that are still real. |
| [`repositioning-2026-07-22.md`](./repositioning-2026-07-22.md) | The triple-RFS intersection, per-surface vocabulary, the competitor sweep. |
| [`investor-deck/`](./investor-deck/README.md) | The pre-seed deck, frozen 2026-07-24, print-to-PDF wired, with the brand assets vault. |

### Recording video

| File | Open it when |
| --- | --- |
| [`yc/founder-video-script.md`](./yc/founder-video-script.md) | Recording the **founder** video. Venue-neutral, so it serves every application. |
| [`yc/founder-video-script-detailed.md`](./yc/founder-video-script-detailed.md) | Delivery craft: the 19-video accepted corpus, the practice protocol, the fumble rule. Its script is superseded; everything else stands. |
| [`yc/video-scripts.md`](./yc/video-scripts.md) | Recording the **demo** video. Shot list, say-this-not-that, framing laws. |
| [`yc/demo-video-one-journey.md`](./yc/demo-video-one-journey.md) · [`yc/demo-video-three-layer-tour.md`](./yc/demo-video-three-layer-tour.md) | Two alternative demo cuts. |

### Launch and partners

| File | Open it when |
| --- | --- |
| [`launch-assets.md`](./launch-assets.md) | Prepping the listing: Show HN, Product Hunt, share-link copy. |
| [`teaser-video-plan.md`](./teaser-video-plan.md) | **The teaser: one 90-second master, and Product Hunt, the site hero and the YC cut as derivations of it.** Beat sheet on named live routes, the two things that must be true before the camera rolls, what would be misrepresentation and must not appear, and a ~$34 tooling list. |
| [`design-partner-kit.md`](./design-partner-kit.md) | Recruiting beta partners. 25 sourced targets, evidence-first templates. |
| [`trust-ledger-launch-plan.md`](./trust-ledger-launch-plan.md) | Building the public Track record as launch material. |
| [`hyperagent-runbook.md`](./hyperagent-runbook.md) | Deploying the arm's-length GTM rig. Note the never-touch boundary: Airtable ships a direct competitor. |

### Brand history

[`naming-decision-supaprod.md`](./naming-decision-supaprod.md) is the Cadence to Supaprod decision with its 19-name evidence chain. [`rename-shortlist.md`](./rename-shortlist.md) and [`rename-candidate-pool.md`](./rename-candidate-pool.md) are the working set behind it. Execution ops (domains, handles, trademark) live in [`../growth/brand-ops/`](../growth/brand-ops/README.md).

---

## Where the deep material is

| You want | Go to |
| --- | --- |
| Direction and the moat argument | [`../strategy/v11-guiding-star.md`](../strategy/v11-guiding-star.md) · [`../strategy/moat.md`](../strategy/moat.md) |
| Which strategy doc is current | [`../strategy/README.md`](../strategy/README.md), the arbiter |
| Primary-source evidence | [`../research/`](../research/) · especially [`research/pm-voice-and-ai-tooling-research.md`](../research/pm-voice-and-ai-tooling-research.md) and [`research/launch-research-briefs.md`](../research/launch-research-briefs.md) |
| Why a decision was made | [`../strategy/session-decisions.md`](../strategy/session-decisions.md) · [`../strategy/strategic-inputs-log.md`](../strategy/strategic-inputs-log.md) |
| What the product can actually do, in code | [`../features/lifecycle-signal-to-learning.md`](../features/lifecycle-signal-to-learning.md), which carries a `file:line` for every structural claim |
| Pricing and tiers | [`../strategy/pricing/`](../strategy/pricing/README.md) |
| GTM execution, not positioning | [`../growth/`](../growth/README.md) |

---

## Four standing rules

1. **Update in place. Never fork a parallel copy.** Any session that produces outward-facing content routes the result into this folder in the same session. Git history is the version trail.
2. **The answer playbook is updated after EVERY application and EVERY interview**, in the same session, while it is fresh. A question we could not answer well, a pushback, a rejection reason, a changed number: all of it lands in [`founder-answer-playbook.md`](./founder-answer-playbook.md). We are applying to many programmes over the coming weeks and that file is what compounds across them.
2. **Every claim carries its wiring status.** `PROVEN` · `WIRING` · `ROADMAP`.
3. **Cite artifacts and companies, never gurus.** The community's allergy to guru-citation is our tailwind.
4. **Numbers trace to the live database or a dated source.** No run-rate theater; investors name it as a red flag themselves.

**Nothing outward sends without the founder's approval.** Not a DM, not a post, not a submission.
