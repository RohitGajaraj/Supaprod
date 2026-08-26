# SPEC-AGENT-COMMS — teammates that address each other, and you

> _Written 2026-08-26 by MAIN from the founder's direction: "the agent itself needs to tag,
> communicate and exchange messages, like how it happens between users in Slack today. Truly agentic
> is what we need to be doing."_
>
> **Reconciles with [`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md) §2.5, which
> refuses to feed one teammate another's context. That refusal stands. This is the opposite thing and
> §1 says why.**

---

## 1 · The distinction the whole design rests on

§2.5 answered a good public objection: *an agent will burn more tokens thinking about what another
agent is doing than working on its task.* **That is true of ambient awareness and false of addressed
communication, and Slack is the proof.**

| | **Ambient context — refused** | **Addressed message — this spec** |
| --- | --- | --- |
| Shape | Teammate B is handed A's transcript "so it knows what is happening" | A addresses B about one thing, with one artifact |
| Cost | Unbounded, and grows with every other teammate | Bounded by the message, and constant |
| Relevance | Mostly task-unrelated | Addressed *because* it is relevant |
| Slack analogy | Reading every channel all day | Being @-mentioned about one thing |

**Nobody in a working organisation reads everything. They get addressed.** So: a teammate never reads
another's history, and **if a message cannot be understood without the sender's reasoning, the message
is badly formed** — that is a defect in the sender, not a case for more context.

**The falsifiable guard, so this cannot quietly become the thing it refuses:** a run carries a message
budget. **If teammates spend more tokens addressing each other than doing the work, the feature has
caused the regression the objection predicted and it comes out.** S4 measures this, per run, and it is
a standing check rather than a one-off.

---

## 2 · What already exists, so this is built on rather than beside

- **The transcript is already the channel.** R-13 made the left pane a transcript rather than a station
  map. **This spec makes it two-way and addressed; it does not add a surface** (§0.5: three surfaces).
- **Teammates already have names and colours** — `SPEC-MULTIPLAYER-PRESENCE.md`. An `@` is legible the
  moment it renders, with no new vocabulary.
- **Consent is already asked in place** — R-04, and `TrackConsent` is shipped. **An `@` addressed to
  the human IS that ask.** One mechanism, not two.
- **Slack is already connected** — `slack.server.ts`, `slack-ingest.server.ts`,
  `slack-digest.server.ts` in `src/lib/connectors/providers/`. §5 is a wiring job.
- **A refused write is already tested** — `mcp-a-refused-write-is-not-a-successful-one.test.ts`. The
  same standard applies to a message that could not be delivered.

---

## 3 · The seven message types, and there are only seven

**A message is a row, not a chat bubble.** It carries: **from** (a teammate, or the person), **to**
(one addressee, or the person), **type**, **subject** (the object it is about — a track, a signal, a
spec section, a file), and **payload** (an artifact reference, never a wall of prose).

| Type | From → To | What it says | Why it earns its place |
| --- | --- | --- | --- |
| **Handoff** | teammate → teammate | *"The spec is done. It is yours."* + the artifact | **The station transition already IS this and it is invisible today.** A founder ruling asked to see the handoff; `TrackChain` was built to it and had zero importers for 24 days |
| **Ask** | teammate → teammate | One bounded question, one bounded answer | Cheaper than reading the other's history, which is the point |
| **Ask** | teammate → **person** | *"@you — I need the metric for this forecast."* | R-04, asked in place. 90 queued approvals since July, **zero ever answered**, because they were detached from the work |
| **Claim** | teammate → all | *"I have this object."* | Prevents duplicate work. **A row comparison, never a reasoning step** — the moment it needs a model call it is wrong |
| **Challenge** | teammate → teammate | *"Your spec has no acceptance criteria that can be checked."* | **The most valuable one, and nobody ships it.** This is gap #1 made social: a station that can be told its output is bad, by something that did not produce it |
| **Escalate** | teammate → person | *"I cannot do this, and here is exactly which door is locked."* | R-26: a refused station is not a failed station. No retry theatre |
| **Broadcast** | teammate → all | *"The repo is unreachable. Stop."* | **Rare by design, and rate-limited.** If broadcasts are common, something upstream is broken |

**No eighth type without a ruling.** An open message vocabulary becomes chat, chat becomes noise, and
noise is what `_authenticated.threads.tsx` was deleted for.

---

## 4 · The person is a participant, not an audience

**This is what makes it Slack rather than a log.**

- **You can `@` a teammate.** From the composer, in the run: *"@builder use the existing component."*
  It lands as an addressed message, mid-flight, without restarting anything — which is capability
  **steer without restarting** from the register (§11), and Devin's intervention model.
- **A teammate can `@` you**, and that is the only thing that interrupts you. **Everything else is
  readable and nothing else is pushed.** That is the Slack rule and it is the entire anti-noise
  mechanism: you can read every message in the run, and you are told about exactly the ones addressed
  to you.
- **`@` autocomplete lists the teammates currently on this piece of work, and you.** Not a directory —
  the roster is never browsable (`SPEC-MULTIPLAYER-PRESENCE.md` §1). You can only address someone who
  is actually here.
- **One thread per piece of work.** Not per topic, not per teammate. The run *is* the thread, so there
  is nothing to file, name, or find later.

---

## 5 · Reaching you where you already are — and the consent rule that is not negotiable

**Gap #2 is that nothing reaches a person who left the page.** This closes it, and the same machinery
serves both directions.

- **Out:** a teammate posts into the Slack channel or email the customer nominated — *"@you, the
  forecast for this needs a metric I cannot read."* `slack.server.ts` and `slack-digest.server.ts`
  already exist.
- **Back:** the human replies **in Slack**, and that reply lands in the run as a message from them.
  **They never have to come back to answer.** This is the async property the whole frontier ships and
  we do not.
- **The teammate is a member of the workspace**, so it can be `@`-mentioned in Slack directly and pick
  the work up from there. Linear and Notion both ship this shape; the gesture needs no teaching.

**The rule that governs all of it, and it does not bend:**

> **A teammate may post into a channel the customer nominated. It may `@`-mention a specific human only
> where that human has consented to be mentioned, and never as a default.** An agent that tags people
> who did not ask for it is a reputational incident, not a feature — and it is the fastest way to get a
> product banned from a workspace.

Consent is per-person and asked once, in place, and one answer covers the class. **Silence is not
consent.** A teammate that cannot reach someone says so in the run rather than trying another channel.

---

## 6 · How it looks — this is a transcript, not a chat app

The design bar is the rest of Meridian, and R-20's eight apply unchanged.

- **An addressed message renders as a transcript entry with a from-chip and a to-chip** in the
  teammates' own colours, the type as a plain verb, and **the artifact inline** — the spec section, the
  diff, the signal — not a link to it. **Never a chat bubble, never an avatar row, never a timestamp
  gutter.** This is a record of work, and it should read like one.
- **A message addressed to you is the only thing that changes the footer**, and the footer already
  carries mode rather than position. One accent, for the one live fact (R-20 §1).
- **Challenge renders differently from every other type**, because it is the only one that says
  something is wrong. It is quiet, not alarming — and it names the thing and the next action, never
  just the objection.
- **Motion reports rather than decorates.** A message arriving is a state change and may animate;
  nothing else in this feature moves.
- **`prefers-reduced-motion` removes the movement and keeps the information.**
- **The sad path is designed**: a message that could not be delivered says so, names the reason, and
  offers the next action. A refused delivery is not a silent one.

---

## 7 · Why this makes the product more useful, not just more agentic

Three things it buys, and each is falsifiable:

1. **Quality, through Challenge.** Gap #1 is that stations advance whether or not what they produced is
   any good. **A teammate that can be told its output is unusable, by one that did not produce it, is
   the cheapest quality mechanism available** — and it is what Replit and Devin do internally as a
   self-check. Making it a message makes it visible, which makes it improvable.
2. **Speed, through Claim.** Two teammates never do the same work twice. Amoeba's own value line:
   coordinated agents **split** duplicate work rather than repeating it.
3. **Trust, through addressing.** *"Who did this and what were they waiting for"* becomes readable
   afterwards, by a person who was not watching. **That is the test `SPEC-PRESENCE.md` already sets**,
   and a transcript of addressed messages passes it where a status log never could.

---

## 8 · Ownership and order

| Piece | Owner | Order |
| --- | --- | --- |
| The message model — the seven types, from/to/subject/payload, the rows, and the budget guard | **S0** | First. It is a `src/lib/**` shape and everything else renders it |
| **Handoff**, made visible in the transcript | **S1** | First, with the model. It is the ruling that has been requested twice and mounted zero times |
| **Ask** to a person, folded into the existing in-place consent | **S1** | First. `TrackConsent` exists — wire it, do not rebuild it |
| `@` from the composer, with autocomplete of who is actually here | **S1** | Second. This is *steer without restarting* |
| **Challenge** and its quiet treatment | **S1** surface, **S0** the trigger | Second. Highest value for quality |
| **Claim**, and the collision mark it produces | **S2** | Second, with the cursor layer. **A row comparison, never a model call** |
| Slack out-and-back, and the teammate as a workspace member | **S0** wiring, **S3** the connect control and consent | Third. Closes gap #2 |
| Per-person mention consent, asked in place, one answer covering the class | **S3** | With the above. **Never a settings page you must visit first** |
| The message budget per run, measured over two cycles | **S4** | Standing. **This is how we find out if the objection was right** |

---

## 9 · What would prove this wrong

**If the message budget shows teammates spending more on talking than on working**, the public
objection was right and this comes out — not gets tuned. **If a person cannot say, after reading a
finished run, who did what and what each was waiting for**, it added noise rather than legibility.
**And if any `@` ever reaches a human who did not consent to be mentioned**, the outward half is
switched off the same day, whatever else it costs.
