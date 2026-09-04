# What the deadline rule found on the existing board

> _Created: 2026-08-14 · Last updated: 2026-08-14_

> _Checked 2026-08-14 by opening each programme's own page. This file exists because the founder ruled that **a listed deadline is a rumour until the form contradicts it**, and the first hour of applying that rule turned up five programmes we had written off or mis-scored._

**Read the rule first: [`../README.md`](../README.md), the screening block at the top.** Nothing here is a score or a recommendation. It is only what the pages said, with the wording quoted, so Gate 2 can rank against facts rather than against a two-week-old listing.

---

## 🟢 Open, and the board said otherwise

| Programme | Board said | The page says |
| --- | --- | --- |
| **HF0 Residency** | Deadline passed 2026-08-01 | `hf0.com/apply` serves a **live multi-step form** with no closed notice. The board's own Blockers field admits the date came from **"one aggregator only, unverified"** |
| **Hub71 (Cohort 20)** | **"Hard blocker: needs an ADGM entity and physical presence in Abu Dhabi"** | Open. And the only stated requirement to apply is *"At least one founder is expected to commit to relocating long-term and building a team out of Abu Dhabi."* **The entity belongs to participation, not to applying** |
| **Z Fellows** | Rolling, fit 8.0 | Open, and it answers the entity question outright: **"Do you need to have a company? No. We can help you set up one."** Solo is explicit — *"You can apply solo or with your co-founders"* — and **rejected applicants are invited to re-apply** |
| **Emergent Ventures** | Rolling, fit 9.2 | Apply Now is live. Eligibility is **age 13 or over**, and nothing else. A dedicated **India track** exists as a dropdown on the form |
| **a16z Speedrun (SR008)** | Rolling, off-cycle accepted | Confirmed: *"we accept applications year-round, and we encourage you to apply whenever you're ready."* **SR008 starts early 2027**, and there is a **priority window of October 12 to November 1** where applications are reviewed fastest |

> ### Hub71 states the founder's rule in its own words, which is the strongest possible confirmation of it
>
> *"Applications do not close after the deadline: if you apply after the mentioned deadline related to a cohort, you will be considered for the next cohort."*
>
> **A deadline on that page is a sorting key, not a door.** It decides which cohort reads you, not whether anyone does. Every date on this board should be read that way until its own page says otherwise.

---

## ⚪ Closed, confirmed on the page

| Programme | The page's own wording |
| --- | --- |
| **Entrepreneur First London (Fall)** | **"Applications for this program have now closed."** The board's `P0 - now` flag on a 2026-08-04 deadline is stale, but the skip itself is correct |

**One programme out of everything checked so far is provably shut.** That ratio is the argument for the rule.

---

## 🚨 Station F: three entries in our tracker are contradicted by Station F's own programmes page

`stationf.co/programs` currently lists **every one of these with a live application link**:

| Programme | Our tracker says | Station F lists it as |
| --- | --- | --- |
| **Cisco** | ❌ *"closed 2026-06-26, the most painful near-miss in the research"* | Live, and described as *"Program by the global leader in secure AI infrastructure to support the growth of startups in the **Agentic AI revolution**"* |
| **Microsoft** | ❌ *"closed Dec 2025, and requires a French company"* | Live — *"The GenAI startup accelerator, in partnership with GitHub, Mistral, Nvidia"* |
| **Founders Program** | ❌ Skipped, `Skip - solo blocked` | Live, with an application link |

**Also live and never on our board at all:** **F/ai** (*"The place to build AI"*) and **Meta** (*"empower European open-source AI startups, in partnership with Hugging Face"*).

**The Cisco one hurts, because it is the closest thematic match on the entire board** and we recorded it as a near-miss rather than checking it again.

> **Do not upgrade these to OPEN yet.** An index page carrying an application link is evidence the programme is not dead; it is not evidence the form accepts a submission. **Each needs its own apply page opened**, which is queued. The correction here is that the question was closed and should not have been — **`stationf.co/programs` states no deadline, no solo-founder restriction, and no French-entity requirement anywhere on it.**

---

## 🟡 Could not be resolved from the page, and needs another route

| Programme | What stopped the check |
| --- | --- |
| **Sequoia Arc** | The apply page renders with **no form and no application text at all**. This is now the **second independent confirmation** — the repo recorded the same on 2026-08-13. The board row still reads `Drafting · P0 · deadline 2026-08-17` and is **wrong** |
| **Neo** | `neo.com/accelerator` returns a heading and an image placeholder, nothing else |
| **Alchemist** | Navigation and an Apply Now button only; the real form sits behind it |
| **Techstars** | The accelerator index carries **no deadline for any programme**. Each vertical needs its own page, and the board's blanket *"synchronised deadline passed"* rests on nothing readable |

**None of these is a skip.** Three are a fetch away and one may need the founder to open a page a crawler cannot.

---

## What this changes for Gate 2

**The board's `Skip` and `Closed` columns cannot be trusted as inputs.** Of the entries tested against their own pages, one held and five did not. Ranking against them would have quietly removed a live agentic-AI programme at Station F, a Gulf programme whose only real condition is a relocation the founder has already said yes to, and a residency whose form is open right now.

Every row that reaches Gate 2 carries `page_state` from its own page, or it is marked **UNKNOWN** and brought to the founder for access. **No row reaches a tier on the strength of a date.**
