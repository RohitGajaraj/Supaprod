# Vocabulary change list, August 2026

> _Created: 2026-08-11 - Lane 0. Founder ruling: practitioner language everywhere, in-product as well as public. Every replacement below is exact - apply verbatim._

---

## 1. Summary

Four auditors swept 458 user-visible surfaces across public crawler files, marketing routes, in-product components and the shared libraries, and returned **116 string changes across 47 files**. Two words carry 83 of the 116, which is 72 percent of the whole list: **ledger** and **trust ledger** account for 48 changes, **receipt** and **receipts** for 35. The rest is a long tail: **unattended** 12, **company brain** 10, **approve / approval** 8, **provenance** 3, **first run** 1, **decision layer** 1. Of the 116, **67 are certain** and can be applied verbatim without a decision, **32 are likely**, and **17 are judgment calls** where the mechanical swap produced bad English and the auditor chose a phrasing instead. The replacement side is dominated by four practitioner words: *evidence* (50.9 per million), *history* (103.3), *track record*, and *audit trail*, the last of which is on the KEEP list because a practitioner used it unprompted.

**Before you start, four couplings that break a page if applied half way:**

- **The /proof surface rename** spans `src/routes/proof.tsx` lines 32, 38, 46, 94 and `src/routes/updates.tsx` lines 50, 89. Lines 94 and 36 are certain, the rest are likely. Apply all six or the page names itself two different things across its tab title, its unfurl and its header.
- **`public/llms.txt` and `public/llms-full.txt` share five identical lines.** Apply both files in the same commit or the two crawler files disagree with each other.
- **`public/brief.html` lines 462 and 566** are both "company brain". Both or neither.
- **`src/lib/engine-room-glance.ts` line 983** holds two halves of one ternary, "ledger intact" and "ledger unverified". Both or neither.

**One companion edit outside the copy:** `src/components/landing/Receipts.test.ts:90` asserts `expect(CODE).toContain("Receipts,")`. It must become `"Evidence,"` in the same commit as `src/components/landing/Receipts.tsx:81` or the suite fails.

---

## 2. Certain changes

67 rows. Grouped by file. No decision required, apply the replacement exactly as written.

### Public and crawler surfaces

| File | Line | Current string | Replacement |
| --- | --- | --- | --- |
| `public/llms.txt` | 14 | `Seven stations that agents walk unattended, inside boundaries a human sets in advance.` | `Seven stations that agents walk on their own, inside boundaries a human sets in advance.` |
| `public/llms.txt` | 15 | `**The brain**: learns, and then guides.` | `**The shared brain**: learns, and then guides.` |
| `public/llms.txt` | 17 | `You cannot be the brain without owning the loop that generates the outcomes` | `You cannot be the shared brain without owning the loop that generates the outcomes` |
| `public/llms.txt` | 21 | `one route that agents walk unattended, inside boundaries a human sets in advance.` | `one route that agents walk on their own, inside boundaries a human sets in advance.` |
| `public/llms.txt` | 40 | `Paste a spec and get it argued against, with receipts.` | `Paste a spec and get it argued against, with evidence.` |
| `public/llms-full.txt` | 14 | `Seven stations that agents walk unattended, inside boundaries a human sets in advance.` | `Seven stations that agents walk on their own, inside boundaries a human sets in advance.` |
| `public/llms-full.txt` | 15 | `**The brain**: learns, and then guides.` | `**The shared brain**: learns, and then guides.` |
| `public/llms-full.txt` | 17 | `You cannot be the brain without owning the loop that generates the outcomes` | `You cannot be the shared brain without owning the loop that generates the outcomes` |
| `public/agents.txt` | 9 | `unattended, inside boundaries a human sets in advance.` | `on their own, inside boundaries a human sets in advance.` |
| `public/brief.html` | 462 | `03 · The brain` | `03 · The shared brain` |
| `public/brief.html` | 544 | `Here is the receipt` | `Here is the evidence` |
| `public/brief.html` | 566 | `The moat · the brain` | `The moat · the shared brain` |
| `public/brief.html` | 586 | `keep the receipts` | `keep the evidence` |

### Marketing routes

| File | Line | Current string | Replacement |
| --- | --- | --- | --- |
| `src/routes/index.tsx` | 85 | `"Supaprod is an AI product team for product managers: agents that discover, decide, build, and ship, governed by one human who gets the receipts.",` | `"Supaprod is an AI product team for product managers: agents that discover, decide, build, and ship, governed by one human who gets the evidence.",` |
| `src/routes/index.tsx` | 146 | `2. The operating system: runs the whole lifecycle. Seven stations agents walk unattended, inside boundaries a human sets in advance.` | `2. The operating system: runs the whole lifecycle. Seven stations agents walk on their own, inside boundaries a human sets in advance.` |
| `src/routes/index.tsx` | 147 | `3. The brain: learns, and then guides. Tells you what is right next time, and warns before you repeat what was wrong.` | `3. The shared brain: learns, and then guides. Tells you what is right next time, and warns before you repeat what was wrong.` |
| `src/routes/index.tsx` | 155 | `That loop runs unattended and is bounded:` (only this clause changes in the paragraph) | `That loop runs on its own and is bounded:` |
| `src/routes/index.tsx` | 158 | `- Trust ledger: /proof (publishes our calibration score live, including an honest zero until outcomes land)` | `- Track record: /proof (publishes our calibration score live, including an honest zero until outcomes land)` |
| `src/routes/demo.tsx` | 37 | `"Walk through a real teardown, a real decision ledger, and a real mission trace. No account needed.";` | `"Walk through a real teardown, a real decision history, and a real mission trace. No account needed.";` |
| `src/routes/demo.tsx` | 284 | `<Eyebrow>The ledger</Eyebrow>` | `<Eyebrow>The track record</Eyebrow>` |
| `src/routes/demo.tsx` | 324 | `<ArtifactLink href="/proof">The whole trust ledger, wins and misses</ArtifactLink>` | `<ArtifactLink href="/proof">The whole track record, wins and misses</ArtifactLink>` |
| `src/routes/demo.tsx` | 463 | `workspace: a real teardown, a real decision ledger, a real mission trace. You cannot` | `workspace: a real teardown, a real decision history, a real mission trace. You cannot` |
| `src/routes/product.tsx` | 20 | `"Discover signals, decide what matters, define specs, build with agents, ship to production, then learn from outcomes. All in one loop, all receipts.";` | `"Discover signals, decide what matters, define specs, build with agents, ship to production, then learn from outcomes. All in one loop, all evidence.";` |
| `src/routes/product.tsx` | 79 | `headline: "Agents that code with receipts",` | `headline: "Agents that code with evidence",` |
| `src/routes/product.tsx` | 80 | `body: "Specs compile to test plans. Agents write, debug, and merge PRs through your gates. CI is a receipt. Every line traces to the spec.",` | `body: "Specs compile to test plans. Agents write, debug, and merge PRs through your gates. CI is the evidence. Every line traces to the spec.",` |
| `src/routes/product.tsx` | 81 | `capabilities: ["SPEC COMPILATION", "AGENT BUILD LOOP", "CI RECEIPTS", "MERGE GATES"],` | `capabilities: ["SPEC COMPILATION", "AGENT BUILD LOOP", "CI EVIDENCE", "MERGE GATES"],` |
| `src/routes/product.tsx` | 99 | `imageAlt: "The Learn surface: outcome ledger and playbook generation",` | `imageAlt: "The Learn surface: outcome history and playbook generation",` |
| `src/routes/proof.tsx` | 36 | `"Supaprod's own calibration score and public decision receipts. Published, including the misses.",` | `"Supaprod's own calibration score and public decision history. Published, including the misses.",` |
| `src/routes/proof.tsx` | 94 | `the ledger` | `the track record` |
| `src/routes/p.teardown.tsx` | 135 | `"The Critic read your document but could not produce a receipt for it. Your text is still in the box. A longer spec, with the problem and the plan in it, usually gives it more to work with.",` | `"The Critic read your document but could not produce a teardown for it. Your text is still in the box. A longer spec, with the problem and the plan in it, usually gives it more to work with.",` |
| `src/routes/p.teardown.tsx` | 204 | `honest receipt, usually in under a minute.` | `honest teardown, usually in under a minute.` |
| `src/routes/p.teardown.tsx` | 405 | `Your text is sent once to Supaprod's Critic to write this receipt. Nothing is stored to an` | `Your text is sent once to Supaprod's Critic to write this teardown. Nothing is stored to an` |
| `src/routes/d.$slug.tsx` | 202 | `? "A later decision superseded this one, shown for honest provenance."` | `? "A later decision superseded this one, shown for honest history."` |
| `src/routes/_authenticated.admin.people.tsx` | 716 | `Recorded on the account and in the ledger.` | `Recorded on the account and in the audit trail.` |

### Landing components

| File | Line | Current string | Replacement |
| --- | --- | --- | --- |
| `src/components/landing/Receipts.tsx` | 81 | `Receipts,` | `Evidence,` |
| `src/components/landing/ThreeLayers.tsx` | 123 | `the brain` | `the shared brain` |

> `src/components/landing/Receipts.test.ts:90` asserts the old string. Update the ratchet in the same commit.

### In-product components

| File | Line | Current string | Replacement |
| --- | --- | --- | --- |
| `src/components/observe/AnalyticsPanel.tsx` | 233 | `Reading the AI event ledger.` | `Reading the AI event history.` |
| `src/components/observe/AnalyticsPanel.tsx` | 236 | `The event ledger did not load, so nothing here is a claim about what you spent.` | `The event history did not load, so nothing here is a claim about what you spent.` |
| `src/components/observe/AnalyticsPanel.tsx` | 367 | `Reading the agent ledger.` | `Reading the agent history.` |
| `src/components/observe/AnalyticsPanel.tsx` | 419 | `The outcome ledger did not load.` | `The outcome history did not load.` |
| `src/components/observe/AnalyticsPanel.tsx` | 424 | `Reading the outcome ledger.` | `Reading the outcome history.` |
| `src/components/observe/AnalyticsPanel.tsx` | 442 | `From the agent runs ledger, which counts only model calls tied to a run. It will not match the spend above, and that disagreement is real.` | `From the agent runs history, which counts only model calls tied to a run. It will not match the spend above, and that disagreement is real.` |
| `src/components/observe/AnalyticsPanel.tsx` | 507 | `Reading the AI event ledger.` | `Reading the AI event history.` |
| `src/components/observe/AnalyticsPanel.tsx` | 510 | `The event ledger did not load, so this is not a claim that no model ran.` | `The event history did not load, so this is not a claim that no model ran.` |
| `src/components/observe/AgentSpendDetail.tsx` | 234 | `from the per-call ledger, which counts every model call this one made whether or not a run was tied to it.` | `from the per-call history, which counts every model call this one made whether or not a run was tied to it.` |
| `src/components/observe/AgentSpendDetail.tsx` | 235 | `from the per-call ledger.` | `from the per-call history.` |
| `src/components/observe/AgentSpendDetail.tsx` | 351 | `and the per-call ledger is the authority on money.` | `and the per-call history is the authority on money.` |
| `src/components/observe/GauntletMetricsPanel.tsx` | 195 | `ran unattended,` | `ran on its own,` |
| `src/components/obsidian/build-status.ts` | 91 | `RUNNING UNATTENDED` | `RUNNING ON ITS OWN` |
| `src/components/supaprod/BriefDeck.tsx` | 236 | `You meet the result and its receipt, not the prompts,` | `You meet the result and its evidence, not the prompts,` |
| `src/components/supaprod/BriefDeck.tsx` | 245 | `The brain learns, then guides.` | `The shared brain learns, then guides.` |
| `src/components/connections/AccountConnectionsSection.tsx` | 1041 | `Connect it once and what it syncs starts feeding the brain.` | `Connect it once and what it syncs starts feeding the shared brain.` |
| `src/components/discover/OpportunityDetailSheet.tsx` | 1304 | `Challenge it and the teardown lands on the record, with its receipts attached.` | `Challenge it and the teardown lands on the record, with its evidence attached.` |
| `src/components/ship/WhatShipped.tsx` | 563 | `No test receipt. Nothing records which tests ran for this release, so this document does not claim any did.` | `No test evidence. Nothing records which tests ran for this release, so this document does not claim any did.` |
| `src/components/ship/WhatShipped.tsx` | 814 | `The receipts` | `The evidence` |

### Shared libraries

| File | Line | Current string | Replacement |
| --- | --- | --- | --- |
| `src/lib/palette-catalog.ts` | 21 | `Tear down a belief with receipts` | `Tear down a belief with evidence` |
| `src/lib/ask-suggestions.ts` | 41 | `Show me its receipts` | `Show me its evidence` |
| `src/lib/entitlements.ts` | 455 | `Receipts covering every member's runs, not only your own` | `Evidence covering every member's runs, not only your own` |
| `src/lib/stakeholder-update.ts` | 107 | `the loop ran ${auto}% of the work unattended` | `the loop ran ${auto}% of the work on its own` |
| `src/lib/stakeholder-update.ts` | 218 | `**Receipts**` | `**Evidence**` |
| `src/lib/consent-classes.ts` | 110 | `These never run unattended. You review and release each one.` | `These never run on their own. You review and release each one.` |
| `src/lib/autonomy-progression.ts` | 51 | `The loop now runs some reversible work unattended; the rest still comes to you.` | `The loop now runs some reversible work on its own; the rest still comes to you.` |
| `src/lib/a2a-card.ts` | 22 | `Seven stations (Discover, Decide, Plan, Design, Build, Ship, Learn) that agents walk unattended inside boundaries a human sets in advance.` | `Seven stations (Discover, Decide, Plan, Design, Build, Ship, Learn) that agents walk on their own inside boundaries a human sets in advance.` |
| `src/lib/mission-vocabulary.ts` | 147 | `putting the receipt on record` | `putting the evidence on record` |
| `src/lib/stakeholder-pack.ts` | 150 | `Provenance` | `Evidence` |
| `src/lib/stakeholder-pack.ts` | 175 | `Generated by Supaprod from this decision and its receipts.` | `Generated by Supaprod from this decision and its evidence.` |
| `src/lib/trust-chain.functions.ts` | 250 | `No receipt for this link - a gap in the chain.` | `No evidence for this link - a gap in the chain.` |

---

## 3. Judgment calls

49 rows: 32 marked **likely** by the auditor and 17 marked **judgment call**. Likely means the swap is right but the surrounding phrasing was rewritten slightly; judgment call means the mechanical swap produced bad English or tautology and the auditor picked a phrasing that a reasonable person could word differently. A human decides these.

### Public and crawler surfaces

| File | Line | Confidence | Current string | Replacement | Why it needs a decision |
| --- | --- | --- | --- | --- | --- |
| `public/llms.txt` | 7 | judgment call | `You remain in control: no irreversible action happens without your approval.` | `You remain in control: no irreversible action happens without your review.` | "approval" is the more precise word for a blocking gate. If the founder wants one exception to the approve rule, this sentence is the strongest candidate. Duplicated at `llms-full.txt:5`. |
| `public/llms.txt` | 26 | judgment call | `nothing merges, ships, or takes an irreversible outward action without an approval` | `nothing merges, ships, or takes an irreversible outward action without your review` | The indefinite article makes it read as a workflow object rather than a person. "your review" puts the human back in the sentence, but this is a gate claim, so the same caveat as line 7 applies. |
| `public/llms-full.txt` | 5 | judgment call | `You remain in control: no irreversible action happens without your approval.` | `You remain in control: no irreversible action happens without your review.` | Duplicate of `llms.txt:7`. Apply both together or the two crawler files disagree. |
| `public/llms-full.txt` | 26 | judgment call | `The merge gate stays human-controlled; irreversible actions require explicit approval` | `The merge gate stays human-controlled; irreversible actions require your explicit review` | Keeps the force of "explicit" while using the market word. Same gate-semantics caveat. |
| `public/llms-full.txt` | 104 | likely | `beliefs, supersession graph, learnings, and the Trust Ledger.` | `beliefs, supersession graph, learnings, and the track record.` | "trust ledger" measured zero times in 5.72M words. The landing footer already renamed this destination to "Track record" at `LandingFooter.tsx:59`, so this makes the crawler file match the shipped label. Capitalisation drops because it is no longer a proper noun. |
| `public/llms-full.txt` | 121 | likely | `Trust Ledger: Supaprod's own calibration score and decision receipts (public ones)` | `Track record: Supaprod's own calibration score and decision history (public ones)` | Two invented terms in one table cell. Sentence case kept because it is a cell heading, not a proper noun. |
| `public/brief.html` | 531 | likely | `The ledger is the compiler for judgment.` | `The track record is the compiler for judgment.` | The slide's thesis line. "judgment" is correct as spelled and stays. |
| `public/brief.html` | 539 | likely | `it spots the problem, proposes the fix, you approve, agents ship, and D+14 grades the call.` | `it spots the problem, proposes the fix, you decide, agents ship, and D+14 grades the call.` | The trace row six lines below already labels this exact beat "you decide", so the slide currently calls one moment two things. "decisions" is also the market's strongest word at 562.8 per million. |
| `public/brief.html` | 612 | likely | `The ledger becomes the org's institutional memory.` | `The track record becomes the org's institutional memory.` | "track record" is chosen over "audit trail" only because the same card already opens with "Governance and audit." and repeating "audit" reads badly. |
| `public/brief.html` | 652 | judgment call | `Governance is what enterprises pay for; the ledger is the audit trail.` | `Governance is what enterprises pay for; the audit trail is what they are buying.` | The mechanical swap ("the track record is the audit trail") is near tautology. This promotes the KEEP phrase to subject and drops the invented word. The second clause could be worded differently. |
| `public/brief.html` | 696 | likely | `the system is ours: the loop, the gates, the ledger.` | `the system is ours: the loop, the gates, the track record.` | Keeps the three-item rhythm. "gate" is on the KEEP list, so only the third item changes. |
| `public/brief.html` | 772 | likely | `No gates, no ledger, no accountability for what was built or why.` | `No gates, no track record, no accountability for what was built or why.` | Competitive table, Engines row. Triple-negative rhythm preserved; "gates" stays. |

### Landing components

| File | Line | Confidence | Current string | Replacement | Why it needs a decision |
| --- | --- | --- | --- | --- | --- |
| `src/components/landing/Receipts.tsx` | 98 | judgment call | `On the ledger` | `On the record` | Neither ruling option takes the preposition ("On the track record" is not English). "On the record" is the same register, is what the moat paragraph in this same file already says, and matches the footer's "Track record". |
| `src/components/landing/TrustClose.tsx` | 38 | likely | `Merge, revert, and delegate can never skip your approval.` | `Merge, revert, and delegate can never skip your review.` | The card's own label "Merge is always human" already carries the blocking-gate meaning. This is the one place on the landing page where "approval" is persuasive prose rather than a product noun. |

### Marketing routes

| File | Line | Confidence | Current string | Replacement | Why it needs a decision |
| --- | --- | --- | --- | --- | --- |
| `src/routes/proof.tsx` | 32 | likely | `{ title: "The Ledger · Supaprod" },` | `{ title: "The track record · Supaprod" },` | Renames the whole surface. Lines 32, 38, 46 and 94 must move together or the page names itself two things. |
| `src/routes/proof.tsx` | 38 | likely | `{ property: "og:title", content: "The Ledger" },` | `{ property: "og:title", content: "The track record" },` | Visible in every social and Slack unfurl of /proof. |
| `src/routes/proof.tsx` | 46 | likely | `{ name: "twitter:title", content: "The Ledger · Supaprod" },` | `{ name: "twitter:title", content: "The track record · Supaprod" },` | Visible in every X unfurl of /proof. |
| `src/routes/updates.tsx` | 50 | likely | `body: "The Ledger was computing its score partly from sample workspaces, which meant it was grading fixtures. It now counts real decisions in real workspaces only. That is why it currently shows an honest zero rather than a number, and it fills in as outcomes land.",` | `body: "The track record was computing its score partly from sample workspaces, which meant it was grading fixtures. It now counts real decisions in real workspaces only. That is why it currently shows an honest zero rather than a number, and it fills in as outcomes land.",` | Changelog entry referring to /proof by its invented name. Must move with `proof.tsx` or the two pages name the same thing differently. |
| `src/routes/updates.tsx` | 89 | likely | `title: "The Ledger",` | `title: "The track record",` | Same rename, changelog entry title. |
| `src/routes/product.tsx` | 65 | likely | `capabilities: ["ICE RANKING", "CRITIC TEARDOWN", "OUTCOME WEIGHTS", "PROOF LEDGER"],` | `capabilities: ["ICE RANKING", "CRITIC TEARDOWN", "OUTCOME WEIGHTS", "TRACK RECORD"],` | "TRACK RECORD" keeps the two-word shape of its three siblings, but it is a chip so length matters visually. |
| `src/routes/product.tsx` | 170 | likely | `grunt. You handle the gates. Ledger records both.` | `grunt. You handle the gates. The audit trail records both.` | "audit trail" is an explicit KEEP and is exactly the claim being made, but the sentence gains a word and this is tight sub-headline copy. |
| `src/routes/p.teardown.tsx` | 41 | likely | `"Paste a PRD or a product bet and get a sharp, honest, receipted teardown from Supaprod's Critic. No signup, no setup.",` | `"Paste a PRD or a product bet and get a sharp, honest, evidence-backed teardown from Supaprod's Critic. No signup, no setup.",` | "receipted" is an adjectival form of a word that is ours. "evidence-backed" carries the same claim in market language but is a coined compound. |
| `src/routes/p.teardown.tsx` | 192 | likely | `Paste a PRD. Get a receipted teardown.` | `Paste a PRD. Get an evidence-backed teardown.` | The h1 of /p/teardown. Note the article changes from "a" to "an". Should match line 41. |
| `src/routes/_authenticated.design.tsx` | 301 | likely | `Open this rule in the brand ledger` | `Open this rule in Brand settings` | Neither "history" nor "track record" fits an editable rule list, so this names the destination instead. It navigates to /settings?section=brand, whose visible label is "Brand" (`src/lib/settings-sections.ts:212`). |
| `src/routes/_authenticated.trust-ledger.tsx` | 20 | likely | `Ledger · Supaprod` | `Track record · Supaprod` | Browser tab title on the /trust-ledger redirect stub, still visible during the 301. Consider whether the route path itself should be renamed too, which is an IA change, not copy. |
| `src/routes/_authenticated.boundary.tsx` | 111 | judgment call | `Always yours to approve. This one cannot be handed over.` | `Always yours to review. This one cannot be handed over.` | The floor is literally named `review` in the data model, so this aligns copy with code. This is the only "approve" the auditor would change in-product; see section 4. |

### In-product components

| File | Line | Confidence | Current string | Replacement | Why it needs a decision |
| --- | --- | --- | --- | --- | --- |
| `src/components/observe/AgentSpendDetail.tsx` | 255 | likely | `Prompt and completion together, as the ledger recorded them.` | `Prompt and completion together, as they were recorded.` | "as the history recorded them" is clumsy. Dropping the noun keeps the fact and the sentence shape and avoids naming a thing the market does not say. |
| `src/components/public/TeardownReceipt.tsx` | 74 | likely | `Supaprod Critic teardown receipt` | `Supaprod Critic teardown` | aria-label, so screen-reader visible. The region is already fully named by "teardown", so dropping the word loses nothing rather than substituting a second noun. |
| `src/components/public/TeardownReceipt.tsx` | 87 | likely | `Supaprod Critic · receipt` | `Supaprod Critic · evidence` | Mono kicker above the verdict chip. Note the component filename still says Receipt; renaming the file is a separate call. |
| `src/components/product/IntentVsBuiltReceipt.tsx` | 39 | judgment call | `Could not build the receipt.` | `Could not build the comparison.` | "Could not build the evidence." is not English. The panel's own title is "Intent vs built", so "comparison" names the same object in a word practitioners use. |
| `src/components/product/IntentVsBuiltReceipt.tsx` | 53 | judgment call | `this receipt compares what shipped against the` | `this comparison checks what shipped against the` | "comparison compares" would stutter, so the verb moves to "checks". Must match the fix at line 39. |
| `src/components/learn/SettlePanel.tsx` | 733 | judgment call | `Weekly active users, support tickets, time to first run` | `Weekly active users, support tickets, time to get started` | This is the placeholder for "What you measured", so it teaches users our vocabulary at the moment they write their own metric name. "time to first run" is also a real industry metric name, which is why this is a call and not mechanical. |
| `src/components/settings/IntegrationsTab.tsx` | 320 | judgment call | `Read access, plus appending a decision that still waits for your approval.` | `Read access, plus appending a decision that still waits for your review.` | Prose, not an action button, so "review" substitutes cleanly without changing what the gate does. Still a gate description, so it inherits the approve caveat. |

### Shared libraries

| File | Line | Confidence | Current string | Replacement | Why it needs a decision |
| --- | --- | --- | --- | --- | --- |
| `src/lib/engine-room-glance.ts` | 284 | judgment call | `Ledger` | `Audit trail` | The technical sub-label under the tab name. "audit trail" is on the KEEP list and is exactly what the tab is, but it sits near the tab label "Paper trail". Alternative if the near-duplication bothers you: "Track record". |
| `src/lib/engine-room-glance.ts` | 286 | likely | `Every decision and action as a receipt, with its evidence, share controls, and the tamper seal.` | `Every decision and action on the record, with its evidence, share controls, and the tamper seal.` | "as evidence" would collide with "with its evidence" later in the same sentence, so "on the record" keeps it readable. |
| `src/lib/engine-room-glance.ts` | 965 | judgment call | `receipts sealed` | `records sealed` | Renders as a count ("1,204 receipts sealed"). "evidence sealed" does not pluralise as a count, so this drops the invented word and stays countable. |
| `src/lib/engine-room-glance.ts` | 983 | likely | `ledger intact` | `audit trail intact` | Half of the Record room verdict ternary. Must change with the other half below. |
| `src/lib/engine-room-glance.ts` | 983 | likely | `ledger unverified` | `audit trail unverified` | The other half of the same ternary. Both or the two states use different nouns. |
| `src/lib/trust-verify.ts` | 206 | judgment call | `the ledger content changed since the saved fingerprint` | `the record content changed since the saved fingerprint` | Its three sibling reasons on lines 182, 187 and 198 already say "a record was removed/added/altered since the saved fingerprint", so "record" keeps this consistent instead of introducing a fourth noun. |
| `src/lib/skills-export.functions.ts` | 59 | judgment call | `time from Settings - Export; this file is never the source of truth, the ledger is.` | `time from Settings - Export; this file is never the source of truth, the audit trail is.` | Preamble written into the exported Agent Context Bundle that users mount into Claude Code and Codex. "source of truth" is a KEEP phrase and stays; only "the ledger" changes. |
| `src/lib/deployments.functions.ts` | 1047 | likely | `The deploy is live, but no receipt for it reached the Trust Ledger (${reason}). This production deploy will not appear in the record of decided calls.` | `The deploy is live, but no evidence for it reached the audit trail (${reason}). This production deploy will not appear in the record of decided calls.` | Two invented terms in one sentence. The second sentence already says "the record of decided calls" and is left untouched. |
| `src/lib/mcp-protocol.ts` | 82 | likely | `each tagged with its provenance outcome (still stands vs superseded)` | `each tagged with its outcome history (still stands vs superseded)` | MCP `search_decisions` tool description, read by every external agent that connects. The word order inverts, so check it still reads for a model. |
| `src/lib/mcp-protocol.ts` | 235 | likely | `Record a decision on this workspace's ledger (governed write).` | `Record a decision in this workspace's audit trail (governed write).` | MCP `record_decision` tool description. The preposition shifts from "on" to "in" so the sentence still reads. The "approve" and "approved" occurrences later in the same string are deliberately untouched; see section 4. |
| `src/lib/ai/tools/registry.server.ts` | 3431 | likely | `(the rewind also lands on the Trust Ledger)` | `(the rewind also lands on the audit trail)` | Agent tool description for `prd.revise`, read by the model on every turn. |
| `src/lib/ai/tools/registry.server.ts` | 3508 | likely | `(the rewind also lands on the Trust Ledger)` | `(the rewind also lands on the audit trail)` | Same phrase in `decision.revise`. Identical substring to 3431 but a separate literal, so both must be edited. |
| `src/lib/ai/tools/registry.server.ts` | 4122 | likely | `attributes it to you so a rewind lands on the Trust Ledger` | `attributes it to you so a rewind lands on the audit trail` | `roadmap.move` description. Same invented surface name, different surrounding clause, so the exact string differs from 3431 and 3508. |
| `src/lib/ai/handoff.server.ts` | 818 | likely | `The mission this completion receipt was filed against` | `The mission this completion record was filed against` | Stored as the rationale on the mission to decision lineage edge, and those rationales render to users (`GraphTreeView.tsx:62`, `GraphForceCanvas.tsx:1032`, DecisionDetail). "evidence" reads wrong in this noun slot, so "record" carries the meaning. |
| `src/lib/onboarding/seed-workspace.server.ts` | 110 | judgment call | `The core focus is shipping the AI brief and decision layer before expanding to full agentic execution.` | `The core focus is shipping the AI brief and the decision record before expanding to full agentic execution.` | Seeded workspace memory that shows up in the Brain memory list as real content. "decision layer" is on the DROP list with the instruction to just say what it does; the thing being shipped is the decision record. |
| `src/lib/palette-catalog.ts` | 89 | judgment call | `Verify the Ledger integrity fingerprint` | `Verify the audit trail integrity fingerprint` | Command palette label. The entry navigates to the record room and "audit trail" names what the fingerprint covers, but the label gets longer in a narrow row. |

---

## 4. Do not change

Every item below was seen by an auditor and deliberately left alone. Do not let a global find-and-replace catch them.

**Anything where `approved` is a status, not a word.**

- The Approve buttons at `/approvals`, `/runs` and `/plan/spec` set a status of `approved`. They cannot become "Review" without breaking the verdict semantics. `_authenticated.boundary.tsx:111` is the only in-product "approve" any auditor would change, and only because that floor is already named `review` in the data model.
- `src/lib/mcp-protocol.ts:235`, the rest of the string: "Lands at status 'pending' for a human to approve; an agent never lands a decision already approved." These name the literal approval status, not a weak generic verb.
- "Approvals" wherever it names a route, a tab or a notification category. Renaming those is an information-architecture change, not a copy change, and needs its own decision.

**The merge-gate noun.**

- `src/routes/index.tsx:155`, trailing clause: "without a human approval". This is the governance term for the fixed floor, not the weak verb, and it stays even though the "unattended" earlier in the same paragraph changes.

**Words already on the KEEP list, sitting next to words that change.**

- "gate" and "gates" in `public/brief.html:696` and `:772`, in `src/routes/product.tsx:81` ("MERGE GATES") and `:170`.
- "source of truth" in `src/lib/skills-export.functions.ts:59`.
- "judgment" as spelled in `public/brief.html:531`. It is 47.2 per million and never "judgement".
- "review" in the second sentence of `src/lib/consent-classes.ts:110` ("You review and release each one.").
- "audit trail" anywhere it already appears.

**Sentences that already say the right thing.**

- `public/llms.txt:72` already describes the teardown surface as "with the evidence for and against attached". No change; line 40 is being brought into agreement with it.
- `src/components/landing/LandingFooter.tsx:59` already says "Track record". This is the shipped label the rest of the list is being aligned to.
- `src/lib/stakeholder-pack.ts`, board audience, already says "Evidence and governance". The eng-audience rename at line 150 does not collide with it.
- `src/lib/deployments.functions.ts:1047`, second sentence, already says "the record of decided calls".
- `src/lib/trust-verify.ts` lines 182, 187 and 198 already say "record". Line 206 is being brought into the set.

**Code, not copy.**

- The `{errText(unitQ.error)}` interpolation on `AnalyticsPanel.tsx:419` and the `${auto}` and `${reason}` interpolations elsewhere. Change the surrounding words only.
- File and component names: `TeardownReceipt.tsx`, `IntentVsBuiltReceipt.tsx`, `_authenticated.trust-ledger.tsx`. The strings inside them are in scope; renaming the files and the `/trust-ledger` route is a separate decision with redirect consequences.
- Database column and enum values: the `review` floor name, decision status `pending` and `approved`.

**One flagged that is not a copy fix at all.**

- `src/components/landing/Receipts.test.ts:90` is a test ratchet, not user-visible copy. It must be updated to `"Evidence,"` in the same commit as `Receipts.tsx:81`, or the suite fails.

---

## 5. Where the vocabulary drifted worst

| File | Changes | What that tells us |
| --- | --- | --- |
| `public/brief.html` | 10 | The investor brief is the single worst offender. It was written to sound proprietary, so it uses the invented vocabulary as if it were a moat: "ledger" five times, "company brain" twice. |
| `src/components/observe/AnalyticsPanel.tsx` | 8 | One component, one word. "ledger" appears in every loading and failure string, three of them literally duplicated. This is copy-paste drift, not a positioning problem, and it is the cheapest file on the list to fix. |
| `public/llms.txt` + `public/llms-full.txt` | 14 combined, 7 each | Treat these as one surface. They are the answer-engine surface and they duplicate five lines exactly, so drift here propagates to every model that reads us. Highest reach per line of any file in the list. |
| `src/routes/product.tsx` | 7 | The product page carries both dropped words at once, in headlines, body and the uppercase capability chips. |
| `src/lib/engine-room-glance.ts` | 5 | All five are judgment calls or likely, none certain. The Record room is where the invented vocabulary is most load-bearing, which is exactly why no swap there is mechanical. |
| `src/routes/index.tsx`, `proof.tsx`, `p.teardown.tsx` | 5 each | `proof.tsx` is the worst structurally: the surface is named "The Ledger" in four places, so it cannot be fixed one line at a time. |

Three patterns worth naming:

1. **The invented words cluster on public surfaces, not in-product.** The four public files (`brief.html`, `llms.txt`, `llms-full.txt`, `agents.txt`) hold 31 of 116 changes from only 15 audited surfaces. In-product, 305 audited surfaces yielded 26. We drifted worst exactly where we were trying hardest to sound differentiated.
2. **"ledger" is a naming failure, "receipts" is a copy failure.** "ledger" tends to appear as a surface name that must be renamed everywhere at once (`/proof`, the Record room, the `/trust-ledger` route). "receipts" appears as a loose noun in individual sentences and can be fixed line by line.
3. **The whole "approve" bucket is 8 changes and every one is a judgment call or likely.** None is certain. That is a signal in itself: "approval" is doing real work in gate copy, and the ruling's 5.8 versus 232.1 gap may not survive contact with the merge gate. Worth a single founder decision covering all eight rather than eight separate calls.
