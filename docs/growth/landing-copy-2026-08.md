# Landing copy — the exact strings, 2026-08-10

> _Created: 2026-08-10 · Lane 0 · **Every string below is final.** Apply verbatim. Nothing here needs interpretation, which is what keeps applying it a mechanical change rather than a compositional one. Layout, hierarchy, type and motion are the UI/UX lane's entirely and are deliberately unspecified._
>
> **Why this file exists.** Lane 0 owns positioning but never writes `src/`. The UI lane owns `src/` presentation but is scoped off compositional landing work. Neither of us can complete a landing copy change alone, so the words live here and the application lives there. Canon behind every line: [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md).

---

## 1. The hero — three beats

Replaces the category-line opening. **The category line is not deleted; it is demoted** out of the first thing a stranger reads.

> **The half of the job that was doing the reps is going to agents.**
>
> **What doesn't compress: deciding what's worth doing, defining what good looks like, and catching when the system is confidently wrong.**
>
> **Supaprod runs those three.**

**Beat 2 is verbatim from a working product manager** (2026-06-27), and those three jobs are exactly stations 02 Decide, 03 Plan and 07 Learn. **Do not paraphrase it.** Its whole value is that it is the market's sentence, not ours.

**Felt-promise line, to sit under the beats:**

> **Less operator, more director.**

**Category line — keep, demote.** *"For product managers who ship with agents"* moves below the fold or into the page's own explanation of itself. It stays on `llms.txt`, `agents.txt` and the A2A card unchanged: an answer engine wants a precise categorical definition, a human hears a platform word.

**Under test as an alternative opener** (founder-approved to test, not to swap): *"There is no GitHub for product decisions."*

---

## 2. The moat line, wherever the page argues defensibility

> **Verdicts take weeks, so the record accrues in calendar time. What nobody can reconstruct afterwards is what you believed before the outcome landed — a forecast leaves no trace unless something wrote it down at the moment you decided. A competitor starting next year starts at zero, next year.**

Already live in `Receipts.tsx` and `brief.html` and correct. **Listed here so the two never drift**, and so any third surface uses the same words.

**Never say** *"the record cannot be backfilled"* — falsified. **"Starts at zero, next year" is correct and stays**: it is a claim about calendar accrual, which the evidence never touched.

---

## 3. Public-register substitutions — exact, with their in-product exceptions

Measured across 5,721,291 words of this market's own writing. Rate is per million.

| Replace on public surfaces | Rate | With | In-product? |
| --- | --- | --- | --- |
| receipt / receipts | 3.0 | **evidence** (50.9) · **history** (103.3) | ❌ dead in both registers — replace everywhere |
| ledger / "trust ledger" | 0.2 / **0** | **track record** | ❌ replace everywhere |
| audit trail | 0.2 | **history** | ✅ **KEEP in-product** — `AuditTag.tsx` is the proving case |
| unattended | 0.2 | **ran on its own** (12.4) · **overnight** (14.3) | ❌ dead in both registers |
| approve | 5.8 | **review** (232.1) | prefer "review" both places |
| first run | 0.2 | **get started** (42.1) | ❌ replace everywhere |

**Safe to use freely, all high-frequency in the market's own words:** *decisions* (562.8) · *review* (232.1) · *ready* (160.3) · *stuck* (95.8 — beats "blocked" 8×) · *judgment* (47.2, never "judgement") · *shipped* (36.2).

**Do not use `context` on the front.** It scores 243/M but almost always means the LLM context window here, so it reads as jargon to a buyer.

**The register rule in one line:** a stranger in the shop window hears "audit trail" as vendor noise; a user already inside the problem came looking for exactly that phrase.

---

## 4. Three claims that must not appear on any public surface

1. **No present-tense accumulated learning.** Not *"we learn from your corrections."* `agent_memory` holds zero `kind='outcome'` rows. **Say:** *"wired and proven, accrues on first real use."* ← this one is currently **false**, not merely off-register, so it outranks everything else on this page.
2. **No unbroken signal → shipped → learned chain.** It is broken in two places: Discover promotes 3 of 86 themes, and Build writes no changeset or deployment edges.
3. **No dogfooding-as-demand.** *"I am my own first user"* is banned (founder, 2026-08-10) — a reader hears *if you are the customer, who pays you?* Dogfooding proves the product **functions**, never that anyone **wants** it.

---

## 5. Empty states

**Show a labelled worked example, never an empty counter.** *"Example"* is the highest-frequency term measured anywhere in this corpus — 4,073 occurrences, 712/M. Operators reason in examples.

The mechanism, from Linear's Nan Yu: buyers pay to **import an opinion** — *"you're not just adopting the actual software, you're adopting the idea that this is a practice you ought to be doing."* **An empty screen is the only moment where the product is pure opinion and zero data**, which makes it the moment the opinion *is* the product.

**Against empty counters specifically** — Crystal Widjaja: *"information that doesn't change what you do is entertainment."* A "0 decisions" tile changes nothing.

**Promise a sharpened call, never a handled one.** The market's own words: *"AI basically accelerates confusion"* if a team lacks clarity on decisions and ownership. And the survey's verbatim fear: *"I feel like I don't think hard enough anymore — I just follow Claude."* Any copy promising to take the judgment over sells the thing that is hurting them.

---

## 6. Sweep rules for whoever applies this

- **Grep the claim, not the phrase.** One assertion travels as: `backfilled` · `bolted on` · `bought` · `copied quickly` · `only accumulates with time` · `recovered after the fact` · `starts at zero`. The last is **correct** — flag for a re-read, do not replace.
- **Grep the character, not the encoding.** Em dashes hide as `&mdash;` `&ndash;` `&#8212;` `&#x2014;` `&#8211;`. A literal-character sweep missed three live instances tonight, one of which Lane 0 had introduced and twice declared clean.
- **Re-derive every number.** Live 2026-08-10: **4,872 commits, 508 migrations, eight weeks.** Repo docs said 4,000 / seven weeks.

## Related

- [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md) — the canon, with the evidence for every line above
- [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) §3 — the full measured vocabulary table
