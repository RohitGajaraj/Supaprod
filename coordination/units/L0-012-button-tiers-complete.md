# UNIT L0-012: The last retired Buttons take the tier test

**Lane:** LANE 0
**Completed:** 2026-08-23T23:59+05:30
**Commit:** 15a8a775f (11 files)

## What this unit was

Button x8 files, the last control concentration from answers/M10's table:
ask/{AskRunCard,AskGateCard,AskSwitcher,AskPane}, today/PushedInsights,
connections/{ProductBindings,WorkspaceBindings}Section,
trust/ReceiptDetailSheet. Twenty-two sites judged individually.

## The verdicts worth recording

- AskRunCard: Allow it -> Approve (releases a held gate); Not this one ->
  Action default (settles, does not release); Steer it keeps its validity
  disabled beside new busy.
- AskGateCard: three verdicts key busy off WHICH verdict is in flight
  (`pending === "approve"` etc.), sibling block kept as plain disabled.
- AskPane: send is Action primary with the Enter shortcut; mic, disclosure
  and close stay plain.
- Connections: unbinds are Action destructive with busy.

## Two defects caught in the pass

1. First conversion styled kept-plain buttons with the retired sp-btn face
   class - the debt-relocation defect R003 ruled on. Restyled onto
   Meridian chip utilities; fourteen sp-btn wearers across seven files now
   wear Meridian classes directly, two files' counts fall BELOW their old
   baseline because pre-existing sp-btn uses went with them.
2. AskPane's send-control test located by data-variant=primary, an
   attribute of the retired component that died in the swap. Locator
   re-pointed at Meridian marker plus verb; same two facts asserted
   (safe word before anything typed; never the spend word), plus a
   toBeTruthy so a locator regression fails loudly instead of silently.

PushedInsights and ProductBindingsSection drop their shell imports
entirely. BindingPicker's popover trigger (pre-existing sp-btn) also moved
onto Meridian chip classes while in the folder.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,565 / 201 | **2,537 / 199** | design:ratchet over merged disk |
| Button imports from shell/primitives | 8 files / 22 sites | **0** | grep |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Session total for shell/primitives retirement on my paths

Empty, Failed, Loading, Receipt (x23), Gate (x7), Prose (x10), Button
(x8/22 sites): all migrated across units L0-008 through this one. Remaining:
Block x7 and Pre x5, blocked on REQ-L0-005 (meridian-gap ruling).
