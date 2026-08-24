Unit 035: one triage feed

REQ-016 item 1. "Ready for your review" and "What the crew has been
doing" are one triage card under the glance strip now, read calls
first, then runs blocked on you, then live, then finished - the
reversibility order across both sources at once. Every run row states
its verb beside its state (Reply / Stop / Open); the queue keeps its
own Approve/Send back/Decline/Snooze because those ARE the review act,
so the section heading names the group instead of printing a second
Review label over controls that already say it. The Lane wrapper is
deleted in the same change; AgentInbox stays mounted by its gallery.

Kept: a/d/z plus j/k queue keys (DecisionQueue untouched), cancel
behind the app confirm, reply scoped to blocked rows and composed
beside the row before openAsk sends it (openAsk SENDS its argument,
so the compose step may never be skipped), receipts not toasts.
Feed rows carry one tab stop with j/k of their own; the handler stops
propagation so both lists can never move on one keypress.

Also fixed here because the gate was red at HEAD: Unit 034's glance
strip keyed its tiles off the union (`loading`), which broke
today-states-its-wait and the surface's own each-read-waits-on-itself
rule. Each tile now waits on its own read.

tsc 0 - docs pass - build passes - full suite green except the known
public-hooks auth flake (fails only in the full run, passes isolated)
- today-states-its-wait extended to the merged feed, 28 cases green -
ratchet flat, no new debt - on main.
