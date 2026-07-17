# Frontier voices & launch-content corpus — agents, the human minimum, pricing, and the unsolved layer

> _Created: 2026-07-10 · Method: WebSearch shortlist (2025 → Jul 2026) → YouTube transcript pulls via `youtube-transcript-api` (9 transcripts, ~90K words) → python keyword-context extraction → WebFetch of published transcripts and launch posts (dwarkesh.com, lexfridman.com, blog.samaltman.com, anthropic.com, claude.com). Every quote is dated and attributed to speaker + venue. Transcript-verified items are marked **[T]**; page-level items are marked [P]._
>
> **How to use this doc.** This is the frontier-lab / frontier-operator half of the launch evidence base: what agents can now do end-to-end, what the human's remaining job is, how agentic products are priced, and which layer above execution every one of these voices leaves unsolved. It extends [`pm-voice-and-ai-tooling-research.md`](./pm-voice-and-ai-tooling-research.md) §14 (Amodei, Masad — already mined there, NOT repeated here) and §15's frontier-corpus queue, and extends Brief 2 of [`2026-07-10-launch-research-briefs.md`](./2026-07-10-launch-research-briefs.md) (frontier-agent UX patterns) with keynote-level verbatim quotes and feature-level launch facts. Meng To is fully covered in the sibling doc §13 and not repeated.
>
> **Citation-integrity rule (inherited from the sibling doc §12.4):** cite artifacts, launches, and named-company facts — never influencer authority. Everything below is a launch fact, a first-party blog sentence, or a transcript quote. ASR transcripts (YouTube auto-captions) are quoted with light cleanup of transcription garble only; bracketed fixes are marked.

---

## 1. Sam Altman — the agent-era timeline, in his own blog [P]

**Speaker/launch:** Sam Altman (OpenAI CEO), personal blog. **Dates:** "Reflections" 2025-01-05; "The Gentle Singularity" 2025-06-10. **Sources:** blog.samaltman.com/reflections · blog.samaltman.com/the-gentle-singularity (both WebFetch-verified 2026-07-10).

- (2025-01-05) "We believe that, in 2025, we may see the first AI agents 'join the workforce' and materially change the output of companies."
- (2025-01-05) "We are now confident we know how to build AGI as we have traditionally understood it."
- (2025-06-10) "2025 has seen the arrival of agents that can do real cognitive work; writing computer code will never be the same."
- (2025-06-10) "2026 will likely see the arrival of systems that can figure out novel insights. 2027 may see the arrival of robots that can do tasks in the real world."
- (2025-06-10) "The ability for one person to get much more done in 2030 than they could in 2020 will be a striking change."
- (2025-06-10) On the human side: "we are hard-wired to care about other people and what they think and do."

**Read for Supaprod:** the lab CEO's own calendar says execution agents arrived in 2025 and one-person leverage is the 2030 headline — the leverage layer (deciding what the agents do, remembering what worked) is exactly the part his timeline never names a product for.

---

## 2. OpenAI — ChatGPT agent launch (the general-purpose end-to-end bar) [P]

**Launch:** ChatGPT agent, 2025-07-17. **Sources:** openai.com/index/introducing-chatgpt-agent (403s to fetchers; facts via the launch post as indexed + x.com/openai status 1945904743148323285 + TechCrunch/VentureBeat 2025-07-17).

- Launch line, verbatim from OpenAI's announcement post on X (2025-07-17): "ChatGPT can now do work for you using its own computer. Introducing ChatGPT agent—a unified agentic system combining Operator's action-taking remote browser, deep research's web synthesis, and ChatGPT's conversational strengths."
- Example tasks OpenAI itself lists: "look at my calendar and brief me on upcoming client meetings based on recent news," "plan and buy ingredients to make Japanese breakfast for four," "analyze three competitors and create a slide deck."
- Toolbelt shipped: a visual browser, a text browser, a terminal, and direct API access — on a cloud VM per task.
- The human-control contract, per the launch post: "ChatGPT requests permission before taking actions of consequence, and you can easily interrupt, take over the browser, or stop tasks at any point."
- What it obsoletes: Operator and standalone deep research (merged into one agent). What it leaves open: nothing in the launch learns from whether the slide deck was any good — every task starts from zero.

**Read for Supaprod:** the July-2025 consumer bar for "agent" is already multi-hour, multi-tool, artifact-producing work with consequence-gated permissions — Supaprod's differentiation cannot be "it executes"; it is that execution lands in a decision-and-outcome record.

---

## 3. OpenAI DevDay 2025 — Altman keynote (AgentKit, Codex GA, apps in ChatGPT) **[T]**

**Speaker/launch:** Sam Altman + team, DevDay keynote, San Francisco, 2025-10-06. **Source:** official keynote video (YouTube `hS1YqcewH0c`), full transcript pulled 2026-07-10. Quotes are from the ASR transcript.

- Altman on the state of agents (2025-10-06): "AI has moved from systems you ask, to systems that can do a lot of things for you. We're starting to see this through agents, software that can take on tasks with context, tools, and trust. But for all the excitement around agents, **very few actually make it into production.**"
- AgentKit launch: "everything you need to build, deploy, and optimize agentic workflows" — a visual Agent Builder, ChatKit, evals, connectors; an OpenAI engineer built and shipped a working agent live on stage in under 8 minutes.
- Codex GA + the internal proof: "Almost all new code written at OpenAI today is from Codex users. Our engineers that use Codex complete 70% more pull requests each week. And nearly every OpenAI PR goes through a Codex review." Daily Codex messages up 10x since early August 2025.
- Long-horizon execution, from the live demo (Romain): "Codex is becoming harder and harder to demo … because it can truly work tirelessly on your tasks: **I've seen it work for more than 7 hours straight on big refactorings. And get it right.**"
- The Albertsons AgentKit example is decision-support shaped: sales down 32% on ice cream → "the agent looks at the full context — seasonality, historical trends, external factors — and gives a recommendation." (A recommendation engine with no memory of whether past recommendations worked.)
- Altman's close: "Software used to take months or years to build. You saw today. It takes minutes now. And to build with AI you don't need a huge team. You don't need a bunch of infrastructure. **You just need a good idea.**"
- Trust as the named blocker in the AgentKit demo: "One of the most important things when building agents is trust, and guardrails help you have that confidence."

**Read for Supaprod:** OpenAI's own keynote concedes the two seams Supaprod lives in — most agents never reach production (trust), and when software takes minutes, the scarce input is "a good idea" (deciding what to build); neither AgentKit nor Codex records whether the idea was right.

---

## 4. OpenAI Frontier — agents managed like employees (the enterprise layer above execution) [P]

**Launch:** OpenAI Frontier enterprise agent platform, 2026-02-05. **Sources:** openai.com/index/introducing-openai-frontier (403s to fetchers) via TechCrunch 2026-02-05 (WebFetch-verified) + CNBC/Axios 2026-02-05.

- What it is: "an end-to-end platform designed for enterprises to build and manage AI agents … an open platform, which means users can manage agents built outside of OpenAI too." (TechCrunch, 2026-02-05)
- The employee frame, verbatim: "Frontier was designed to work the same way companies manage human employees. Frontier offers an onboarding process for agents and **a feedback loop that is meant to help them improve over time the same way a review might help an employee.**"
- The context claim: Frontier builds "a semantic layer for the enterprise" — shared business context (data warehouses, CRM, ticketing, internal apps) that all AI coworkers reference (per OpenAI's launch material as reported).
- Named launch customers: HP, Oracle, State Farm, Uber. Pricing: undisclosed — "OpenAI declined to comment on pricing." Availability: limited, GA "in the coming months."
- What it leaves open: the feedback loop described is per-agent performance tuning; nothing published describes learning across an org's _decisions_ (which bets were right), only across agent _behavior_ (did the task complete).

**Read for Supaprod:** the largest lab now sells "manage agents like employees" — validating the fleet-governance layer — but its memory is task-level, not decision-level; "which of our product bets worked" remains unowned, and Frontier's undisclosed pricing shows even OpenAI hasn't solved packaging for this layer.

---

## 5. OpenAI GPT-5.6 + ChatGPT Work — artifacts out, not chat (this week's bar) [P]

**Launch:** GPT-5.6 family (Sol / Terra / Luna) previewed 2026-06-26 behind a US-government safety review for ~20 partners; public GA + ChatGPT Work launch 2026-07-09 (yesterday). **Sources:** openai.com/index/previewing-gpt-5-6-sol · Axios 2026-07-09 · 9to5mac 2026-07-09 · digitalapplied.com ChatGPT Work guide (WebFetch-verified).

- ChatGPT Work's job description: it "gathers information across your connected apps and workflows, breaks the job into smaller steps, and completes them independently — staying with complex projects for hours," delivering "finished sheets, slides, docs, and shareable web apps."
- The product split OpenAI now draws: regular ChatGPT is "questions, drafts, conversation"; ChatGPT Work is "artifacts out" — it "can navigate ambiguity, adapt as work unfolds, and deliver polished outputs with less prompting."
- Sol is "built for frontier reasoning and long-horizon agentic work"; an "ultra mode" fans out subagents on complex work (9to5mac, 2026-07-09).
- Dogfood fact: "Nearly 100% of teams inside OpenAI, including finance and sales, now use ChatGPT Work and Codex." Codex merged into the ChatGPT desktop app, "available on every plan including Free."
- Pricing shape: "ChatGPT Work follows the same usage structure as Codex" — metered usage, no per-task price published.
- Also this cycle: government pre-review gating a frontier launch (2026-06-26) — the second such event in a month (see item 8).

**Read for Supaprod:** as of this week, finished-artifact agentic work is a default feature of a $0 consumer plan — Supaprod's PRD/build execution is officially commodity; the sellable object is the decision above the artifact and the record of what shipped and what it did.

---

## 6. Anthropic — Claude Sonnet 4.5 + Claude Agent SDK + Claude Code 2.0 [P]

**Launch:** 2025-09-29, coordinated triple release. **Sources:** anthropic.com/news/claude-sonnet-4-5 (WebFetch-verified) · claude.com/blog/building-agents-with-the-claude-agent-sdk (WebFetch-verified) · Axios/Fortune 2025-09-29.

- The autonomy claim: "Practically speaking, we've observed it maintaining focus for more than 30 hours on complex, multi-step tasks." (Up from ~7 hours on Opus 4 — Axios, 2025-09-29.)
- The Agent SDK pitch: "The Claude Agent SDK is the same infrastructure that powers Claude Code," applicable "for a very wide variety of tasks, not just coding." And the admission of where the hard problems were: "We've solved hard problems: **how agents should manage memory across long-running tasks, how to handle permission systems that balance autonomy with user control, and how to coordinate subagents working toward a shared goal.**"
- The canonical agent loop, from Anthropic's engineering post (2025-09-29): "gather context -> take action -> **verify work** -> repeat."
- On verification: "Agents that can check and improve their own output are fundamentally more reliable — they catch mistakes before they compound, self-correct when they drift, and get better as they iterate." And: "The best form of feedback is providing clearly defined rules for an output, then explaining which rules failed and why." LLM-as-judge is called out as "generally not a very robust method."
- Product furniture that shipped the same day: checkpoints ("roll back instantly to a previous state"), a context-editing feature and a memory tool so "agents run even longer."

**Read for Supaprod:** Anthropic's own doctrine says agent reliability = a verify step against explicit success rules — which is precisely what a decision layer can supply fleet-wide (the Outcome Contract), and what no per-task agent retains across tasks.

---

## 7. The context-standardization wave — Agent Skills + MCP to the Linux Foundation [P]

**Launches:** Agent Skills 2025-10-16 (open standard at agentskills.io on 2025-12-18); MCP donated to the new Agentic AI Foundation under the Linux Foundation 2025-12-09 (co-founded by Anthropic, Block, OpenAI; support from Google, Microsoft, AWS, Cloudflare, Bloomberg; `goose` and OpenAI's `AGENTS.md` are co-founding projects). **Sources:** anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills · anthropic.com/news/donating-the-model-context-protocol… · linuxfoundation.org press 2025-12-09 · siliconangle.com 2025-12-18.

- Skills definition: "organized folders of instructions, scripts, and resources that agents can discover and load dynamically" — launched across Claude.ai, Claude Code, the API, and the Agent SDK on day one; enterprise central management + partner skills (Canva, Notion, Figma, Atlassian) followed 2025-12-18.
- MCP's first-year scorecard: OpenAI adopted MCP across its Agents SDK, Responses API, and ChatGPT desktop in March 2025; by late 2025, 10,000+ active public MCP servers and adoption by ChatGPT, Cursor, Gemini, Microsoft Copilot, VS Code.
- The strategic read: within ~13 months, the _connector_ layer (MCP) and the _procedure/context_ layer (Skills, AGENTS.md) both became vendor-neutral open standards owned by a foundation.

**Read for Supaprod:** connectors and skills are now free commons — no moat can live there; what is NOT standardized anywhere is the decision-and-outcome record that flows through them, which is exactly the layer Supaprod claims (and BYO-standard compliance — MCP in, Skills-format context — is cheap credibility at launch).

---

## 8. Anthropic 2026 — Claude Cowork + Fable 5 / Mythos 5 (agents for everyone; models that keep notes) [P]

**Launches:** Claude Cowork research preview 2026-01-12, mobile/web expansion 2026-07-07 (three days ago); Claude Fable 5 + Mythos 5 launched 2026-06-09, US export-control takedown 2026-06-12, restored 2026-07-01. **Sources:** anthropic.com/news/claude-fable-5-mythos-5 (WebFetch-verified) · TechCrunch 2026-01-12 + 2026-07-07 · VentureBeat 2026-07 · CNBC 2026-06-09/2026-06-30 · Forbes 2026-06-16.

- Cowork's positioning, verbatim from coverage of the launch: "Claude Code for non-technical knowledge work" — assign a high-level goal, Claude handles "the execution, file management, and tool orchestration in the background."
- Cowork usage data Anthropic published with the July expansion: the largest task category is **business process operating at 33.4%** ("pulling scattered updates into a single report, building onboarding checklists, reconciling spreadsheets"), then content creation at 16.4% — i.e., the grunt-work half of PM/ops jobs, exactly.
- Fable 5 capability language: "Fable 5's capabilities exceed those of any model we've ever made generally available." Long-horizon: "**Fable 5 stays focused across millions of tokens in long-running tasks and improves its outputs using its own notes.**"
- Named-customer compression fact: "Stripe reported that Fable 5 compressed months of engineering into days."
- Mythos-class definition: "a tier of Claude models that sit above our Opus class in capability"; Mythos 5 deploys through Project Glasswing "in collaboration with the US government." Fable 5 pricing: $10/M input, $50/M output tokens.
- The governance shock: a reported jailbreak triggered a Commerce-Department takedown order on 2026-06-12 — three days after launch — with restoration on 2026-07-01. Frontier capability is now visibly subject to overnight regulatory removal.

**Read for Supaprod:** "improves its outputs using its own notes" is the model-level version of context-learning (Masad's doctrine, sibling doc §14) — but the notes die with the session/model; a BYOK product that owns the durable outcome ledger both survives model swaps AND survives a Fable-style overnight takedown, which is now a demonstrated, dated risk.

---

## 9. Michael Truell (Cursor) — "after code," taste, and the review bottleneck **[T]**

**Speaker:** Michael Truell, Anysphere/Cursor co-founder & CEO. **Venues:** Lenny's Podcast, 2025-05-01 (YouTube `En5cSXgGvZM`, transcript pulled 2026-07-10); Stratechery interview 2025-06-05 [P]; Cursor 2.0 launch 2025-10-29 [P]. Context: Cursor $300M ARR at recording; $2B ARR by Feb 2026 (Brief 1).

- (2025-05-01) "Our goal with Cursor is to invent a new type of programming, a very different way to build software. So a world kind of after code."
- (2025-05-01) "More and more being an engineer will start to feel like being a logic designer and really it will be about specifying your intent for how exactly you want everything to work … more about the what and a little bit less about the how."
- (2025-05-01) On the skill that appreciates: "I think taste will be increasingly more valuable … [and taste is] **having the right idea for what should be built.** And then it will become more and more about the effortless translation of here's exactly what you want built."
- (2025-05-01) The vibe-coding control problem: "you can create stuff, but a lot of it is the AI making decisions that … you don't have control over."
- (2025-05-01) On the actual working pattern: the most successful users are "chopping things up" — "specify a little bit, AI write something, review, specify a little bit, AI write something, review" — not one-shot delegation.
- (2025-05-01) The after-code artifact: "a representation of the logic of your software that does look more like English … you can edit that at a high level and it won't be the impenetrable millions of lines of code."
- Launch facts (2025-10-29, Cursor 2.0): first proprietary model (Composer, ~4x faster claim), up to 8 parallel agents on git worktrees/remote machines, native browser tool so agents "test their work and iterate," sandboxed terminals. The interface pivoted from file-editor to agent-manager.

**Read for Supaprod:** the fastest-growing execution vendor defines the future job as Supaprod's exact surface — English-level logic/spec editing plus taste ("the right idea for what should be built") — and his own product roadmap (2.0 agent-manager) shows execution vendors climbing toward it, without an outcome record.

---

## 10. Andrej Karpathy — the decade of agents, autonomy sliders, and the verification loop **[T]**

**Speaker:** Andrej Karpathy. **Venues:** YC AI Startup School keynote "Software Is Changing (Again)," delivered 2025-06-16/17 (sources differ on the day), published 2025-06-19 (YouTube `LCEmiRjPEtQ`, transcript pulled 2026-07-10); Dwarkesh Podcast, 2025-10-17 (dwarkesh.com transcript, WebFetch-verified).

- (2025-06-16) The human-AI division of labor: "we're now cooperating with AIs, and usually **they are doing the generation and we as humans are doing the verification. It is in our interest to make this loop go as fast as possible.**" GUIs matter because "looking at stuff" beats reading text for audit speed.
- (2025-06-16) The bottleneck admission: "it's not useful to me to get a diff of 10,000 lines of code to my repo. **I'm still the bottleneck**, right? Even though that 10,000 lines come out instantly."
- (2025-06-16) The product prescription: "**there should be an autonomy slider in your product. And you should be thinking about how you can slide that autonomy slider and make your product more autonomous over time.**" And: "it's less Iron Man robots and more Iron Man suits that you want to build … less building flashy demos of autonomous agents and more building partial autonomy products."
- (2025-06-16) The timeline correction: "when I see things like 'oh, 2025 is the year of agents' I get very concerned and I kind of feel like, you know, **this is the decade of agents** … We need humans in the loop. We need to do this carefully." (His Tesla analogy: a perfect self-driving demo in 2013, "here we are 12 years later and we are still working on autonomy.")
- (2025-06-16) Agents as a new consumer of software: "they're computers but they are humanlike … **people spirits on the internet** and they need to interact with our software infrastructure."
- (2025-10-17, Dwarkesh) The unsolved layer, named: "**They don't have continual learning. You can't just tell them something and they'll remember it.** They're cognitively lacking." And on timelines: "The problems are tractable, they're surmountable, but they're still difficult. If I just average it out, it just feels like a decade to me."
- (2025-10-17, Dwarkesh) On why outcome signal is precious: "You're sucking supervision through a straw … all this work that could be a minute of rollout, and you're sucking the bits of supervision of the final reward signal through a straw."

**Read for Supaprod:** the field's most-cited independent voice says the missing capability is continual memory, the human's job is verification, and the winning product shape is a partial-autonomy suit with a slider — Supaprod's outcome ledger + HITL trust arcs are that thesis productized, and "decade of agents" means the window stays open.

---

## 11. Satya Nadella / Microsoft — SaaS collapses into the agent layer; agents get an HR department [P]

**Speaker/launch:** Satya Nadella (Microsoft CEO). **Venues:** BG2 podcast with Brad Gerstner & Bill Gurley, 2024-12-12 (flagged: weeks before the 2025 window — included as the quote that framed the agent-era debate); Build 2025 keynote, 2025-05-19; Ignite 2025 (Agent 365), 2025-11-18. **Sources:** BG2 episode + windowscentral/cloudwars coverage · Build 2025 keynote transcript PDF · microsoft.com Ignite 2025 Book of News + Constellation Research 2025-11-18.

- (2024-12-12, BG2) The collapse quote: "the notion that business applications exist — that's probably where they'll all collapse, right, in the agent era. Because if you think about it, they are essentially CRUD databases with a bunch of business logic." Plus the usage jab: "We license all these SaaS applications, we hardly use them, and somebody in the organization is sort of inputting data into it."
- (2025-05-19, Build) "Here we are in 2025, building out this **open agentic web** at scale" — moving "from few apps with vertically integrated stacks to more of a platform."
- (2025-11-18, Ignite) Agent 365 launch: a "control plane" that "treats AI agents as digital employees" — a complete registry of every agent in the org "including 'shadow agents' that employees created on their own," risk-based access controls "just like employees," integrated with Defender/Entra/Purview. Early access via the Microsoft Frontier program; GA expected 2026.
- Launch fact for scale: Ignite 2025's frame was the "Frontier Firm" — agents as first-class org members with identity (Entra Agent ID), monitoring, and impact measurement.

**Read for Supaprod:** the largest software company's CEO predicts app logic migrates to the agent tier (the tier Supaprod occupies), and its 2025 answer is agent HR — identity, registry, permissions — with decision quality and outcome memory conspicuously absent from the control plane.

---

## 12. Demis Hassabis / Google DeepMind — agents as a practice run; what's still missing [P]

**Speaker:** Demis Hassabis (Google DeepMind CEO). **Venues:** Google I/O 2025 (2025-05-20, Project Mariner/agent mode); Lex Fridman #475, 2025-07-23 (lexfridman.com transcript, WebFetch-verified); Axios interview around I/O 2026, 2026-05-26. Flag: several 2026 quotes are via Axios/Fast Company reporting, not a full transcript.

- (2025-05-20, I/O) Launch fact: Project Mariner became "a system of agents that can complete up to ten different tasks at a time" — booking, buying, research in parallel — folded into Gemini's Agent Mode; Jules (async coding agent: submit 10 tasks, return to 10 PRs) went public beta the same week.
- (2025-07-23, Lex #475) AGI odds: "My estimate is sort of 50% chance … in the next five years, so by 2030 let's say." And on current systems' inability to invent: "Today's systems clearly can't do that. And we're not quite sure what that mechanism would be."
- (2025-07-23, Lex #475) On end-to-end autonomy: "One could imagine eventually doing that end to end … right now I think the systems are not good enough."
- (2026-05-26, Axios) "You can imagine the agentic era in this next year is a little bit like a practice run" — the next agent wave as "a societal stress test for far more powerful systems still to come."
- (2026-05-26, Axios) "We can see agents really happening now and imagine what they will be in another year, and how useful they'll be." And: "what we're seeing is soft self-improvement, in the sense of these coding agents are making engineers much more productive."

**Read for Supaprod:** DeepMind's chief calls this year a practice run and names invention/judgment as the unsolved mechanism — corroborating (with Karpathy) that the deliberate, human-governed decision layer is not a transitional UX but the durable seat while capability keeps rising underneath it.

---

## 13. Claire Vo — the one-person product loop, demoed **[T]**

**Speaker:** Claire Vo (ChatPRD founder, CPO, host of "How I AI" on Lenny's network — announced 2025-04-22, episode 1 guest Sahil Lavingia). **Venue for the transcript:** "From Idea to Product in 30 Min Using AI Agents (Full Tutorial)," Peter Yang's channel, 2025-05-18 (YouTube `ikyxK6i0AL0`, transcript pulled 2026-07-10). Extends the page-level capture in the sibling doc §13.5 with transcript-verified quotes. Competitor-datapoint flag: she founded ChatPRD (Brief 1).

- (2025-05-18) The "PM is dead" line, in her own words: "I say it's dead because I think **you're going to be in a world of pain if you're not prepared for a shift in the next 18 months.**"
- (2025-05-18) Why language becomes the PM interface: "If you look at something like Devin, it is a language-based interface. You are telling a system what to do. Your ability to clearly articulate what to do in a way that a system can appropriately [execute matters]."
- (2025-05-18) Handoff-aware artifacts: "a lot of how I use AI is I give it the context of what kind of team member it's going to go to next, **even if that team member is an AI** … 'This looks great. Write me a PRD I can send to my engineering team.'"
- (2025-05-18) The full demoed loop: user feedback signal in ChatPRD → PRD written in Slack → markdown export → Devin reads the PRD + repo, plans, opens a PR → she reviews. On review: "**Of course I review the PR … We don't deploy anything without review, including AI stuff. So we enforce approvals.**"
- (2025-05-18) Why Devin over an IDE for this: "It really is about the synchronous-asynchronous nature of how I can interact with the tool."
- (2025-05-18) The org-shape fact: ChatPRD runs on "one full-time, one part-time engineer … a part-time growth person … and a friend doing fractional enterprise sales" — a ~3.5-person company claiming 100K+ PM users (Brief 1).
- Her ChatPRD improvement loop is manual outcome capture: thumbs up/down ratings + A/B tests on models and prompts — "the way we tune and improve the core experience."

**Read for Supaprod:** the loudest AI-PM operator runs Supaprod's loop by hand across three disconnected tools (signal → PRD → autonomous PR → human approval) with no shared memory between them — her demo is the market's proof-of-demand, and its missing connective tissue (one outcome record across the loop) is the product.

---

## 14. "How I AI" operator episodes, 2026 — the agent-fleet workplace, firsthand **[T]**

**Show:** How I AI (Lenny's network). Three transcript-pulled episodes: **Steve Kaliski** (Stripe engineer), "Stripe's 'Minions': How AI agents write 1,300 PRs weekly," 2026-03-25 (`o5Mi5SYSDnY`); **JJ Englert** (Tenex), "I gave Claude Cowork my entire job," 2026-04-13 (`jwGQ9CrqVdA`); **Ankur Goyal** (Braintrust CEO), "Evals are the new PRD for AI products," 2026-06-15 (`QE_1hRLsehM`).

- (Kaliski, 2026-03-25) The headline fact: "At Stripe, we're landing about **1,300 PRs that have no human assistance besides review, per week.**" And personally: "I don't remember the last time I started work in the text editor."
- (Kaliski, 2026-03-25) Where work now begins: "it could be in a Google doc as we're planning a new feature, or maybe a [Jira] ticket comes in, or we're talking about something in Slack. **I can click an emoji and then the work begins — and often the work finishes too.**" (Minions are built on Block's open-source `goose` + internal MCP tools; his robots Slack channel now has 76 human observers.)
- (Kaliski, 2026-03-25, crediting LaunchDarkly's Zach) "What's good for the developer is good for the agent" — DX investment compounds into agent throughput.
- (Englert, 2026-04-13) The trust ramp, verbatim: "I'll say, '**Never send emails on my behalf. Only write them as drafts for me to review**' … it's actually never going to send anything for me because **I don't trust that yet.**"
- (Englert, 2026-04-13) The persona review board he builds live: "launch a series of sub-agents that have each their own persona … If you're a product manager, build it and put your boss in there, your engineering partner, and your customer, and say: every PRD, review from these three points of view and give me feedback."
- (Englert, 2026-04-13) Outcome feedback, hand-rolled: "I also feed it my past results of my newsletter … **if you don't tell AI what success is to you, AI doesn't know what success is for you.**"
- (Goyal, 2026-06-15) The thesis quote: "Machine learning shifts the task of programming from being about the how to being about the what … **Evals are actually the modern version of a PRD** … you encode those user stories in a way that can be quantified … you let a model figure out the how and you are really focused on the what."
- (Goyal, 2026-06-15) Taste, operationalized: Braintrust encodes its CEO's design taste ("David") as an eval — "I run a ton of evals to quantitatively improve things … and then I go to David and ask him for a vibe check … once every few days." Host Claire Vo names the fear ("turning my own taste into a system … I'm functionally building my own replacement"); Goyal's counter: "We're able to have David's palette applied to more things. The quality bar we're able to hit is higher."

**Read for Supaprod:** working operators in 2026 already run emoji-triggered fleets, hand-written trust floors, persona review boards, and taste-as-evals — every one is a hand-rolled instance of a Supaprod primitive (dispatch, HITL floor, review agents, outcome contract), which is the same "the demand is proven, the product is missing" pattern as the sibling doc's §12.2.

---

## 15. The pricing & market layer — Bret Taylor (Sierra), a16z, Garry Tan (YC) **[T]**/[P]

**Speakers:** Bret Taylor (Sierra co-founder/CEO, OpenAI board chair), Cheeky Pint podcast with John Collison (Stripe), 2026-03-10 (YouTube `n4E4xNYCkYM`, transcript pulled 2026-07-10) · a16z podcast "AI Is Upending SaaS Pricing" (Martin Casado + Metronome CEO Scott Woody), 2025 · Garry Tan (YC CEO), X + Lightcone Podcast, 2025-03.

- (Taylor, 2026-03-10) The model, precisely: "We do outcomes-based pricing. For a customer service context, that means **if the AI agent resolves the case, no human intervention, there's a pre-negotiated rate for that. If we do have to escalate to a person, that's free.** For sales, it would be a sales commission."
- (Taylor, 2026-03-10) Why not usage: "**tokens are not correlated with value** … Outcomes-based is: what business outcome is this agent designed to produce, and did it produce it effectively? … As a company, reducing your token utilization for the same outcomes is your problem, not your customer's."
- (Taylor, 2026-03-10) The unit of the era: "**I think the atomic unit of productivity in AI is a process, not a person.**" And the caveat: outcome pricing "is not going to be possible for everything. You have to have a pragmatism … but you want people to be spring-loaded to be thinking that way."
- (Taylor, 2026-03-10) On team size: "can you actually give individuals with good taste more agency … the size of the team does not produce linearly greater outcomes."
- (a16z, 2025) The pricing-metric shift: in the AI era "value shifts to the _work_ the software performs on your behalf … the old value metric of 'users' is being replaced by '**output**'."
- (Tan, 2025-03-06, X) "For 25% of the Winter 2025 batch, 95% of lines of code are LLM generated. That's not a typo." On Lightcone: "The humans have to do the debugging, still … 'What is the code actually doing?'" And: "This isn't a fad … This is the dominant way to code, and if you are not doing it, you may just be left behind."

**Read for Supaprod:** the pricing consensus (seats → output → outcomes, hybrid floors) and the YC-batch facts both price _execution_; nobody yet prices _decision quality_ — Supaprod can charge a floor for the OS and meter the crisp countable object it uniquely produces: a closed decision loop with a recorded outcome.

---

## Synthesis — top 10 insights (each dated to its source)

1. **End-to-end execution is now table stakes at every altitude.** Consumer (ChatGPT agent, 2025-07-17), engineering (Codex 7-hour runs, 2025-10-06; Sonnet 4.5's 30-hour focus, 2025-09-29), org-scale (Stripe's 1,300 no-human PRs/week, 2026-03-25), and knowledge work (ChatGPT Work "artifacts out" on the free plan, 2026-07-09). Build capacity is no longer the constraint anywhere in the stack.
2. **Every voice locates the surviving human at the same two points: deciding what to build, and verifying what was built.** Karpathy's generation-vs-verification loop (2025-06-16), Truell's taste = "the right idea for what should be built" (2025-05-01), Altman's "you just need a good idea" (2025-10-06), Vo's enforced PR approvals (2025-05-18), Tan's "humans have to do the debugging" (2025-03).
3. **Continual learning is the admitted unsolved layer — on a decade clock.** Karpathy: "You can't just tell them something and they'll remember it … feels like a decade to me" (2025-10-17). Hassabis: invention's "mechanism" unknown (2025-07-23). Fable 5's in-task "own notes" (2026-06-09) die at session end. The layer Supaprod owns is officially open, and staying open.
4. **Production trust is the second admitted gap.** Altman on stage: "very few [agents] actually make it into production" (2025-10-06); AgentKit's headline feature was guardrails; ChatGPT agent's was consequence-gated permissions (2025-07-17). Trust surface = adoption surface.
5. **Agents-as-employees is now the enterprise consensus UX — but its memory is task-level, not decision-level.** OpenAI Frontier's onboarding + review loops (2026-02-05), Microsoft Agent 365's registry of "digital employees" incl. shadow agents (2025-11-18), Anthropic Cowork's "virtual teammate" (2026-01-12). None records whether the _bets_ the fleet executed were right.
6. **Pricing is migrating seats → usage → outcomes, with hybrid floors winning.** Taylor's resolved-case pricing and "tokens are not correlated with value" (2026-03-10); a16z's "users → output" (2025); ChatGPT Work metered like Codex (2026-07-09). Outcome pricing works exactly where the outcome is crisply countable.
7. **The context/connector layers standardized in ~13 months and are now free commons.** MCP → Linux Foundation AAIF (2025-12-09, with OpenAI + Block co-founding), Skills open standard (2025-12-18), AGENTS.md donated (2025-12-09). Differentiation above these layers only.
8. **The org shape is collapsing toward taste-dense micro-teams running fleets.** Vo's ~3.5-person company (2025-05-18), Taylor's "atomic unit is a process, not a person" (2026-03-10), 25% of YC W25 at 95% AI-written code (2025-03-06), "nearly 100% of teams inside OpenAI" on agentic tools (2026-07-09) — plus the Coinbase one-person-team memo already in the sibling doc (§12.3).
9. **Autonomy is granted on a slider and earned per action, never assumed.** Karpathy's autonomy-slider prescription (2025-06-16), ChatGPT agent's interrupt/take-over contract (2025-07-17), Englert's "draft, never send — I don't trust that yet" (2026-04-13), Vo's mandatory approvals (2025-05-18). Products that let users move the slider up over time match how trust actually forms.
10. **Success criteria are becoming machine-checkable artifacts — "evals are the new PRD."** Goyal (2026-06-15), Anthropic's verify-against-rules doctrine (2025-09-29), Englert's "if you don't tell AI what success is, AI doesn't know what success is for you" (2026-04-13). The spec and the scorecard are merging into one object.

---

## Product moves for Supaprod (ranked)

> Per the founder's course correction (2026-07-10): concrete, named changes to the offering, each traceable to a mined quote/launch fact, proposed as **deltas** against the existing canon (decision layer with outcome memory; HITL approval modes; BYOK runtime; BuildDriver seam; v12 Outcome Contract / trust arcs; v13 campaign). Consumers: the v13 build front, the demo script, pricing (G10), and the YC application.

1. **Ship the Outcome Contract as "the eval attached to every decision" — and let it move the ranking.** _(Feature sharpening, highest leverage.)_ Generate a machine-checkable success rule-set alongside every PRD/decision, verify against it on outcome day, and feed the result into the ranking (the RF-01 loop). This is Goyal's "evals are the new PRD … encode user stories in a way that can be quantified" (2026-06-15) plus Anthropic's own reliability doctrine — "clearly defined rules for an output, then explaining which rules failed and why" (2025-09-29). Delta: v12 names the Outcome Contract; the move is generating it _with_ the artifact, automatically, and demoing a failed rule re-ranking the queue.
2. **Make the per-agent autonomy slider a visible, user-movable control with an earned ramp.** _(Feature tweak + demo beat.)_ Karpathy's exact prescription: "there should be an autonomy slider in your product … make your product more autonomous over time" (2025-06-16); Englert shows the floor users actually set: "only write them as drafts … I don't trust that yet" (2026-04-13). Delta: Supaprod has approval modes (auto/confirm/review) per tool — surface them as one slider per agent with a track-record card ("47 approved runs, 0 reverts — relax to auto?"), user-relaxed, never vendor-relaxed. Rehearse it in the demo's failure moment (sibling doc §9.5).
3. **Build the "verification cockpit": one screen where every agent output lands as a visual, receipts-attached diff.** _(New feature candidate.)_ Karpathy: "they do the generation, we do the verification. It is in our interest to make this loop go as fast as possible … I'm still the bottleneck" (2025-06-16); Truell's users win by "specify a little bit, review, specify a little bit" (2025-05-01). Delta: Supaprod surfaces receipts per decision; the move is a single cross-agent review inbox optimized for seconds-to-verdict (GUI diffs, not text walls) — the human-minimum job, given its own front-door surface.
4. **Emoji/@-mention dispatch from Slack: a signal becomes a mission without opening Supaprod.** _(Feature candidate, extends v13 pattern 3.)_ Stripe's shipped state: "I can click an emoji and then the work begins — and often the work finishes too," 1,300 PRs/week (Kaliski, 2026-03-25); Codex shipped Slack integration at DevDay (2025-10-06). Delta: Supaprod ingests Slack as signal; the move is the reverse edge — react/mention → mission created, dispatched, and reported back in-thread, with the outcome record linked.
5. **Price as: workspace floor + metered "closed loops," never per-seat-only.** _(Pricing/packaging move for G10.)_ Taylor: "tokens are not correlated with value … what business outcome is this agent designed to produce and did it produce it effectively?" (2026-03-10); a16z: "'users' is being replaced by 'output'" (2025); ChatGPT Work ships usage-metered (2026-07-09). Supaprod's crisply countable unit is a **closed decision loop** (decision → dispatched build → merged/shipped → outcome recorded). Delta: adopt hybrid pricing with the meter on closed loops (and escalated-to-human loops free, mirroring Sierra's "escalation is free" trust signal), keeping seats only as the floor.
6. **Ship the "agent roster with performance reviews" in the Engine Room.** _(Feature candidate, positioning-grade.)_ OpenAI Frontier onboards agents and reviews them "the same way a review might help an employee" (2026-02-05); Agent 365 registers "digital employees" incl. shadow agents (2025-11-18). Delta: Supaprod's agents get identity + scope + outcome-linked track record (approve rate, revert rate, outcome hit rate) on one roster card — the enterprise-consensus UX, but graded on decision outcomes, which neither Microsoft nor OpenAI records. Demo line: "the agent org chart, with receipts."
7. **Productize the nightly retro agent: traces → reviewable playbook/ranking-policy PRs.** _(New-phase candidate, v12 G15 sharpening.)_ Fable 5 "improves its outputs using its own notes" (2026-06-09) — in-session only; Masad's nightly trace-reading agent (sibling §14) is the shipped precedent; Englert hand-feeds past results back ("if you don't tell AI what success is…", 2026-04-13). Delta: a scheduled Supaprod agent that reads the week's mission traces + outcomes and opens _reviewable_ changes to workspace context/policy — the self-improvement loop as an auditable artifact, not silent drift.
8. **Bundle a persona review board on every PRD/decision before the human gate.** _(Cheap feature tweak, high demo value.)_ Englert builds it by hand: "put your boss in there, your engineering partner, and your customer … every PRD, review from these three points of view" (2026-04-13); Devin's confidence-scored PRs (Brief 2) are the adjacent shipped pattern. Delta: three built-in critic agents (exec / engineering / customer-of-record) whose objections attach to the artifact as part of its receipt trail — directly answers the sibling doc's §9.1 accountability seam.
9. **Positioning line for launch: "The labs shipped the hands. Supaprod is the memory that decides."** _(Messaging move.)_ Grounded in the two admissions: Karpathy — "they don't have continual learning … you can't just tell them something and they'll remember it" (2025-10-17) — and Altman on stage — "very few [agents] actually make it into production" (2025-10-06). Copy variants for the YC app/demo: "Agents forget every win and repeat every mistake. Supaprod doesn't." The claim is defensible because both sentences are quoted, dated, and from the people shipping the agents.
10. **Declare agent-vendor neutrality as a named capability: any fleet, one outcome record.** _(Packaging/positioning move on the BuildDriver seam.)_ Nadella: business apps "all collapse … in the agent era" (2024-12-12); OpenAI Frontier is explicitly "an open platform … manage agents built outside of OpenAI too" (2026-02-05); MCP/Skills are now foundation-owned commons (2025-12-09/18). Delta: BD-1..6 already plans BYO build agents — the move is marketing it at launch as deprecation insurance ("your agents will change; your decision history shouldn't"), with MCP-in and Skills-format context compliance stated on the connect surface.

---

## Related

- [`pm-voice-and-ai-tooling-research.md`](./pm-voice-and-ai-tooling-research.md) — §14 (Amodei, Masad — mined there, deliberately not repeated here), §15 (the queue this doc executes), §12.4 (the citation-integrity rule this doc follows)
- [`2026-07-10-launch-research-briefs.md`](./2026-07-10-launch-research-briefs.md) — Brief 2 (frontier-agent UX patterns this doc deepens with quotes), Brief 1 (competitor grid), Brief 3 (pricing/market sizing the §15 item extends)
- [`competitive-landscape.md`](./competitive-landscape.md) — June-2026 market scan
- [`../strategy/moat.md`](../strategy/moat.md) · [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) · [`../strategy/v13-proof-campaign.md`](../strategy/v13-proof-campaign.md) — the canon the "Product moves" section proposes deltas against
