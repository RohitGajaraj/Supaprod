# Mobbin references, pulled 2026-08-25

**LANE 0 and LANE 1 have no Mobbin access, so the images live here.** Open the `.webp` files
directly. The ruling that governs them is [`../../the-first-run/DESIGN-DIRECTION.md`](../../the-first-run/DESIGN-DIRECTION.md).

## The workbench set — take these

| File | App | What to take | What to ignore |
| --- | --- | --- | --- |
| `emergent-live-steps.webp` | Emergent | **The right pane, almost exactly.** A live checklist: `✓ Environment Ready` · `⟳ Building Package… 04:29` · `○ Migrate Database` · `○ Deploy`. Per-step state, a running clock on the active step, everything ahead visibly pending. **This is our seven stations drawn correctly.** Also: the left transcript renders `Agent has been paused` as a step rather than hiding it | The credits/upsell chrome |
| `cofounder-inline-question.webp` | Cofounder | **The most important reference here.** The agent asks **inside the run**: `Running Tool: Ask User Question` → `Waited for the user's answer` → an inline card with named options, one marked `Recommended`, a free-text escape, and three controls: **`Decide all` · `Decide this one` · `Submit`**. **`Decide all` is the detail to steal** — our 90 dead gates were 90 instances of one question | Their left canvas |
| `lindy-steps-and-tabs.webp` | Lindy | Completed steps as a checklist inside the transcript with `Processing…` on the live one, and a right pane that switches `Browser \| Terminal`. **Take the tabbed right pane** — a station's output is sometimes a document, sometimes a diff | The whimsical status lines |
| `fabric-artifact-primary.webp` | Fabric | The **inversion for a finished run**: artifact takes the page, agent becomes a right rail with `Comments · Info · Ask` and quick-action chips | Their file tree |
| `stackai-version-history.webp` | StackAI | Version history as a first-class panel — `v0…v5`, each stamped, one `Live`, one `Draft`. **We version a decision, not a document**: the claim, its horizon, later its verdict | The node canvas |
| `framer-canvas-agent.webp` | Framer | Confirms the ratio: **preview gets the larger share, controls sit at the edge** | Everything else |
| `mistral-live-preview.webp` | Mistral | Config left, live preview right, with the preview labelled so it is never mistaken for the real thing | Their agent-builder form |

## The illustration set — read the caveat before using either

The founder asked about distinctive illustration and characters. **I pulled the mascot-led examples
and I am recommending against most of them**, so both sides are here.

| File | App | Verdict |
| --- | --- | --- |
| `sentry-restrained-illustration.webp` | Sentry | **This is our register.** Loose line-art objects, off-palette, small, sitting beside the content rather than performing at it. Sentry sells to roughly our buyer, and the drawing earns warmth without claiming friendliness the product has not yet earned |
| `vanta-onboarding-illustration.webp` | Vanta | A single large brand shape carrying one panel of a two-column onboarding. Usable pattern; the llama itself is not |

**Rejected on purpose: Duolingo's Duo, Hootsuite's owl, Homerun's dog.** Those are consumer-brand
mascots that speak on the product's behalf. **Our buyer is a tech lead accountable for merging output
they did not write.** A cartoon greeting that person while an agent edits their repo reads as the
product being pleased with itself, and it costs exactly the trust this product needs most. A mascot
is also the single hardest thing to remove later.

**What we do instead:** the distinctiveness budget goes into **the run itself moving** — a step
changing state, a timer ticking, text landing in place, a question appearing where the work is. That
is the thing no competitor screenshot in this folder actually does well, and it is memorable because
it is the product working, not a drawing of it.
