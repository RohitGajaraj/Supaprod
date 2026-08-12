# Claims audit — what we may and may not say, with evidence

> _Created: 2026-08-12 · Last updated: 2026-08-12 23:05_

**143 claims tested against the codebase on 2026-08-12. 43 were refuted.** This
applies to every outward surface — the site, the deck, accelerator applications,
sales calls, `llms.txt` — not just to a website.

It was produced by a dynamic workflow (8 agents: four grounding lanes, then
adversarial fact-checkers instructed to **refute** each claim). A claim survived
only if the agent could open the cited file and see the mechanism working end to
end. A mechanism with no writer, a column nothing populates, a doc describing an
intention, or a surface rendering seeded data all failed.

The website attempt that commissioned it was rejected the same evening
([`../design/archive/website-v3-enterprise-2026-08.md`](../design/archive/website-v3-enterprise-2026-08.md)).
**The audit outlived it and is the durable output.**

To re-derive: `Workflow({scriptPath: '<session>/workflows/scripts/supaprod-site-v3-research-wf_fe589774-da8.js'})`.
Anything below that carries a number should be requeried before it is published
again — a number without its query is not evidence.

---

## 0. The fact base every tense rule rests on

From [`../../README.md`](../../README.md):292-299, and the reason present-tense
learning claims are false:

- **8 users, all founder or internal. Zero organic external users.**
- **No revenue.** Billing is built and tested, deliberately switched off.
- **6 production workspaces, all founder or test. No customer data at all.**
- **18 missions · 5 decisions · 0 learnings.**

Build scale (1,440 source files · 79 authenticated routes · 462 migrations ·
402 test files) sits at `README.md`:296 — but `README.md`:280 **bans commit
counts and feature-register numbers in investor material.**

---

## 1. Live overclaims on production — fix these first

These are wrong on pages that exist today. Each is a copy or config fix, not a
redesign.

| Surface | The overclaim | Reality |
|---|---|---|
| `/subprocessors` | The meta description **promises data-residency disclosure** | `subprocessors.ts:38` declares `region?` optional and **zero assignments exist**, so `subprocessors.tsx:68` always renders empty. A CISO who reads the description then the list will notice. Either populate the field or cut the promise. |
| `llms.txt`, `agents.txt`, agent card | "10 read tools + 1 governed write tool" | Actually **11 read + 4 governed write**. These are machine-readable surfaces an agent follows literally: `get_ard` is listed, `outcome_history` is not, so an agent discovers ten of eleven capabilities. |
| `llms.txt`:93 | "row-level security on all **111** tables" | The generated types declare **170** tables. Stale by 59 — and RLS on the newer ones was *not* verified (that needs a `pg_policy` query, not a type count). Drop the number or run the SQL and record it. |
| `llms.txt`, `agents.txt` | "`?view=machine` works on **any** Supaprod URL" | Implemented on **exactly one route** (`index.tsx`), and it branches on a client hook — so a crawler that does not execute JS never sees markdown at any URL, including the landing page. |
| `index.tsx`:153 | `MACHINE_CONTENT` still ships **"The moat / The compounding, not the record"** | Retired 2026-08-10. The compounding record **is** backfillable; the forecast is the moat. |
| `/security`:40 | Stamped "July 10, 2026" | Predates the kill switch, boundary ledger and egress guard — it currently **undersells** the product by about a month. |
| `/demo` | Presented as a real workspace | **Seeded.** Its workspace is literally named "Sample sandbox", which is on the exclusion list `/proof` uses to keep seeded data out of the public score. Label it a sample workspace. |
| `/proof` | — | Correctly shows an **honest zero**; the query succeeded and nothing is scored. **Never write a sentence implying a calibration percentage exists.** The only usable claim is the meta one: we publish it live, including the zero. |

**No SSO, SAML or SCIM exists anywhere in `src`.** RBAC and approval lanes do
exist but are tier-gated to collaboration tiers. **No SOC 2 or ISO 27001** — and
`/security`:135 already says so plainly, which the fact-checkers flagged as the
**best credibility asset on the page**. Removing it to look bigger would be the
worst available edit.

---

## 2. Banned vocabulary — the DROP list

**The test:** *"The DROP list is not a frequency list. It is a list of words we
invented. Frequency was the detector, never the criterion."* Drop what we
invented; keep the industry's words; never let an industry word do the work of
making someone care. Rates are per million words of the market's own writing.

| Banned | Rate | Say instead |
|---|---|---|
| receipts / receipt / **receipted** | 3.0 | **evidence** (50.9) or **history** (103.3) — note "a receipted" → "an evidence-backed" |
| ledger / trust ledger | 0.2 / **zero in 5.72M words** | **track record** — a *naming* failure; rename every surface at once |
| unattended | 0.2 | **on their own / on its own** (12.4), **overnight** (14.3) |
| first run / time to first run | 0.2 | **get started / time to get started** (42.1) |
| provenance | 0.3 | **history** |
| decision layer | — | say what it does; if a noun is forced, "the decision record" |
| company brain | — | **shared brain**. "Company brain" is YC's phrase, quotable only with attribution — and `README.md`:280 bans YC mentions in generic material, so effectively unusable |
| **agentic-first / agent-first** | — | everywhere in our own voice. `X-first` is a category claim doing what "operating system" did |
| **"the agentic-first operating system for product teams"** | — | retired **everywhere**, including machine-readable surfaces |
| **operating system** (bare) | — | on the **Never** list for landing page, brief and listings. It survives as the *name of layer 02* inside the three-layer telling — not as the lead |
| remembers / stores / logs | — | banned **as verbs of the brain**, everywhere. They claim less than the product does and describe a database |
| "where the record lives", "searchable history", "it remembers your decisions", storage / archive | — | same reason |
| **context** (bare, on a marketing surface) | — | means the LLM context window and reads as jargon. "Context governance" and "context graph" are KEEP |

Two rules people misread constantly:

- **"agentic"** (the adjective) survives — it is the market's word, in 53 corpus
  documents — but is **never allowed in a hero, eyebrow, kicker, the
  50-character line, or cold outreach.** Gartner's 2026 Hype Cycle puts agentic
  AI at the Peak of Inflated Expectations, so a sceptical reader applies the
  discount before your second sentence. **The concrete noun "agents" is always
  safe.**
- **"audit trail"** is approved — but **never in a headline, hero, eyebrow, or
  anywhere it is trying to make someone care.** *"It names a control. Controls
  do not earn attention."*

**The register split is retired** (founder ruling 2026-08-11). Practitioner
language everywhere, in-product as well as public. The audit found the drift is
worst on public surfaces: 4 public files produced 31 changes; 305 in-product
surfaces produced 26.

---

## 3. Banned claims — falsified, not merely unfashionable

| Claim | Why it dies |
|---|---|
| "90–95% agentic" | Contradicted by everyone shipping agents. Say **graduated autonomy with gates** — what was built, and the empirically winning pattern |
| "the outcome ledger cannot be backfilled" | **The record was backfilled twice, on the record.** Only the *forecast* cannot be |
| "that compounding is the moat" | Retired 2026-08-10 for the same reason. **The forecast is the moat** |
| "the labs decline this vertical" | They could have built it; they could not do so securely across someone else's tools. Also: it is **one** lab on record (Krieger/Anthropic), not two |
| "single-suite incumbents cannot be neutral" | Absent from 5.9M words. The threat operators actually name is **DIY** |
| "legacy the day it ships" / inevitability language | The most credentialed post of its era called web3 "risky and inevitable" and pointed readers at FTX nine months before it collapsed |
| "Cursor for PMs" | Banned on any surface |
| the category **"decision intelligence"** | A real Gartner category whose Leaders (FICO, SAS, IBM, Quantexa, Aera) sell high-volume operational decisioning. Claiming the name starts a bake-off on throughput and latency we would lose |

**Banned structure, not just words:** the seven-station route diagram **as the
front door**. The stations predate agents at ~15 named companies, so they are a
commodity, and a heavily diagrammed staged lifecycle is **the visual signature
of SAFe, which this buyer is ripping out.** The approved picture is a *cycle
with two front doors* — Discover for genuinely new problems, Build → Learn for
anything cheap to test. Stations may be listed; not diagrammed as the hero.

---

## 4. Tense laws

1. **Never claim accumulated learning in the present tense.** The honest form:
   *the loop is wired and proven, and it begins accruing on first real use.*
2. **Never imply an unbroken signal → shipped → learned chain.** It is broken in
   two places: Discover promotes 3 of 86 themes, and Build writes zero changeset
   and zero deployment edges. Only **Discover → Decide → Learn** is real and
   demoable. *"Do not demo the full station walk on a real account."*
   **A film or animation showing one signal crossing all seven stations to a
   shipped outcome traverses precisely the broken region.**
3. **Never restore a count to the proof line.** "36 real learning → decision
   edges" was seed data — all 71 such edges are seeded, none have
   `seeded = false`. The proof is that the arrow **exists**, not how many.
   §5I's "Learn auto-settles 32% of outcomes" is in the same retracted
   measurement family: unverified for public use.
4. **The re-rank moment is not demoable on real data.** Of 119 learnings, 49
   carry a `new_ice` and 48 of those sit in a seeded workspace. Any copy or
   screenshot asserting "the record re-ranked your bets" is today only true of
   seeded data.

---

## 5. Traps

- **Superseded strings are still printed under a heading called "Positioning
  canon"** in `README.md`:272-275 — the 2026-07-22 tagline *"Agents that know
  what to build, ship it, and remember."*, its support line *"One agentic
  operating system, every call on the record."*, and the kicker
  `signal -> shipped -> remembered`. All three break multiple rules at once and
  are an easy trap for anyone skimming.
- **48 of ~80 `_authenticated.*` routes are pure redirects with no UI.** They
  are addresses, not screens; never name them as product surfaces.
- **`/trust` is a redirect to `/security`.** There is no separate trust centre
  to link to. If an evaluator needs one, it must be built.
- **There is no published public decision** to point at — `/d/$slug` works and
  is RLS-gated, but nothing is published, so there is no shareable URL yet.

---

## 6. The gap that lets all of this happen again

**No automated guard exists for any banned word.** `check-humanized.sh` and
`docs-doctor.sh` contain zero vocabulary checks, and there is no vocabulary
linter in `scripts/`. **A surface that breaks the law ships silently and green.**

The corollary is the good news: the sweep *has* already been applied to the live
public surfaces — `llms.txt`, `agents.txt` and the marketing routes return no
banned terms today. Remaining hits are in-product identifiers and code comments,
which `AGENTS.md`:225-230 puts explicitly out of scope.

**Recommended:** a `scripts/check-vocabulary.sh` over `public/` and the public
`src/routes/*.tsx`, wired into `docs:check`. `conventions/` requires a test when
code can violate a rule silently, *"or it is a suggestion"* — and this is the
worked example of a rule with no test.

---

## Related

- [`../design/archive/website-v3-enterprise-2026-08.md`](../design/archive/website-v3-enterprise-2026-08.md) — the rejected attempt that produced this
- [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md) — the canon, and the arbiter
- [`../growth/vocabulary-change-list-2026-08.md`](../growth/vocabulary-change-list-2026-08.md) — every exact string change
