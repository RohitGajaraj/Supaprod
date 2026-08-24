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

## The Mistral set — the founder's pointer, and the sharpest structural reference we have

Six screens of Mistral's AI Studio. **Take more from this app than from any other in this folder**,
because it solves the problems we are actually stuck on rather than the ones we find easy.

| File | What to take |
| --- | --- |
| `mistral-capabilities-version-preview.webp` | **The preview pane is ALWAYS there, even empty, and it is labelled** — *"Preview your agent here"* / *"Start a new chat"*. It never collapses and never leaves a hole. Also: config progressively discloses — `Capabilities  Add +` collapsed, expanding into tool chips and a function list |
| `mistral-version-save-restore.webp` | **`v2 · Latest` in the header with `Save Agent Changes` · `Reset changes` · `Restore this version`, and a green `Saved`.** Versioning is present before anyone asks, which is what makes editing safe enough to try. **This is our forecast card's chrome** — a decision with versions, not a document with versions |
| `mistral-dotted-affordances.webp` | **The empty state IS the input.** `Add guardrails`, `Adjust tone`, `Knowledge` sit as dotted-underline placeholders you click to fill. No empty panel, no "nothing here yet", no separate add button. **This is the answer for four of our seven stations, where "produced nothing" is the common case** — the station's empty state becomes the invitation to supply what it lacked |
| `mistral-tools-connectors.webp` | **Tools and Connectors side by side, each row a checkbox, with `Reset`** — and a floating composer pinned over the preview carrying the agent's name and `Type / for quick access`. Our connectors are reached at the moment they are needed (R-20 / THE-ONE-SCREEN); this shows what that panel looks like when it is |
| `mistral-agent-identity-picker.webp` | An identity picker that is a glyph plus a colour swatch row, and nothing else. **The restrained way to let something be recognisable without a mascot** (R-05) |

### The one to steal hardest: the rail is grouped by VERB, not by object

Mistral's left rail reads **Create** (Playground · Agents · Batches · Document AI · Workflows · Audio)
· **Improve** (Fine-tune) · **Context** (Files · Connectors) · **Code** (Vibe CLI · Codestral).

**It is grouped by what you are trying to do.** Ours is grouped by what things ARE — Today, Approvals,
Runs, Brain, Threads, Guardrails — which is our object model shown to a customer, and it is the same
mistake as the seven-station menu that R-01 killed.

**This is the pattern for collapsing 84 routes into nine.** A person does not arrive wanting "Brain".
They arrive wanting to start something, watch something, or find out whether something worked.
**Group the survivors by that, and most of the 48 redirects stop having anywhere to point.**
