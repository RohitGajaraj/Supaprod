# Founder verdict on the four directions, and the target state

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> 2026-07-29, ~01:10. Binding. **Read this first tomorrow, before anything else in this folder.**
> It overrides every visual decision in `directions/`, and it overrides earlier founder rulings
> where they conflict, including his own.

## The verdict: none of the four

Asked which of A, B, C or D to build: **"I would say nothing, none of it."**

Individual elements are liked. No direction is. Do not pick a winner, do not average them, do not
"take D and fix it". Start the visual language again, from the target state below.

**His diagnosis of why they failed, and it is the important sentence in this document:**

> *"We have built all four directions only from the perspective of **assembling things**, not really
> thought through from a **user lens** - how we should showcase and design everything greatly."*

And:

> *"It looks like absolutely a designed one, which if I ask an AI to vibe code and design something,
> that is how we would do it. There is no real thought through about it. For the namesake we have
> just assembled, is what I feel."*

Read that as: the frames answered "where does each element go" and never answered "what is this
person here to do, and what would delight them". Four competent assemblies, zero point of view.

---

## 1. What he liked, specifically (keep these)

- **Direction D's sign-in background.** The ink field and the starfield. This is the one visual
  idea that survives.
- **The mark as a small, slowly rotating icon.** Small. Not a hero.
- **The app-shell settings page** - the left-hand structure of it. *"On the app shell settings page,
  whatever you showcase, that is good. Right side still needs to be worked."* So: settings
  navigation good, settings content pane not yet.
- The ink and starfield pattern generally, used **subtly**, and prominently only where it earns it.

## 2. What he rejected, specifically

1. **The colour palette, everywhere.** Buttons, icons, cards, status. *"Nothing is great."* This is
   the top complaint and the clearest tell of the vibe-coded feel.
2. **Ember is overpowering.** It is on too many things in all four directions.
3. **The fonts.** Explicitly including **Geist Pixel**, and explicitly retracting his own earlier
   ruling: *"I know certain things came from my rulings and my design system, but it's not the one
   which would be worked at an enterprise-grade level platform used by millions and billions... Even
   if you're using it for the hero section, I will not prefer it now."*
   **He has handed the type decision to us: "You can pick your own themes and colours and fonts."**
4. **Too much scrolling, vertical AND horizontal.** Named again as a pain point.
5. **Verbosity on the landing/Today surface.** *"You see the verbatim across approvals and all those
   things. It has to be just one line, two line, something on the status and approval thing. Why do
   we need so bigger things to display? If a user wants to know, he will click deeper and understand
   the context, rather than we showcase everything on the cards on the landing page."*
   **Cards must shrink to one or two lines. Depth is a click away, not on the surface.**
6. **The sign-in right-hand column.** The divider or helper text above the Google button is not
   needed: *"You have just given a separate line, and after that, Google. So that does the job."*
7. **The sign-in messaging does not earn its place.** A user should have a reason to care before
   they log in - he named **system status ("everything is normal")** as the kind of thing that
   would.
8. **The seven-stage toolbar is questioned outright:** *"Do we really need that standard toolbar
   where we showcase all our seven surfaces, Discover, Decide, Plan and so on? Is there any other
   way we can only showcase the section that is actually being worked on?"*
   This reopens the Spine. It is no longer a given.
9. **The mark treatment reads as overpowering.**

---

## 3. The target state, in his words

**Density**

> *"Tightly designed, compacted - and when I say compacted, it will also have the breathing space,
> but it could be tightly designed."*

Compact is not cramped. Tight rhythm, real air, nothing oversized.

**The shell**

> *"Logos are rightly put. If I collapse, it will be just logos. If I expand, it would be one line
> header or name."*

A collapsible rail: icons only when collapsed, one line of label when expanded.

**Ask**

> *"On bottom, you showed the task part. I would not leave it that way. On top right I'll give
> something, an Ask button. If the user clicks on that it opens up a panel or a pane, where the user
> can ask what is happening."*

**Ask moves to the top right and opens a pane.** The bottom composer/task strip as drawn is
rejected. Note this collides with `interaction/FINAL-interaction.md`, which docks the composer at
the bottom, and with `shell-question/FINAL-shell-ruling.md`, which makes the bottom composer one of
the six regions. **The founder wins. Both documents need reconciling against this.**

**Colour, ruled precisely**

| Role | Ruling |
| --- | --- |
| Ground | **Pure dark, shades of black.** Dark background wherever possible. |
| The interface | **Monochrome: black, grey, white, slate, silver.** |
| Ember (brand) | **Very limited, only where genuinely necessary.** *"Even for the approval button, all buttons, action items, tasks"* - so ember is NOT the default for primary actions. If it is not really required, do not use it. |
| Status | **Green and red**, for diffs, numbers, tick marks. |
| Agents running | **Blue.** *"For the agents running, you can showcase it in blue. Font can be in blue."* |
| Starfield / ink | Subtle by default; prominent only where it earns it. |

This is a material change: the previous law made ember the single accent locus and treated blue as
narrow. **Now the interface is monochrome by default, blue carries agent activity, green and red
carry status, and ember is rare.**

**Type**

Ours to choose. Enterprise-grade, for a product used by millions. Geist Pixel is out. Pick faces
that read as a serious instrument, not as a template.

---

## 4. What the product must achieve (his closing statement)

> *"Discover how we can delight users, make the application frictionless, easy to understand, adopt
> it faster, not confuse the users. And ultimately do the job - every single functionality, every
> single feature does its own job completely, driven by an agent ecosystem, an agent-native
> ecosystem. And always give the moment and surprise element to the users and delight them, and
> create that stickiness, and users should feel that they want to come back."*

## 5. The Lovable thread stays open

> *"I asked you to include the Lovable inputs, the chat-based interface. You need to think through
> from that level as well... It's not that I want it the Lovable way. Lovable is just a reference,
> but for our scale of application, our kind of application, there has to be something which we
> need to discover."*

So `shell-question/FINAL-shell-ruling.md` is **not** the last word. Its reasoning stands (a
consequence viewer, not a thing viewer; seven of seven references grew a manager over the chat),
but the next mockup must show a genuinely conversational-first composition rather than a manager
with a composer in it. **The Ask-in-the-top-right ruling above is the founder's own first move in
that direction, and it should be taken seriously as a design seed rather than as a small placement
note.**

---

## 6. Where to begin tomorrow

1. **Do not open `directions/`.** Those four are reference for what did not work.
2. Read this file, then `craft-law.md`, then §3 above.
3. The unresolved design questions, in priority order:
   - What replaces the seven-stage toolbar, if anything?
   - What does a one-or-two-line approval card look like, with depth one click away?
   - What is the type system, chosen fresh?
   - How does a monochrome interface with rare ember, blue agents and green/red status actually
     look on a dense build surface?
   - What does the Ask pane, opened top-right, do to the rest of the composition?
4. Only then author a new direction. **One, taken far, not four assembled.** The failure mode
   already demonstrated is breadth without a point of view.

**Method note for tomorrow.** Four directions authored in parallel produced four assemblies. The
founder's complaint is about the absence of a user lens, which is not a thing parallelism buys. The
next attempt should start from a person doing a real task, walk their whole session, and let the
composition fall out of that - then be taken to a high finish in one direction rather than spread
across several.
