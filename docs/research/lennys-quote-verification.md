# Lenny corpus — quote verification audit

> _Created: 2026-08-10 · Lane 0 · Method: every quote in [`podcast-corpus-lenny.md`](./podcast-corpus-lenny.md) checked against the official paid archive described in [`lennys-data-archive.md`](./lennys-data-archive.md)._

**Why this exists.** The 16 episodes in `podcast-corpus-lenny.md` were mined from **YouTube auto-captions (ASR)** before the paid archive was bought. Those quotes are cited downstream in the YC application, the one-pager and the positioning canon. On 2026-08-10 the official transcripts became available, so the quotes could be checked rather than trusted. **Two of them could not be.**

---

## Method, and one correction to it

1. Joined all 16 episodes to the archive **by guest surname** — the obvious join key, YouTube video ID, is unreliable (`index.json` carries a `youtube_url` for some files and the archive re-titles episodes, so Mosseri's episode failed a video-ID join despite being present).
2. Fuzzy-matched each quote against **its own** transcript, not the whole corpus — an ASR quote and an official transcript differ in punctuation and filler, so exact matching cannot distinguish *wording variance* from *content absent*.
3. Hand-verified every flag at source before recording it here.

**The first pass over-flagged and its output must not be reused.** It normalised text (stripping `…`) *before* splitting quotes on `…`, so every multi-part quote was tested as one impossible contiguous string. That produced false ABSENTs on quotes that are in fact verbatim correct — Shipper's "compounding engineering" and Ambrosino's "taste" among them. Corrected results are below. **The lesson is the same one this repo keeps relearning: a check that has never been proven to fail is not evidence.**

## Result

131 quotes across 16 episodes. The **majority verify** — Mosseri, Willison, Vo (OpenClaw), Husain/Shankar, Foody, Shipper ×2, Liu, Reganti/Badam, Cherny and Ambrosino are largely exact against official text. The ASR corpus was mostly honest.

**43 quotes (33%) cannot be corroborated**, in two classes.

### Class 1 — the episode is not in the archive (22 quotes)

| § | Episode | Note |
| --- | --- | --- |
| 6 | Maor Shlomo, Base44 | absent |
| 12 | Claire Vo, "How I AI" harness build | absent (`claire-vo.md` is her **2024-04-07** episode, a different conversation) |
| 13 | Ryan Nystrom, Notion spec-driven development | absent |

No official text exists to check against. These may be accurate; they are simply uncorroborated. **Do not cite them as verified.**

### Class 2 — the archive holds a DIFFERENT conversation under the right title and date (21 quotes)

**This is a defect in the paid archive, not in our mining.** Both files carry the correct title *and* the correct date, and a transcript of some other, earlier conversation with the same guest.

| § | File | Title / date | What the body actually contains |
| --- | --- | --- | --- |
| 11 | `podcasts/jason-m-lemkin.md` | "We replaced our sales team with 20 AI agents", 2026-01-01 ✓ | **"agents" appears zero times outside the frontmatter.** Body is classic B2B sales advice. "Amelia", "1.2 humans", the agent desk names appear **nowhere in any of the 679 documents.** |
| 5 | `podcasts/madhavan-ramanujam.md` | "Pricing your AI product… 400+ companies and 50 unicorns", 2025-07-27 ✓ | Zero "autonomy", zero "outcome-based", zero "labor budget", zero "quadrant", zero "two axes", zero Intercom/Fin. The single "attribution" hit is about **downturn negotiation tactics**, not the attribution × autonomy 2×2. |

Corpus-wide, the signature phrases — `high attribution and high autonomy`, `labor budgets are 10x`, `outcome-based pricing model`, `charge 25 to 50` — return **nothing**.

---

## The archive has a systematic mis-filing defect — register

What began as two isolated cases is a pattern. **Five files are confirmed to carry a correct title and date over a transcript of a different conversation**, found by five independent readers plus two detectors. It runs in **both directions**, so "the body is older than the title" is not the rule.

| File | Frontmatter says | Body actually is | Found by |
| --- | --- | --- | --- |
| `jason-m-lemkin.md` | "We replaced our sales team with 20 AI agents", 2026-01-01 | A B2B sales-advice conversation with no agent content | quote audit + independent reader + AI-density test |
| `madhavan-ramanujam.md` | "Pricing your AI product… 400+ companies", 2025-07-27 | A generic monetisation conversation; none of the AI-pricing frame | quote audit |
| `shreyas-doshi.md` | "4 questions… sooner", 2024-10-31 | The **earlier** Shreyas episode (five big ideas, pre-mortems, LNO) | independent reader |
| `brian-balfour.md` | "10 lessons on career, growth, and life", 2023-10-05 | A **later** episode — names Reforge Insights, Windsurf, Cursor, Krieger | independent reader + date probe |
| `wes-kao.md` | Communication frameworks, 2025-04-06 | An **earlier** episode — 2022 sponsor reads, zero AI terms | independent reader + AI-density test |

**Secondary integrity issues** (not mis-files, but they corrupt evidence):
- **Speaker labels are corrupted** in several long transcripts — guest monologues tagged `**Lenny Rachitsky**`. Attribute by content, never by label alone.
- **Compilation files** (`failure.md`, `interview-q-compilation.md`) are verbatim re-cuts of earlier episodes with corrupt `guest:` metadata. Counting them as independent corroboration **inflates evidence**.
- **Transcription errors create false keyword hits** — `ebi-atawodi.md` (2023-12-03) renders "generic user" as "agentic," which would falsely date the agent transition to 2023 for anyone grepping.

### Two detectors, and why neither is sufficient

- **Title/body term coherence** (218 podcasts scored; median 0.88). Catches Lemkin, Shreyas, Wes Kao. **Misses Ramanujam entirely** — both conversations are about pricing, so the title terms are present. Under-detects whenever the mis-filed episode shares the real one's topic.
- **AI-term density for 2025+ episodes** (median 4.5 per 1,000 words). Lemkin scores **0.4** for an episode titled about twenty AI agents — a decisive catch. But it cannot flag anything pre-2025 and legitimately-low-AI episodes score low too.

**Conclusion: the true defect rate cannot be bounded from metadata alone, and is very likely higher than five.** Treat the archive as a strong but unreliable source: **verify any transcript at the point of citation**, and never cite one whose body has not been read. The five above are the confirmed set, not the complete set.

**Worth reporting to the vendor** — the subscription is paid and this is a data-quality bug affecting at least five files.

---

## What this changes

### 1. A spliced claim reached the YC application and the one-pager

Both said: *"One PM directing 20 agents across a 4–6 person pod (Mosseri, 2026). The math: 1.2 humans + 20 agents = 10-human output (Lemkin, 2026)."*

Three defects, and **the third holds even if both transcripts were perfect**:

- **Mosseri never says "agents."** Verified verbatim: pods are *"four to six engineers"* plus *"one, we call product staff"* plus whatever specialist the work needs, giving *"a much smaller core, which is more on the order of six or seven."* He says "agents" **once** in the episode, never "fleet." He also partly credits team size over agent leverage: *"another part of it is just the small teams, I think, often are just more effective."*
- **The Lemkin arithmetic is uncorroborated** (Class 2 above).
- **It is a splice.** Instagram's **product-engineering** pod is fused with SaaStr's **sales/GTM** automation into an arithmetic **neither source states**, carrying both their names. Two different companies, two different functions, one invented sentence.

**Fixed.** [`../pitch/one-pager.md`](../pitch/one-pager.md) line 57 and a paste-ready replacement at §9c of [`../pitch/yc/fall-2026-application.md`](../pitch/yc/fall-2026-application.md). The corrected version uses Mosseri alone and is stronger: the mechanism becomes *accountability concentrating into one seat that has no system of record*, which needs no borrowed arithmetic.

### 2. The pricing canon rests on the weaker leg

[`../strategy/v11-guiding-star.md`](../strategy/v11-guiding-star.md) §11 and **Product Move #4 (repricing)** in `podcast-corpus-lenny.md` lean substantially on Ramanujam — the attribution × autonomy 2×2, "labor budgets are 10x", "charge 25–50% of value". **All of it is Class 2.**

This does not make the pricing direction wrong; independent corroboration exists elsewhere in the archive (Intercom Fin at 99¢/resolution is real and verified in the 2025-08→10 window). It means **Ramanujam must stop being the citation** until re-verified from the YouTube source.

## Quarantine list — do not cite as verified until re-sourced

- §5 Ramanujam (11 quotes) · §11 Lemkin (10 quotes) — Class 2, archive contradicts
- §6 Shlomo (7) · §12 Vo harness (7) · §13 Nystrom (8) — Class 1, no official text

**Everything else in `podcast-corpus-lenny.md` stands.** The 10-insight synthesis survives: insights 1, 3, 4, 6, 7, 8, 9 and 10 rest on verified episodes. Insight 5 (pricing) is Ramanujam-dependent and must be re-anchored. Insight 2 (the orchestrator seat) is Lemkin-dependent and must be re-anchored — [`../research/podcast-corpus-lenny.md`](./podcast-corpus-lenny.md) §11's "Amelia seat" argument is the affected passage.

## Re-verification, if wanted

Both Class 2 episodes have recorded YouTube IDs (`I-R1bc1rlFs`, `NR85H55eYkM`). Pulling those captions again would confirm whether the original ASR mining was accurate and the archive is simply mis-filed — the most likely explanation, since the ASR quotes are internally coherent and match the episode titles. That is a ~10-minute job and it would return 21 quotes to service.

## Related

- [`podcast-corpus-lenny.md`](./podcast-corpus-lenny.md) — the audited document
- [`lennys-data-archive.md`](./lennys-data-archive.md) — the archive, its licence, and MCP setup
- [`../pitch/yc/fall-2026-application.md`](../pitch/yc/fall-2026-application.md) §9c — the corrected field
