# Jev and Laya: the typed decision models, and what they change for us

> _Created: 2026-09-23 · Last updated: 2026-09-23_

**Part of the 2026-09-23 strategy reset.** The verdict that uses this file is
[`../strategy/strategy-reset-2026-09.md`](../strategy/strategy-reset-2026-09.md). The founder asked
that Jev be assessed **only after** a verdict on whether the current product should exist, and as a
possible enabler, never as a reason to keep the current direction. This file is the research; §5
is the assessment, written after the verdict.

Labels: **[FACT]** carries a source and date. **[INFERENCE]** is reasoning from facts.
**[SPECULATION]** is a guess and is marked as one.

---

## 1. What Jev is

- **[FACT]** Jev is a model from **TypeSafe AI**, which came out of stealth and released it on
  **2026-09-15**. Founder named in coverage: **Diogo Almeida**, a former OpenAI researcher who
  co-authored the 2022 RLHF paper; other coverage adds Erik Gafni and Sasha Sheng as co-founders.
  No funding figure was found in the coverage read.
  ([TechTarget](https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative),
  [Business Standard](https://www.business-standard.com/technology/artificial-intelligence/what-is-jev-inside-the-new-ai-model-built-to-make-software-decisions-126092200452_1.html))
- **[FACT]** It does not generate text. The caller supplies a **state** (text, JSON, messages) and a
  list of **typed questions**. Three question types: **choice** (pick from options you supply, with
  per-option probabilities), **score** (rate on ordered levels), and a yes/no probability type.
  Questions are evaluated in parallel, so adding questions barely changes latency. TypeSafe calls
  this class a **"System One"** model, trained with what it calls RLCD (reinforcement learning for
  calibrated decisions).
  ([LangChain](https://www.langchain.com/blog/building-a-harness-with-jev),
  [The Register, 2026-09-23](https://www.theregister.com/devops/2026/09/23/shut-up-and-calculate-jevs-new-ai-primitives-for-coders/5298431))
- **[FACT]** Price: **$0.042 per million input tokens, $0.00 per output token.** Latency reported
  around **150 ms**. Vendor claim: up to **~200x faster and ~400x cheaper** than comparable LLMs on
  classification tasks (Tom's Hardware headline: 193x and 445x).
  ([TechTarget](https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative),
  [Tom's Hardware](https://www.tomshardware.com/tech-industry/artificial-intelligence/typesafe-ais-jev-offers-an-alternative-to-llms-that-claims-to-be-193x-faster-and-445x-cheaper-system-one-type-model-is-bespoke-for-probabilistic-decision-making))
- **[FACT]** Adoption was immediate: Vercel reported **13% of paid AI Gateway users adopted it within
  24 hours**, twice any previous model launch. Vercel, Cloudflare and LangChain integrated it within
  days. ([TechTarget](https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative),
  [Forbes, 2026-09-19](https://www.forbes.com/sites/josipamajic/2026/09/19/jev-cuts-ai-decision-costs-100x-and-vercel-cloudflare-rushed-to-add-it/), headline only; the page returned 403)
- **[FACT]** Uses shown by LangChain: **model routing** (judge a request's difficulty and send it to a
  cheap or an expensive model) and **flagging risky tool calls before they execute**. Other uses in
  coverage: guardrails, agent evaluation, support-ticket triage, content filtering.
  ([LangChain](https://www.langchain.com/blog/building-a-harness-with-jev))
- **[FACT]** Limits, as stated: no open-ended reasoning or generation. Analyst Laurie Voss: it lacks
  "a thinking process that chews on a problem", results are **not deterministic across runs**, and
  "major model labs will release decision models very, very quickly".
  ([TechTarget](https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative))
  Karpathy, as quoted by The Register: Jev "revealed latent demand" for a "single-token LLM with low
  latency and acceptable intelligence".

## 2. What Laya is

- **[FACT]** **Laya** is an open-weight model from **Convai Innovations**, released **2026-09-18**,
  three days after Jev, under **Apache 2.0**. 421M parameters; the English checkpoint uses a
  ModernBERT-large backbone. Same contract as Jev: typed questions in, calibrated answers out.
  Multilingual across 45+ languages, with script detection that routes to the right checkpoint.
  Runs air-gapped. ([Flowtivity](https://flowtivity.ai/blog/laya-open-source-jev-alternative/),
  [Laya site](https://laya.convaiinnovations.com/))
- **[FACT]** Benchmarks, as reported by Flowtivity:

  | | Laya | Jev |
  | --- | --- | --- |
  | Latency | 32.8 ms on a T4 GPU | 236–276 ms |
  | Typed-decision accuracy | 0.766 fine-tuned · **0.362 zero-shot** | 0.727 |
  | Banking77 (77 labels) | **0.425** | **0.870** |
  | Cost | $0, self-hosted | $0.042 / M input tokens |
  | Context | 512 tokens (base English) | not stated |

- **[FACT]** Caveats from the same sources: Laya's headline 0.766 is from a checkpoint **fine-tuned on
  the benchmark's own training split**. Zero-shot it scores 0.362, **below the 0.461 you get by always
  guessing the most common class**. It degrades beyond about 20 options, because options share a
  192–256 token budget. Its English checkpoint scored 0.000 on Khmer at 0.952 confidence, which is
  why it has script routing. ([Flowtivity](https://flowtivity.ai/blog/laya-open-source-jev-alternative/),
  [DEV Community](https://dev.to/jamilxt/jev-vs-laya-the-same-ai-idea-one-closed-and-one-open-3c6e))
- **[FACT]** **The calibration numbers disagree between sources.** Flowtivity reports expected
  calibration error of 0.081 for Laya against 0.246 for Jev. Wavect reports 0.144 for Jev against
  0.213 for Laya. Different datasets and prompts; neither is a controlled comparison.
  ([Wavect](https://wavect.io/blog/laya-vs-jev-benchmark-ai-startup-moat/))
- **[INFERENCE]** Laya is not a better Jev. It is a cheaper, faster, self-hostable one that needs
  labelled examples and fine-tuning before it is useful, and it breaks on wide option sets. **For a
  regulated buyer that cannot send data to a hosted API, that is the right trade.** For everyone
  else, Jev out of the box is the better tool.

## 3. What the Jev-to-Laya gap says about moats

- **[FACT]** An open clone of the whole category arrived **three days** after the category was named.
- **[FACT]** Wavect's conclusion: *"A model lead is not a business moat."* What they list as durable:
  workflow ownership, permissioned feedback data, private evaluation datasets, customer access,
  reliable operations. *"Build the part customers would miss after the model becomes replaceable."*
  ([Wavect](https://wavect.io/blog/laya-vs-jev-benchmark-ai-startup-moat/))
- **[INFERENCE]** The same pattern that flattened wrappers in 2024–2025 now runs in days, not
  quarters. **Any company whose value is "we use Jev" is a feature with a half-life of a week.**
  That applies to us.

## 4. What it changes in the economics

- **[INFERENCE]** Jev prices a typed, calibrated check at roughly **a hundredth of an LLM-as-judge
  call**. Before, you could afford to check a *sample* of an agent's actions. At $0.042 per million
  tokens you can check **every** action, every tool call, every decision the agent makes, and keep
  the probability that came with it.
- **[INFERENCE]** **A calibrated probability is a forecast you can grade later.** Every Jev answer
  says "I am 83% sure this is X". When the outcome arrives, you can measure whether the 83% answers
  were right 83% of the time. That is exactly the outcomes analysis and back-testing that bank model
  risk management has required since 2011 (SR 11-7, now SR 26-2; see
  [`regulated-fs-agent-governance-2026-09.md`](./regulated-fs-agent-governance-2026-09.md)). It is
  also exactly the "forecast locked before the outcome, graded after" mechanism this repo built,
  which had no buyer in product management.
- **[INFERENCE]** Non-determinism across runs matters to an auditor. Any use in a regulated flow has
  to log the exact model version, input, questions and returned probabilities at decision time, so
  the decision can be replayed and defended. **The log is the product; the model is a part.**

## 5. The assessment, written after the verdict

The verdict in [`../strategy/strategy-reset-2026-09.md`](../strategy/strategy-reset-2026-09.md) is
reached without Jev. Jev is then tested against it.

| Question the brief asked | Answer |
| --- | --- |
| **What does it actually do?** | Typed classification, scoring and yes/no with calibrated probabilities, at about 150 ms and near-zero cost. No reasoning, no text. |
| **Does it make the current product more valuable?** | **No.** The current product's failures are no users, no finished run and no buyer. A cheaper classifier fixes none of them. |
| **Does it make the current product obsolete?** | Partly. Two things this repo spent effort on, routing between models and a critic seat that judges a bet, become a single cheap API call anyone can make. |
| **Does it enable a different product?** | **Yes, and it is the one the verdict points at.** Checking every agent action, not a sample, and keeping the calibrated probability so it can be graded against outcomes, is now affordable. The value is in the evidence record and the grading, not the check itself. |
| **Could competitors use it better?** | Anyone can use it, which is the point. Incumbents in model risk (ValidMind, IBM, SAS) can wire it in as easily as we can. **Only the record and the customer relationship are defensible.** |
| **Does it create a new startup opportunity by itself?** | **Not a defensible one.** "Jev for X" was cloned in three days. A lab decision model is predicted soon. Build on it as a replaceable part, behind our own interface, and treat Laya as the on-premises route for banks that cannot use a hosted API. |

**[INFERENCE] Rule for any future use:** Jev or Laya sits behind the same runtime chokepoint pattern
this repo already built (`src/lib/ai/runtime.server.ts`), so it can be swapped. What is kept,
versioned and defended is the decision record, not the model call.
