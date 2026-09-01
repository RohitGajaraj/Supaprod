# The bar

> _Created: 2026-09-02 · Last updated: 2026-09-02_

**Founder ruling, 2026-09-02.** This is the standard every surface, feature and interaction is held
to. It is not a style guide. [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) owns how
things look; this owns **how good it has to be, and who you have to be while building it.**

It supersedes the method sections of `design-reference/AI_Product_Design_Constitution.md`, whose AI
doctrine ("AI should quietly improve every workflow") is **reversed** by section 4 below.

---

## 1. The one sentence

**Build it as if Anthropic, OpenAI, Google, Vercel, Figma, Perplexity or Microsoft were shipping
it.** If one of those companies put their name on this screen tomorrow, would it go out, or would it
get sent back? If it gets sent back, it is not done.

That is a working test, not a compliment to those companies. Each lens catches a different failure,
so use the one that fits what you are building:

| Lens | The question it asks | The failure it catches |
| --- | --- | --- |
| **Anthropic** | Is the model's reasoning legible, and are its limits stated honestly? | Confident output with no way to check it. Claiming more than the system delivers. |
| **OpenAI** | Is the most powerful thing here reachable in one move by someone who just arrived? | Power buried behind onboarding. A capable product that reads as empty on first open. |
| **Google** | Does it hold at scale, on a slow connection, in every state, for everyone? | Works beautifully with 3 rows and falls apart at 3,000. Empty, loading and error states designed last. |
| **Vercel** | Is it fast, and does the speed **feel** like the point? | Correct but sluggish. A wait with nothing to look at. |
| **Figma** | Is the interaction itself the craft, and is it consistent everywhere? | Right components, wrong feel. Bespoke behaviour on one screen that exists nowhere else. |
| **Perplexity** | Is every claim sourced, and can the user follow it back? | An answer with no provenance. A number with no query behind it. |
| **Microsoft** | Will an enterprise buyer's security, admin and compliance review pass this? | Governance bolted on later. Roles, audit and export treated as an Enterprise-tier afterthought. |

**Apply the lens that matches the risk.** A pricing page is a Microsoft problem. A wait state is a
Vercel problem. An agent's output is an Anthropic and Perplexity problem.

---

## 2. The panel. Wear all of these before you call something done.

Carried forward from the design constitution, which had this right. **Think as all of them at once**,
and when two disagree, say so in the work rather than quietly picking one.

| Hat | What they ask |
| --- | --- |
| **Head of Design** | Does this belong to one system, or did it invent a local dialect? Is the craft in the mechanics or only in the layout? |
| **Head of Consumer Psychology** | What does a person **feel** here: confident, anxious, lost, respected? What does this screen make them believe about whether the system is working? |
| **Head of Product** | Why does this screen exist? What is its one primary task? Can it be merged, simplified or removed? |
| **Head of Market / GTM** | Could a stranger tell in ten seconds what this does and why it is different? Does it survive being described out loud? |
| **The PM who has shipped many products** | Where does this break in month six? What did we just make expensive to change? |
| **The enterprise B2B veteran** | Roles, audit, export, tenancy, admin control, failure modes. Who gets blamed when this goes wrong, and can they prove what happened? |
| **The user** | See section 3. This hat is worn continuously, not at the end. |

**Challenge every assumption.** If something should be removed, renamed, merged, split or rebuilt,
do it and say why. A surface you inherited is not evidence that it is correct.

---

## 3. Wear the user's hat at every step, not at the review

**Walk the journey as the person, not as the builder.** Not the screen in isolation: the arrival,
the wait, the first success, the first failure, the second visit, the day they hand it to a
colleague. **A feature is not shipped until you have moved through it as a user and can say what it
felt like at each step.**

The questions, per screen:

- Why does this exist, who uses it, and what is the primary task?
- Does it belong here, or was it put here because there was room?
- What is the person's state of mind when they arrive, and what do they need first?
- Where does confidence get lost, and what would restore it?
- What happens when it is empty, slow, wrong, or half-finished? Those are the states that decide
  whether the product is trusted, and they are the states that get designed last.

**Power is progressively revealed, never dumped.** The target feeling is *"everything is exactly
where I expected it to be"*, and the way there is fewer decisions per screen, not fewer capabilities.

---

## 4. It must feel truly agentic. This is the strongest instruction here.

**This is not a B2B SaaS application with AI features. It is an agentic platform.** The difference is
not the model; it is what the person sees while the system works on their behalf.

**The agent's work is shown, not hidden.** Wherever an agent is doing something, that work is visible
as it happens: what it is doing now, what it has decided, what it is about to do, what it needs from
you. **A spinner is not agent visibility.** A progress bar that only moves is not either. The person
should be able to watch the work and understand it without opening anything.

**And the human stays in the conversation while the backend continues.** Work does not block the
interface, and the interface does not go quiet while work runs. You can keep talking to it, change
your mind, set a boundary, or walk away and come back to a run that kept going and can account for
itself.

The concrete requirements:

- **Show the reasoning, not just the result.** What it considered, what it rejected, on what
  evidence. A conclusion with no visible path is the failure mode the Anthropic and Perplexity
  lenses exist to catch.
- **Show the boundary.** What the agent may do on its own, what it must ask for, and where it is
  right now against that line. Autonomy is only sellable if it is legible.
- **Show progress as work, not as time.** Stations completed, decisions made, artifacts produced.
- **Never a dead wait.** If it takes time, that time shows what is happening.
- **Interruptible and resumable.** Stop it, redirect it, come back to it.

**This does not conflict with the engine-room doctrine, and the distinction matters.**
[`engine-room-doctrine.md`](./engine-room-doctrine.md) says the *machinery* stays behind one door:
traces, prompts, budgets, evals, guardrails. That still holds. **The machinery is hidden; the work is
shown.** A person should never meet the plumbing and should always be able to watch the job.

---

## 5. Build for the platform of tomorrow

**Design for where this lands, not where it starts.** The six-month-forward doctrine already governs
architecture; this is its interface half. Assume the model layer gets better and cheaper, assume
agents get more autonomous, assume the person supervises more work than they do today, and build the
surface that is right *then*. A surface that only makes sense while a human does most of the work is
a surface we will pay to replace.

---

## 6. The commercial lens, and where it does not belong

**The bar is a product people love and an investor can underwrite.** Those are the same bar reached
from two directions: what makes it defensible (the forecast captured at decision time, the loop that
closes, the record that compounds) is also what makes it worth using twice.

**Keep the investor framing out of the product.** No valuation language, no category claims, no
market-size framing, no competitor positioning on any surface a user touches. That reasoning lives in
[`../strategy/`](../strategy/README.md) and [`../pitch/`](../pitch/README.md) and is written for a
different reader. A product that argues its own importance to the person using it reads as insecure,
and it is the fastest way to sound like the B2B SaaS category we are not in.

**Say what the thing does. Let the value be inferred.** See
[`ui-voice.md`](./ui-voice.md) and [`anti-slop.md`](./anti-slop.md).

---

## 7. The authority this grants

**Full liberty on design system, features and gap-fixing** (founder, 2026-09-01 and 2026-09-02).
You may raise Meridian, build the missing component, redesign the surface, and close the gap without
asking. Related: [[the-reference-is-the-floor-not-the-inspiration]] in tool memory, and the standing
Meridian ruling in [`../../CLAUDE.md`](../../CLAUDE.md).

**What it does not license:**

- **Compressing instead of designing.** The ratchet in
  [`surface-discipline.md`](./surface-discipline.md) still binds: today's design is the floor, and
  "tighten this" means a better surface, never a smaller one.
- **Widening a test baseline to pass.** Raising Meridian is sanctioned. Loosening the guard is not,
  and the two look similar in a diff.
- **Shipping a claim the repo cannot show.** Every structural claim carries a `file:line`, every
  number carries its query.
- **Redesigning what is working because you arrived.** Challenge assumptions with a reason, not on
  principle.

---

## Related

- [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) - Meridian, the visual contract.
- [`surface-discipline.md`](./surface-discipline.md) - the ratchet, and space/scroll/colour law.
- [`engine-room-doctrine.md`](./engine-room-doctrine.md) - what stays behind the one door.
- [`ui-voice.md`](./ui-voice.md) · [`anti-slop.md`](./anti-slop.md) - how it speaks.
- [`data-minimalism.md`](./data-minimalism.md) - every field earns its place.
