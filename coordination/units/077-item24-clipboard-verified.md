# Unit 077 · R-11 pass 2: item 24's clipboard write exercised (LANE 0 built, nobody had driven it)

**Lane:** LANE 1 as cross-verifier · **2026-08-25** · dev server started for this
check and stopped inside the unit (`lsof :8080` → 0 after `pkill -f "vite dev"`;
note the first `kill` on the nohup PID left vite's node child alive — the
second check caught it, which is why the rule says verify the port, not trust
the exit code).

## What was verified, against production rows on harbor@

Track under test: Round 7's own `e976e60e` (held at Build, full chain through
Design), local dev build at current main.

| Claim in L0-052 | Result |
| --- | --- |
| The control exists and is a real button | ✓ rendered in TrackRunLeft under "Run it" |
| Click writes the clipboard | ✓ `navigator.clipboard.writeText` resolved; success line is inside the `try`, so rendering it PROVES the promise resolved |
| "the control says what it copied" | ✓ `[role=status]`: "Copied. Paste it wherever the review happens." |
| Keyboard reachable + announced (R-19) | ✓ Tab from "Run it now" focuses it; Enter produces the same status line |
| Not a JSON dump | content itself not verifiable in-browser (below); `summaryText`'s shape + the L0-079 dedupe are covered by its four direct tests |

## Adversarial notes (what should have broken it)

- **Clipboard READ-back is impossible in this harness** — `readText()` never
  resolves without an interactive permission grant. Recorded as an instrument
  limit, not a pass: the write's resolution plus the success line is the proof
  available. A human paste remains the one unexercised link.
- **The silent no-data case stands:** if the chain read fails, `copy()` returns
  with NO feedback (`setCopied(null)` renders nothing). A click that does
  nothing visible is R-16 territory ("a failure that names what failed"). One
  line would fix it; the file is LANE 0's, so flagged here rather than edited.
- Item 24's remaining falsifier (control present in a DEPLOYED build) still
  belongs to MAIN's next deploy check.

## Verdict

Item 24: **VERIFIED-LIVE** for render, write-path, announcement and keyboard;
clipboard-content correctness carried by L0-079's tests. Nothing was fixed by
me; two observations handed back to LANE 0 above.

Gates: none owed (no code changed). Server stopped inside the unit.
