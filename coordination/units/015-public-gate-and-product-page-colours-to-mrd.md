Unit 015: the OAuth gate and the public product page stop speaking shadcn colours

What was wrong: two surfaces on my paths still coloured themselves through
the retired shadcn vocabulary. The consent gate's explanatory prose read
text-muted-foreground and its failure line text-destructive; the public
product page painted bg-background / text-foreground / text-muted-foreground
across every state including its header band. Both are pages a stranger can
reach without signing in, which makes them the platform's front door, and
the front door was the one place the status vocabulary did not apply.

The work was found half-done in the working tree when this session resumed,
uncommitted from the previous session's end. It was verified rather than
redone: every replacement class has wide precedent on routes (text-mrd-mute,
text-mrd-fail, bg-mrd-bg, text-mrd-body all live elsewhere on my paths), the
mapping is one-to-one (muted to mute, destructive to fail, background/body
to their mrd grounds), and nothing else in either file changed.

Verified: tsc 0 errors, full suite 10650 pass / 0 fail, ratchet test green
with no baseline movement (shadcn classes are not counted markers). Live on
the dev server: /p/nonexistent-slug-check renders the Unavailable state on a
dark ground (oklch 0.145) with muted ink (0.795) and zero console errors;
screenshot at docs/screenshots/u015-public-slug-mrd-tokens.png (gitignored).
The consent page itself needs an authorization_id and a session to render,
so it was verified by construction: same primitive classes, same theme scope
as the verified page.

Queued, not done here: p.$slug still carries the bare .hairline class twice,
and subprocessors.tsx carries it once plus a bg-background/60 header of the
same shape. That belongs to the public-pages pass this unit started, next on
the queue.
