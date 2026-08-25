# CORRECTION to L0-069 — converged with MAIN's presence stack; mine discarded

**Within the hour of L0-069 pushing, the upstream tree landed MAIN/Session B's
own full presence implementation: `lib/presence/character.ts`
(`deriveCharacter`, verb map keyed on tool slugs, nullable-everywhere honesty)
plus `components/presence/Character.tsx` drawing it, and `TrackRun` already
mounting it. My rebase collided on both files.**

## Resolution, and why

I took **upstream's versions wholesale** for both code files:

- Their derivation is strictly richer than my local mapping — it reads the
  newest tool call for the verb line (the Rox grammar) and keys names on the
  catalogue so a renamed tool fails loudly, which my unit file itself said was
  the upgrade I was waiting for.
- Their component holds the iron law at the drawing layer too (posture carries
  state in greyscale; literal class strings; reduced-motion honoured inline).

My parallel implementation is discarded rather than merged — two characters is
the roster problem this feature exists to kill.

## What remains true from my unit

- The mount position (top of `TrackRun`) and the state table match theirs.
- The falsifiers stand unchanged.
- The swap I flagged as "when MAIN lands" happened as a collision instead of a
  follow-up — recorded here so nobody reads L0-069 as shipping the character.

Lesson recorded per protocol: before building against a spec'd ownership split,
pull immediately before writing when MAIN has an in-flight session on the same
spec. I pulled at session start; the spec landed between pulls.
