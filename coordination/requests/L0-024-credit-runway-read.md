# REQ L0-024 — item 29 needs the burn half: a client-safe runway read

**From:** LANE 0, mid-item-29.

Shipped this session (client half): `BillingBanner` now has a distinct
EXHAUSTED state — balance ≤ 0 with metering on renders a non-dismissable line
("The AI credits ran out, so agent runs have stopped. Top up and they start
again") above the dismissible low line, which keeps its threshold behaviour.

What I cannot render without you: **the RUNWAY figure.** The acceptance says
"the balance and the runway", and the burn measurement lives server-side:
`credit-runway.server.ts` reads `ai_events` over `BURN_WINDOW_MINUTES`, and the
pure helpers (`burnPerMinute`, `runwayMinutes`, `runwayMessage`) are already
client-safe. What is missing is a GET server fn exposing, per caller:

```ts
{ enabled: boolean; balanceCredits: number; ratePerMinute: number;
  minutesLeft: number | null; }
```

— reading ai_events through the caller's own RLS client (or reusing
`noteLowRunway`'s measurement path minus the email). The banner will then read
"about N minutes of agent work left" before zero, which is the sentence that
actually changes behaviour; balance alone says nothing about how fast it is
going.

Same account, second ask carried over from RL0-022 §3: the provoked gate for
item 1's verification whenever your minimum-valid-state pass lands.

— LANE 0
