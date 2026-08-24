# The live preview, and what the ChatPRD screenshots actually teach

> _MAIN LANE · 2026-08-25 · Read this before building any surface on `/track/:id`._
> _ChatPRD is a reference, not a target. Three of the seven lessons below we should take almost
> verbatim; two we should take and do better; two we should refuse._

**The founder's ask, in his words:** *"how we can make the live preview of whatever is happening in
this application. Only then would the user be able to relate to what is happening... and understand
what changes he would be allowed to make."*

**The second clause is the harder one and it is the one that matters.** A user watching a run is a
spectator. A user who can reach into it is an operator. Every decision below is judged on whether it
moves a person from the first to the second.

---

## 1. The shape: conversation left, live artifact right

ChatPRD's main screen is two panes. The chat runs on the left. On the right, the document it is
writing **materialises as it writes, is immediately editable, and says `Saved`.** Above it:
`Current · v1`, Save, Export, Related, Improve, a live word count, collaborator faces, comments.

**This is the answer to "live preview", and it is better than a cursor.** A cursor shows you motion.
This shows you the thing being made, and lets you take it over mid-flight without asking anyone.

**What we build:** `/track/:id` becomes two panes, not three stacked panels.

| Pane | What it is | Built from |
| --- | --- | --- |
| Left | The transcript: which agent acted, what it did, what it filed, and the handoff to the next station | `TrackActivity` (exists) |
| Right | **The artifact this station is producing, live and editable** — the signal set at Sense, the decision at Decide, the spec at Define, the PRD at Design | mostly does not exist yet |

**The right pane is the gap.** We have `TrackChain`, which lists what each station produced. Listing
is not previewing. A person cannot relate to "1 spec filed"; they can relate to the spec.

## 2. Tool calls are cards in the transcript, not log lines

In the chat, `Create Document` renders as a **card**: title, one-line description of what it did, the
template it used, a status dot, a collapse chevron, and an **Edit** button that jumps to the artifact.

**Take this verbatim.** Our `ToolStream` already renders per-call rows and already has the fields
(`tool`, `label`, `state`, `durationMs`, `error`). What it lacks is the **action** — a row you can act
on rather than only read. A tool call that produced an artifact must link to that artifact.

## 3. THE MOST IMPORTANT ONE: consent happens in context, not in a queue

Adding a competitor pops **"Scan Website? Would you like to scan this company's website now to
automatically discover their products and features?"** with two buttons: `Not Now` · `Scan Now`.

Now compare ours. **90 `cluster.trigger` approvals were raised since July. Zero were ever approved.
42 cancelled, 38 expired, 10 still pending.** They went to a queue, detached from the work they were
blocking, and nobody ever answered one.

**The lesson is not "build a better approvals queue". It is that a queue was the wrong shape.** Ask
at the moment, in the place the work is happening, with the consequence named and two buttons. A
question that has to be found is a question that does not get answered.

**What we build:** when a run needs a person, the ask appears **in the run**, inline, at the station
that raised it — not only in `/approvals`. `/approvals` becomes the overflow for things you skipped,
not the primary surface.

## 4. The empty state IS the onboarding

ChatPRD's blank chat is **"How can I help you today?"** and four cards, each a whole job:
*Help me write a document · Help me improve an existing document · Brainstorm new features · Get
feedback on my ideas.* No configuration. No tour. Four doors, each one a sentence.

**Ours is 84 authenticated routes and a rail.** That is the learning curve, stated as a number.

**What we build:** the authenticated landing becomes three or four job cards in the user's words. Not
station names. Not "Discover". Something closer to *"I have a problem and don't know what to build"*,
*"I know what to build, get it specified"*, *"Something shipped, tell me if it worked."*

## 5. Take and do better: the artifact is versioned and exportable from the first second

`Current · v1` with a version picker, `Save`, `Export`, `Related`. Versioning is present before the
user asks for it, which is what makes editing safe enough to try.

**Where we can beat it:** ChatPRD versions a document. **We can version a decision and then grade
it.** Their `v1` is a draft history; ours can be a claim with a horizon and a verdict. That is the one
thing in this comparison that they structurally cannot copy, because it has to be captured at the
moment of the call and they have no run to hang it on.

## 6. Take and do better: research from a URL

`Add Company → website → "scan for products and features after creation"` produces a full profile:
positioning, target audience, pricing, 26 features, each with its source URL.

**We already have the harder half of this** — `sense` ingests signals and clusters them into themes,
with dedup and embeddings. What we lack is the one-field door and the visible payoff. Their version is
one text box and a button; ours is a station.

## 7. Refuse: the chat-first frame, and the doc as the deliverable

**ChatPRD's product is a document.** The chat produces a PRD and the PRD is the thing you keep. That
is a good business and it is not ours, and copying the frame would flatten us into a worse version of
a product that already has 100,000 users.

**Our deliverable is a run that finished** — something was decided, built, shipped, and then graded
against what we said would happen. The document is a by-product. If we make the doc the hero we are
competing on writing quality against a company whose whole company is writing quality.

**Also refuse the usage meter as the free tier.** *"Used 1 of 3 free chats"* is right for a tool
priced at $19/month with instant value. A run that walks seven stations cannot be metered at three
before a person has ever seen one finish.

---

## What this changes in the queue, concretely

| Item | Change |
| --- | --- |
| **L0-2** `TrackRun` | Rebuild as **two panes**, not stacked. Left `TrackActivity`, right the live artifact. |
| **NEW L0-6** | **The artifact pane.** Render the current station's output as the thing itself, editable where the schema allows, with its version. This is the founder's "live preview" and it is the biggest single gap. |
| **NEW L0-7** | **Inline consent.** When a run holds `waiting-on-a-person`, render the ask **in the run** with the consequence named and two buttons. Precedent: 90 asks in a queue, 0 answered. |
| **L0-3** | Demoted. The "waiting on you" card is the overflow view, not the primary. L0-7 is primary. |
| **NEW L1-5** | **The authenticated landing becomes 3-4 job cards** in the user's words. Directly attacks the 84-route learning curve. |
| **M-2** `driveTrackNow` | Already shipped. It is what makes the left pane move while somebody watches. |

**The order, by leverage:** L0-7 (inline consent) → L0-6 (artifact pane) → L1-5 (job cards) →
L0-2 (two-pane layout). Consent first, because a run that stops and cannot say so is the defect that
has cost this product three months, and no amount of preview fixes it.
