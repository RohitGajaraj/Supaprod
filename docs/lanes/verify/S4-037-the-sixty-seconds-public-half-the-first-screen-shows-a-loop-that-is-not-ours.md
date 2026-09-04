# S4-037 · The sixty seconds, public half: the first screen shows a seven-station loop that is not this product's

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27, on `lane/proof`. **Standing question 2**, partially answered for the first time,
> by rendering the page rather than reading its source._

## How this was measured, and what it is not

I had been reporting standing question 2 as blocked on a missing `.env`. **That was true of the
signed-in product and false of the public landing**, and I should have tested it sooner instead of
inheriting the assumption.

What I did: wrote a **dummy** `.env` pointing at `http://localhost:54321`, where nothing is
listening, so no call could reach production. Started the dev server on `:8080` after checking both
ports were free, fetched `/`, saved the HTML, **killed the server immediately**, removed the dummy
`.env`, and analysed the saved file offline. Ports confirmed clear afterwards. The landing route
returned **HTTP 200**, so it boots with no real credentials at all.

**Stated limits, because they change what this verdict can claim.** The Chrome extension is not
connected to this session, so there is **no browser**: no screenshots, no visual hierarchy, and **no
10s / 30s / 60s timing**. What follows is measured from the server-rendered HTML, which is what a
browser paints first and therefore what a stranger reads first, and nothing more. **The signed-in
sixty seconds remains unmeasured** and still needs real credentials.

## The finding

**The hero strip on the first screen shows seven stations, and they are not this product's seven
stations.**

The product's stations, `src/lib/agent-vocabulary.ts:171-179`:

```ts
export const AGENT_STATION_ORDER: AgentStation[] = [
  "sense", "decide", "define", "design", "build", "ship", "learn",
];
```

with the surface names ruled in operating model §12 as **Discover · Decide · Plan · Design · Build ·
Ship · Learn**, and the rule stated in the same breath: *"The internal slugs (`sense`, `define`)
never appear on a surface; the surface names above do."*

The hero strip, `src/components/landing/HeroLoopDemo.tsx:24-32`, rendered and confirmed in the
served HTML:

| Hero strip shows | Reality |
| --- | --- |
| **Sense** | an internal slug §12 forbids on any surface |
| **Discover** | **not a station.** `discover` is not in `AGENT_STATION_ORDER` at all |
| Decide | correct |
| **Define** | an internal slug §12 forbids; the surface name is **Plan** |
| Design | correct |
| Build | correct |
| Ship | correct |
| *(absent)* | **Learn is missing entirely** |

Three distinct problems in one strip:

1. **It invents a station.** `Sense` and `Discover` appear as two separate steps. They are one step:
   `sense`, surfaced as "Discover". A stranger counting the loop counts one station that does not
   exist.
2. **It puts two internal slugs on the most public surface there is**, which is precisely what §12
   forbids and precisely where the positioning audit said the drift is worst.
3. **It drops `learn`.** That is not one station among seven. It is the station that produces the
   verdict against the forecast, which `README.md` and `CLAUDE.md` both call the moat. The hero copy
   three lines above the strip says *"grades it. guides the next call."* — and the illustration of
   that loop stops at Ship.

**And the same page contradicts itself.** Further down, the "The full loop" section renders the
correct canonical seven: **Discover · Decide · Plan · Design · Build · Ship · Learn.** So a stranger
scrolling one screen is taught two different vocabularies for the same loop, and the one they meet
first is the wrong one.

## What a stranger actually reads first, in order

From the served HTML, the opening sequence:

```
Supaprod: agents that know what to build, ship it, and guide the next call   ← <title>
For product managers who ship with agents
Supaprod tells you what to build. then builds it. ships it. grades it. guides the next call.
Agents that own outcomes. Not just output.
AUTONOMOUS EXECUTION
One sentence. Seven stations. Fully automatic.
No clicks mid-run. No human intervention. Agent decides, builds, ships.
💬 "Improve onboarding flow based on user feedback"
Sense · Discover · Decide · Define · Design · Build · Ship
⟳ At Sense
stations done)
OUTPUT
Starting agent work…
```

Three things about that block, beyond the station names:

- **"AUTONOMOUS EXECUTION"** and **"No clicks mid-run. No human intervention."** are confirmed
  rendered on the public page. `S4-028` covers why that is the claim R-18's acceptance query has
  returned **0** for three months, and that "autonomous" is banned in product copy outright.
- **`stations done)`** is a dangling fragment with an unmatched parenthesis. The server renders the
  tail of a sentence whose numbers are missing, so the very first screen ships visibly broken copy.
  Small, and it is the kind of thing a stranger reads as "unfinished".
- **The pitch above the strip is right.** *"Agents that own outcomes. Not just output."* and
  *"grades it. guides the next call."* are the honest, differentiated claim. The strip underneath
  then illustrates a loop that cannot grade anything, because it has no Learn.

## Why this one matters more than its size suggests

The founder's second acceptance is *"a person who has never seen this product opens it and, inside
sixty seconds, knows what it is doing for them."* At ten seconds a stranger has read the headline and
is looking at the strip. **The strip is the product's own diagram of itself, and it is wrong in three
ways at once** — an invented station, two internal slugs, and the missing station that carries the
entire differentiation.

The fix is a constant. `HeroLoopDemo.tsx:24-32` should be the seven from `AGENT_STATION_ORDER` under
their §12 surface names, and if the strip is derived from that constant rather than duplicating it,
the class cannot come back.

## Verdict

**Standing question 2, public half: MEASURED, and it does not hold.** Not because the page is ugly or
slow, which I cannot judge without a browser, but because the first illustration a stranger sees
describes a different product from the one the copy above it promises and the one the code implements.

**Not fixed.** `landing/**` is S3's, and this is outward-facing, so `docs/pitch/`'s rule applies:
nothing outward ships without the founder's approval. Filed with the constant to change.

**Still owed:** the signed-in sixty seconds, which needs real credentials, and any timing or visual
judgement, which needs a browser this session does not have.
