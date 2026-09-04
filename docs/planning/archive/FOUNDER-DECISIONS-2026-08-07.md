# Three Founder Decisions — Launch Readiness 2026-08-07

> _Created: 2026-08-07 · Last updated: 2026-08-07_

> **These three decisions lock ALL marketing copy. Until decided, no Product Hunt tagline, no X thread, no landing page copy can be finalized. Decide by EOD 2026-08-08 to stay on launch schedule.**

---

## DECISION 1: Positioning — Narrow vs. Brownfield

**Question:** Does Supaprod serve ONLY new product teams (narrow, sharp message), or ALSO companies building enhancements to existing products (wide, larger TAM)?

### Option A: Narrow (Recommended for THIS WEEK)

**Positioning:** Supaprod is for **new product teams** — builders shipping something net-new who need the full lifecycle, from signal to learning.

**Why now:**
- Single audience = sharper Product Hunt message = higher rank
- New product teams are the proven ICP (your demo, your docs, your metaphors)
- Brownfield is a better *sales* story but a muddled *launch* story
- You can add brownfield wedge in Q4 after the launch narrative settles

**Copy locks to this:**
- Product Hunt tagline: "The operating system for product teams building net-new products"
- X thread: "We built the loop that turns new product bets into sharpened outcomes"
- /brief and /product focus entirely on new-product builders
- Case studies / testimonials will feature first customers building new things
- Pricing copy emphasizes "from first signal to shipped and learning"

**If you pick this:** Brownfield becomes a post-launch positioning evolution, not a launch-day claim.

---

### Option B: Wide (Longer runway, diluted launch)

**Positioning:** Supaprod is for **product leaders everywhere** — building new products OR enhancing existing ones. Connect your sources, see your signals, decide what to build next, ship it, learn what happened, repeat.

**Why now:**
- Brownfield is a larger TAM (more companies with existing products)
- Both segments can use all seven stations
- Founders can show: "Here's the demo for *your* product" to more people
- Positioning is more defensible (not bounded by "new only")

**Copy locks to this:**
- Product Hunt tagline: "The operating system for product teams everywhere"
- X thread must explain both: "Building new? Enhancing existing? Same loop."
- /product and /brief show TWO use cases (net-new build AND enhancement)
- Messaging becomes: "Product leaders who want to stop deciding blind"
- Case studies / testimonials show both paths

**If you pick this:** Launch messaging gets diluted; Product Hunt rank likely lower; but TAM narrative is stronger for fundraising.

---

## DECISION 2: Homepage Receipts Section

**Question:** The homepage has a "Receipts, not claims" section showing example workspace data. Do you label them as examples, publish one real receipt, or remove the section?

### Option A: Label as Examples (Recommended)

**Change:** Add visible text above the receipts:

```
Example Workspace Receipt (internal demo data)
─────────────────────────────────────
[current receipt content stays the same]
```

**Why:**
- Honest. You have ~8 users, all internal. A real customer receipt doesn't exist yet.
- Preserves the "Receipts, not claims" narrative (these ARE receipts, just internal ones)
- Zero fabrication; zero risk on Product Hunt review
- Shows how the system works without lying about traction

**Implementation:** 5-minute edit to src/components/landing/ReceiptsSection.tsx

---

### Option B: Publish One Real Receipt

**Change:** Create one receipt from your own workspace showing a real decision you made and its actual outcome.

**Example:**
```
Supaprod's Own Build Decision (August 2026)
─────────────────────────────────────
Decision: "Ship the multitenancy RLS refactor before launch to close cross-tenant 
  leaks, even though it delays the go-date by 2 weeks"
Signals: 19 security audit findings across tenancy boundaries; 7 classified as 
  blockers for launch-day trust
Outcome: 81 migrations applied; zero drift; 157 cross-tenant risks eliminated
Grade: A (shipped on time, zero production incidents, security closure enabled 
  the launch)
Next? Use the RLS hardenin pattern everywhere new isolation appears; it pays.
```

**Why:**
- Honest AND powerful. You made a real call, showed the evidence, delivered.
- Demonstrates the system works because you used it.
- Product Hunt reviewers love founder-uses-own-product.

**Risk:** The format is different from what the demo shows. Readers might not see it as the "same" receipt the system produces.

**Implementation:** 30 minutes to extract actual spec from the RLS migration, format as receipt, wire into the homepage.

---

### Option C: Remove for Launch

**Change:** Delete the Receipts section entirely; add it back post-beta once you have real customer receipts.

**Why:**
- Zero ambiguity. No example, no label, no interpretation.
- Avoids the "can they see this proves we work?" question entirely.
- Receipts become a post-launch feature: "See what our customers built and learned."

**Cost:** Loses the "Receipts, not claims" proof point from the homepage hero, but the benefit is still in the Product Hunt description.

**Implementation:** 2-minute removal of the component.

---

## DECISION 3: Navigation CTA Color

**Question:** The "Start free" pill in LandingNav is white. Your branding says "nothing white in the platform." Override for this CTA, or change to brand color?

### Option A: Change to Brand Color (Recommended)

**Change:** LandingNav.tsx button color from `bg-white text-black` to `bg-[var(--accent)] text-white` (the ember brand color).

**Why:**
- Consistent with your ruling: "nothing white in our platform"
- Ember CTA is more visually cohesive
- Still has enough contrast for accessibility

**Implementation:** 1-line CSS change.

**Downside:** White CTAs often convert better (marketing folk argue about this forever; no clear winner). If you care about conversion rate testing later, you could A/B test this.

---

### Option B: Keep White

**Change:** Explicitly override the "nothing white" ruling for this specific CTA because navigation conversion matters more than color consistency.

**Why:**
- White converts higher (if that's empirically true for your audience)
- Navigation is a funnel control; every pixel matters
- You can document this as a conversion optimization exception

**Implementation:** Zero change. Keep it.

**Downside:** Breaks your own stated rule.

---

## Decision Format

**Tell me by EOD 2026-08-08:**

```
DECISION 1 (Positioning): [A: Narrow] or [B: Wide]
DECISION 2 (Receipts): [A: Label as examples] or [B: Real receipt] or [C: Remove]
DECISION 3 (CTA color): [A: Brand color] or [B: Keep white]
```

**Once decided,** I will:
- Lock all marketing copy to these decisions
- Build Product Hunt tagline and description
- Build X launch thread
- Build HN post
- Build email sequences
- Update homepage and all public copy

---

## Example Response

```
DECISION 1: A (Narrow positioning — new product teams only)
DECISION 2: A (Label as examples)
DECISION 3: A (Change to brand ember color)
```

Reply with your decisions. Everything else waits on these three.
