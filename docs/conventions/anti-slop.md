# Convention: the anti-slop standard

> _Created: 2026-07-29 · Founder ruling, binding on every surface and every agent that touches a
> pixel. Load this before any UI or UX work, alongside [`engine-room-doctrine.md`](./engine-room-doctrine.md)._

## The standard, stated positively

> **Build what Stripe, Vercel, Google or Apple would ship if this were their product.**

The founder's words: *"It should absolutely feel like written and designed by a great product
designer out there, be it Vercel, Stripe, Google, Apple. It should not feel like written by AI."*
The test is not "would someone say a machine made this". It is: would a person fluent in Linear,
Figma, Notion, Raycast and Stripe sit down and trust this, or pause at every subtly-off component.

Slop is the absence of decisions. Every rule below exists to force one.

---

## 1. The eleven hard bans

Founder-supplied, 2026-07-29. **These are not advisory. A surface containing one is not done.**

| # | Pattern | What it is |
|---|---|---|
| 1 | **Purple gradients everywhere** | The AI palette: purple-to-blue on buttons, text, backgrounds, orbs. The `#6366f1` / `#8b5cf6` / `#a855f7` family. The new "make it pop". |
| 2 | **Lazy "cool"** | Glassmorphism, neon glows, blurred orbs, monospace everything. Reads as a hackathon project, not a product. |
| 3 | **Lazy "impact"** | When in doubt, animate everything. Bouncing buttons, wiggling icons, gradient text, floating badges. Motion without meaning. |
| 4 | **Side-tab cards** | A thick coloured border on one side of a rounded card. **The single most recognisable tell of AI-generated UI.** |
| 5 | **Cardocalypse** | Cards inside cards inside cards. Five levels of nesting, each with its own padding and shadow. |
| 6 | **Copy-paste layouts** | The same hero-metric-features template repeated with different colours. When every section looks the same, nothing stands out. |
| 7 | **Inter everywhere** | One font for headings, body, labels and buttons. No typographic hierarchy, no personality, no design. |
| 8 | **Massive icons** | Icon containers larger than the content they introduce. When the decoration is bigger than the message, priorities are backwards. |
| 9 | **Bad contrast choices** | Grey text on coloured backgrounds, low-contrast labels, unreadable combinations. Looking good and being readable must not conflict. |
| 10 | **Redundant UX writing** | Label, sublabel, helper text and hint all saying the same thing in slightly different words. Say it once, say it well. |
| 11 | **Modal abuse** | Complex settings crammed into a modal. If it needs a scrollbar and three columns, it deserves its own page. |

### The fixes, in the same order

1. Pick a palette with a reason. Never a gradient where a solid will do.
2. Blur is chrome material for things that genuinely float. Mono is for data, never for labels.
3. Motion confirms, it never performs. If removing it loses no information, remove it.
4. Replace a side stripe with a **background tint, a leading mark, a full border, or nothing**.
5. Flatten with spacing, typography and dividers. One bordered container per region, maximum.
6. Vary the layout per screen. Density varies with importance.
7. Two families: one for reading, one for data. Three weights maximum across the system.
8. Icons sit inline at the size of their label. No tiles, no containers.
9. Body text at 4.5:1 minimum, large text at 3:1. Verify, do not eyeball.
10. One label. The evidence goes on the second line, and it is different information.
11. A panel or a page. A modal only for a single irreversible confirmation.

---

## 2. What is advisory, and who decides

The catalogue at [impeccable.style/slop](https://impeccable.style/slop/) is a useful floor and is
**advisory beyond the eleven above.** Founder ruling, 2026-07-29:

> *"If certain things justify and it does a really good job and still that's required, please go
> ahead and implement based on those things. But definitely avoid whatever I gave in these two
> images. Those are the hard things which I do not want to have."*

So: apply the catalogue's craft, and override it where following it produces a worse product. State
the override and the reason. Decisions already taken this way:

| Advisory rule | Our call | Why |
|---|---|---|
| No decorative grid backgrounds | **Overridden at the auth door and the public landing.** | The founder wants the engineering field and starfield there, it is a deliberate texture rather than a default, and it is one surface, not a habit. |
| Geist is an overused face | **Kept for Geist Pixel only**, at the auth door. | Scoped to a threshold identity, which is a decision rather than a reflex. Geist Sans and Geist Mono were still dropped. |
| No section numbering | **Allowed where functional**, banned where editorial. | A number that anchors an annotation to a drawing does work. A number beside a heading for texture does not. |
| Cream or beige surfaces | **Upheld and reinforced.** | The founder independently rejected the paper light theme. Light is a cool sheet. |

**A skill is a source, not an authority. Judge it.**

### The eleven themselves can be overridden, once, with a reason

Founder ruling, 2026-07-29, and it extends to the hard list:

> *"If there is anything that's getting banned, you can just avoid it for one time because that
> makes sense to showcase it, because somewhere this platform would be also used by developers.
> And when we are catering to those users' demographics, we need to speak in their languages."*

So a ban yields when **the banned thing is the clearest way to say a true thing to the audience in
front of it.** Developers are part of that audience and they read certain conventions natively. The
bar is not "it would look nice", it is "the alternative communicates worse".

Every override is written down here with what it bought. Taken so far:

| Broken | Where | What it bought |
|---|---|---|
| No glowing accents on dark | the auth door, one warm radial behind the card | lifts the card off the field. One surface, one bloom, no second instance anywhere. |
| No decorative grid | the auth door, the public landing | the drafting field is the brand's own texture, and it is two weights rather than a default overlay. |
| No pulsing status dot | the running agent mark | the rule's own exception: it animates because the data genuinely is changing. A spinning arc plus a breath, and it stops the moment the run does. |
| Cream surfaces | the light theme | the founder asked for warm, and warm-tinted neutrals at very low chroma read as paper stock rather than as beige. |

**The discipline that keeps this honest:** an override is a decision, so it gets a line in this
table. An override nobody wrote down is just slop with a story.

---

## 3. The systems this repo has committed to

**Type.** Mona Sans for everything a person reads. IBM Plex Mono for every number, duration, count,
diff, identifier and timestamp, and for nothing else. Geist Pixel at the auth door and nowhere else.
All three SIL OFL 1.1, self hosted from `public/fonts/`, no CDN request. Three weights maximum.

**Colour has jobs, never decoration.**

- The neutral ramp carries everything structural. Never `#000` or `#fff`; tint every neutral.
- **Agent identity is a stage family.** The seven loop stages own seven hues, an agent inherits its
  stage's hue, and a two-letter monogram says which agent. So a colour tells you something useful
  even for an agent you have not met.
- **State is never a hue.** A ring means running, low opacity means quiet, an ember diamond means it
  needs you, a red ring means it failed. This is what keeps thirteen agent hues from competing with
  the status colours.
- Amber, green, red and blue carry outcomes and gates. Ember marks the human, and nothing else.

**Density is a contrast, not a value.** Tight inside a group, generous between groups. 8px inside a
component, 12px between components, 32px between groups. Rows at 36px, decision rows at 44px. Type
scale at a 1.22 ratio. A 12px floor on anything a person reads.

**Layout adapts by container, not by breakpoint.** If resizing the window would change the answer but
moving the component into a drawer would not, it is a media query. Otherwise it is a container query.

**Voice: never greet, always report.** The first line is a fact, not a pleasantry. No line is ever
addressed to "the user". Full rules and the surface-by-surface table live in the structure
prototype's voice section.

---

## 4. Before calling a surface done

1. **Grayscale it.** If colour was carrying the hierarchy, the hierarchy was never there.
2. **Defend every value.** Any number you cannot explain is a decision not yet made.
3. **Put it beside Linear, Stripe, Vercel, Raycast.** Not "is it as good", but "does it look like it
   came from the same profession".
4. **Point at the one chosen thing.** If you cannot, nobody chose anything.
5. **Grep the hard eleven.** Zero hits for the banned hex families, `background-clip:text`,
   `border-left` accents on cards, nested bordered containers, emoji in chrome, and bounce easing.
6. **Draw the empty state and the failure state.** Day one is the only day every user has.
7. **Check contrast with numbers**, not with your eye.

## Related

- [`engine-room-doctrine.md`](./engine-room-doctrine.md) - the first UX law: calm front, deep engine.
- [`humanized-output.md`](./humanized-output.md) - zero AI fingerprints in authored and generated text.
- [`ui-voice.md`](./ui-voice.md) - outcome naming and calm copy.
- [`../planning/rebuild-2026-07/craft-law.md`](../planning/rebuild-2026-07/craft-law.md) - the brand
  mark rules and the original ban list this supersedes on slop specifically.
- [`../planning/rebuild-2026-07/structure/PROTOTYPE-v2.html`](../planning/rebuild-2026-07/structure/PROTOTYPE-v2.html) -
  the live prototype these rules produced.
