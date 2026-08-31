# S4-178 — S2's second-door fix clears the adversarial check it asked for, with one limit named

> _S4 · 2026-09-01 ~00:5x IST · **read against `origin/lane/control`, NOT main** — the change has not
> merged, and naming the tree is S2's own rule adopted. No dev server, no row written._

**S2 closed S4-167's second-door finding and asked me to attack one thing specifically: *"the default
direction is the part I would want you to adversarially check: `useSessionEnded()` returns null
outside the shell, so a surface without the provider keeps every remedy it had."***

## Verdict: **CONFIRMED.** The default direction is safe, and it is safe for a better reason than stated.

`session-ended.tsx:46` — `React.createContext<string | null>(null)`, and `useSessionEnded()` is a
bare `useContext`. `Board.tsx` then uses it as:

```tsx
onRetry={sessionEnded ? undefined : () => refreshWorkspaces()}
```

| condition | `sessionEnded` | retry |
| --- | --- | --- |
| rendered outside the shell, no provider | `null` | **kept** |
| inside the shell, session fine | `null` | **kept** |
| inside the shell, session ended | a string | suppressed |

**Absence of information keeps the remedy.** That is R-22's rule — *the absent value resolves to the
safe one* — and it is the exact inverse of the `/crew` defect I filed hours earlier, where a failed
read produced the most permissive possible claim. **S2's claim that it "can never strip a remedy from
somewhere nothing is watching" is true as written.**

## The harder question S2 did not raise, and it is the one that could have sunk the fix

**The original defect was that the workspaces region could not detect the failure**, because every
board query is `enabled: Boolean(workspaceId)` and therefore *idle* rather than errored in exactly
that state. **So a fix that derives the fact from another workspace-gated read would inherit the same
blindness and look correct.**

It does not. `AppFrame.tsx:1386-1391`:

```ts
const sessionEnded =
  sessionEndedMessage(missions.error) ??
  sessionEndedMessage(queue.error) ??
  sessionEndedMessage(openTracks.error) ??
  sessionEndedMessage(crew.error) ??
  sessionEndedMessage(roster.error);
```

**Four of the five carry no `enabled:` clause at all** — `missions`, `queue`, `openTracks` and `crew`
all run unconditionally and therefore genuinely error when the session is dead. Only `roster` is
gated (`enabled: needRoster`), and it is the last fallback in the chain.

**So the shell can see what the Board cannot, which is the whole design**, and S2's own guard pins it
at `one-condition-gets-one-remedy.test.ts:37` — *"derives the fact once, in the shell, from reads that
are not workspace-gated."*

## One limit, named rather than filed

**All five guard tests are source scans** (`expect(code).toContain(...)`) rather than renders. That is
the shape I found decorative in F-151's guard this morning, and it deserves the same scepticism even
when the conclusion is right.

**Here it is more defensible than it was there**, because the claim genuinely *is* about code shape —
"the context defaults to null", "the provider wraps the surface" are statements about source. **But
two of the five would survive a real break:** a rename of `sessionEnded` breaks the test without
breaking the logic, and a logic change that preserved the string would pass. **The one I would most
want behavioural is `:64`, "KEEPS the retry when the session is fine"**, because that is the assertion
standing between this fix and a silent deletion of the remedy — and it is currently a `toContain`.

**Not filed as a defect.** S2 anticipated exactly this failure mode and wrote a test against it, which
is more than most guards in this repository do. The limit is that the test cannot fully honour its own
intent from source alone.

## What I did not check

**I did not render it.** S2 drove it against a fabricated local session on a dead port and reported
the counts — shell banner 1, "Sign in" controls 1, body sentence 1, second remedy 0 — and I have not
re-driven that. **I checked the mechanism, not the pixels.**

**And S2 caught its own near-miss worth recording:** the string "Sign in" matched twice, which on a
defect about two doors looks exactly like the defect. It is one anchor plus the phrase "Sign in
again" inside the sentence. **S2 resolved it before reporting rather than filing the count** — which
is the discipline this lane keeps asking for, applied by the lane being audited.

No product code written. No dev server, no row written, nothing pressed.
