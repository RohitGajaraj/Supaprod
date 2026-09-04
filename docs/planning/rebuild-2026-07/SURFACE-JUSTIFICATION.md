# Every surface must justify itself

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> 2026-07-29. **Binding, founder-directed, mid-build.** Read with
> [`FOUNDER-VERDICT-2026-07-29.md`](./FOUNDER-VERDICT-2026-07-29.md), which it operationalises.
> It governs every surface the approved prototype does NOT draw, and it outranks any instruction
> to "port" or "re-skin" a surface.

## Why this exists

The four rejected directions failed for one stated reason:

> *"We have built all four directions only from the perspective of **assembling things**, not really
> thought through from a **user lens**."*

The rebuild is now at the point where that mistake repeats most easily. The prototype decides four
screens: the door, Today, a run, and the crew. The app has roughly forty more. For those forty, the
tempting move is to take what is already on the page, swap the components for the new primitives,
delete the worst slop, and call it ported. **That is assembling with better parts. It produces the
same failure at a higher polish, which is worse, because it looks finished.**

The founder's mid-build correction, in his words:

> *"It should not be just a reassembling the thing... It should be well thought through what needs
> to go inside, what, why it needs to be there... Make sure that this deserves the place there.
> This is why it is required here. This can be moved somewhere else."*

## The rule

**A re-skin is only legitimate where the prototype already made the design decision.** Everywhere
else, the surface is redesigned from what the person is there to do, and every element on it has
to earn its place out loud.

---

## The five questions, answered in writing before a line is changed

Each answer goes in the surface's own file header, so the reasoning ships with the code and the
next session cannot mistake an assembly for a decision.

**1. Who is standing here, and what did they come to do?**
One sentence, one person, one task. Not "manage X". If the honest answer is "look at things",
the surface has no job and that is itself the finding.

**2. What is the ONE thing this surface exists to make possible?**
The thing that, if it were not here, the person would have to go somewhere else for. Everything
else on the page is supporting it or is a candidate for removal.

**3. For every existing element: keep, move, or kill? And why?**
Enumerate them. Three verdicts only, each with a reason:
- **Keep** because this is where the decision is actually made.
- **Move** because it belongs to a different job, and name the destination.
- **Kill** because nothing depends on it, or it duplicates something one click away, or it was
  only ever decoration.
"It was already there" is not a reason to keep.

**4. What is one click away instead of on the surface?**
Founder ruling, verbatim: *"If a user wants to know, he will click deeper and understand the
context, rather than we showcase everything on the cards on the landing page."* Depth is a click
away. A list row is **one or two lines**. The full evidence belongs to the one item in focus, not
to every item in the list.

**5. What would delight someone here, and what would confuse them?**
The closing standard: *"every single functionality, every single feature does its own job
completely... always give the moment and surprise element to the users."* Name the moment this
surface can genuinely offer. If there is none, say so rather than inventing one.

**6. Where does the crew appear on this surface, and what does it prove?**
Founder standing requirement, restated 2026-07-29: *"our platform is all about AI-native,
agentic-first, so most of the things need to be done by agents itself. We need to design the user
experience that way, and agent-friendly, so that it's not just in the backend but proven and
working in the frontend as well."*

His original form of the same complaint, which is the reason
[`agents/FINAL-agent-presence.md`](./agents/FINAL-agent-presence.md) exists and is top priority:

> *"We are saying Supaprod is built for product managers who ship with agents. And where is that
> agents part coming into picture for us? Nowhere."*

The override that doctrine settles on, and it decides this question everywhere:

> **Mechanism is machinery and stays behind the door. Labour is not machinery. Who did the work
> is chrome.**

So a surface passes this question only if all four hold:

- **Attribution is present.** Every artifact, row and change says who made it. An unattributed
  row is a surface pretending the work did itself. Engine-Room doctrine hides the *mechanism*
  (dispatch, fan-out, checkpoints); it never hid the *worker*, and applying it to the workforce
  was the original error.
- **Work in motion is visible while it happens**, not only after. A running agent wears its stage
  hue and stops the moment the run does; a quiet crew reads as quiet rather than absent.
- **Judgment leaves a trace.** R10, the Commit: an approval must not vanish into a toast. *"A
  toast confirms that your click registered; the Commit renders what your click caused, and that
  difference is the product thesis expressed as an interaction."* Where something real picks the
  work up, draw the handoff; where nothing does, say what changed instead. **Never an arrow to
  nowhere.**
- **Nothing overclaims.** R12: no surface may imply a capability the wiring lacks. An honest
  state beats a flattering animation, and a fake success is worse than a visible failure.

**The test:** if you removed every agent from this product, would this surface look any
different? If the answer is no, the surface is a filing cabinet with the agents in the basement,
and it fails.

---

## The standing rulings every surface obeys

From the verdict and the decided list, so no surface relitigates them:

| | Ruling |
| --- | --- |
| Ground | Pure dark, shades of black. The interface is **monochrome**: black, grey, white, slate, silver. |
| Ember | **Rare.** Not the default for primary actions, approve buttons, or tasks. It marks the human and the one call in front of you. |
| Agents | Colour arrives only when something happens: stage hue while running, ember while waiting on you, red on failure. Crew is monochrome everywhere except the Crew page. |
| Status | Green and red, for diffs, numbers, verdicts. |
| Density | *"Tightly designed, compacted, and it will also have the breathing space."* Compact is not cramped. |
| Scrolling | Too much scrolling, vertical **and horizontal**, was named as a pain point twice. A surface that only grows is not designed. |
| Verbosity | One or two lines on a card. Depth on click. |
| Stage toolbar | Gone from the chrome. One live line, expanding to seven on click. |
| Ask | Top right, opens a pane. Never a bottom dock. |
| Type | Ours to choose, enterprise grade. Geist Pixel is retired. |

## The method, not the parallelism

The verdict's own method note, which applies directly to how this build is being run:

> *"Four directions authored in parallel produced four assemblies. The founder's complaint is about
> the absence of a user lens, which is not a thing parallelism buys."*

So parallelism is for the **mechanical** half only: removing the duplicate header, replacing slop
components with primitives, deleting dead decoration. That work is real and it fans out safely.
**The judgment half does not fan out.** Deciding what belongs on a surface is one continuous act of
thinking about one person's session, and it happens before or after the fan-out, never inside it.

**Practical consequence for this build:** a parallel port pass is PASS ONE and is never "done".
Every surface it touches still owes the five answers above, and until it has them the surface is
mechanically clean and design-incomplete. Say that plainly rather than reporting it as finished.

## Related

- [`FOUNDER-VERDICT-2026-07-29.md`](./FOUNDER-VERDICT-2026-07-29.md) - the verdict this serves.
- [`../../conventions/anti-slop.md`](../../conventions/anti-slop.md) - what not to draw.
- [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md) - calm
  front, deep engine. The original form of "depth is a click away".
- [`structure/PROTOTYPE-v2.html`](./structure/PROTOTYPE-v2.html) - the four screens that ARE decided.

---

## Question 7: would a stranger recognise what they are looking at?

Added by founder ruling, 2026-07-29, after the connector catalogue shipped as 21
text-only cards:

> "Everything is like a card design, and it's very blank. Please add the small satellite so
> that it knows exactly what it is. All such nuances you should be picking up, it's not
> just me calling it out. Not just here, across all product surfaces, whatever we are
> reskinning and recreating and rebuilding. You need to think from that perspective: if you
> have to build the best platform, how would that be?"

The first six questions interrogate whether a surface DESERVES its contents. This one asks
whether a person can USE them at a glance. A surface can pass all six and still be a wall.

Answer all of these, in the surface's own header:

- **What identity is on this surface, and is it drawn?** Providers, agents, people, file
  kinds, environments. If a reader already carries a picture of the thing in their head,
  meet them halfway. See `anti-slop.md` section 6.
- **What is the scanning path?** Name the one thing a reader's eye should land on first and
  say why it wins. If three things compete, none of them won.
- **What does the emptiest realistic state look like?** Not zero rows, which is easy, but
  the state a real workspace sits in for its first month: some rows, most facts missing.
  Day one is the only day every user has.
- **What does a stranger not understand?** Every internal word on the surface. If it needs
  a tooltip to explain its own label, the label is wrong. The 2026-07-29 justification wave
  killed a button on `/decide` for exactly this.

**The standard this is measured against is not "better than before". It is Linear, Stripe,
Vercel, Raycast.** Ship what you would be happy to have screenshotted next to them.

**And the meta-rule, which is the actual instruction: the founder should not have to call
these out.** A surface arriving for review with blank cards, a competing hierarchy or an
unexplained internal word has not been designed, it has been assembled, which is the exact
verdict that rejected all four earlier design directions.
