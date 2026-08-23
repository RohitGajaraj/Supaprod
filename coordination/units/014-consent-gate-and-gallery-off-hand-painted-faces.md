Unit 014: a real gate, an admin holdout, and the gallery stop restating its own system

What was wrong, three ways:

1. The OAuth consent page painted Approve and Deny with shadcn tokens
   (`bg-primary`, `text-primary-foreground`) on the one surface where an
   outside app asks to read data as you. A security gate speaking a rival
   vocabulary, with both controls sharing one boolean `busy` so neither
   could say which decision was actually running.
2. admin.observability still wore `.btn btn-secondary btn-sm` on its Send
   test control, a leftover of the same retired .btn system unit 013
   cleared off auth.
3. The Meridian gallery itself carried a local `Button` hand-painting
   `bg-mrd-solid` for three setup doors ("Create a workspace", "Link a
   source", "Turn on grouping"). Its own comment said these states are not
   decisions and never take the accent, yet the paint was Action's PRIMARY
   face: the strongest face in the system, on non-decisions, in the file
   meant to teach the difference. It was written before the tiers existed.

Changes:

- consent: Approve to Action primary, Deny to Action default. Pending
  state is now `"approve" | "deny" | null`, so both controls still lock
  while either decision runs (behaviour preserved exactly) and the pressed
  control alone announces aria-busy, which a shared flag structurally
  could not say.
- observability: Action default, mixed disabled expression kept whole,
  busy={test.isPending} added per the primitive's contract.
- meridian.tsx: local part deleted, call sites use `<Action>` directly;
  the comment records why the face changed from solid to bordered, because
  the gallery's job is demonstrating the real vocabulary rather than a
  private restatement of it.

Left alone: engine-room.tsx's sync-conflict card and crew.tsx's member
card are full-width card-buttons with rich content inside, same class as
brain's stat cells; converting them would break their layout contracts for
no tier gain.

Verified: tsc 0; full suite 10,733 pass / 0 fail; /meridian driven live,
all three doors compute the bordered default face at h32 with no solid
slab remaining.
