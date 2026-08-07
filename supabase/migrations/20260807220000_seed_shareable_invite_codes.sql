-- Five more invite codes, one per audience, so a link can be handed out without
-- minting one first.
--
-- WHY SEPARATE CODES RATHER THAN ONE SHARED ONE. The redemption count is the
-- only attribution we get. One code handed to everybody answers "did anyone come
-- in", which we already know from the accounts table. Five codes answer "did the
-- investor list convert better than the press list", which is a question worth
-- being able to ask in three weeks and impossible to reconstruct afterwards.
-- It is also the blast radius: a code posted publicly by accident is revoked on
-- its own without shutting the door on the other four audiences.
--
-- WHY THE CAPS DIFFER. `max_uses` is set to roughly what each audience could
-- honestly consume, because an exhausted code is a signal (the list was bigger
-- than we thought, or it leaked) and an unlimited one never tells us anything.
-- The two that stay uncapped are uncapped for real reasons, noted on each.
--
-- WHY NO EXPIRY ON MOST OF THEM. An expiring code fails in the worst possible
-- place: a partner opens a deck three weeks after the meeting and the link is
-- dead, with no way to tell that from the product being broken. Revocation is
-- the deliberate act; expiry is an accident waiting on a calendar. PRESS is the
-- one exception and it says why.
--
-- THE SHAPE, and it matters. Every code is a readable stem plus a six-character
-- random tail. The stem is so the founder can tell at a glance which one he is
-- pasting; the tail is what makes it unguessable, because a stem alone would be
-- worked out in an afternoon by anyone who had read the landing page. Lookup is
-- case-insensitive, so casing on a card or in an email never has to survive.
--
-- Human-readable index with the full links: docs/growth/invite-codes.md
insert into public.invite_codes (code, note, max_uses, expires_at, revoked)
values
  (
    'SP-INVESTOR-M4XT2B',
    'Investor outreach outside YC. Angels, seed funds, warm intros. Capped at 60 because that is larger than any list we can actually work, so hitting it means the code travelled further than intended and is worth a look.',
    60,
    null,
    false
  ),
  (
    'SP-ACCEL-R9WQ7D',
    'Accelerator and incubator applications other than YC (Betaworks, South Park Commons, Seedcamp, AngelPad, Launch House). One programme can involve several partners reading, so 40 is generous on purpose: a blocked reviewer is a dead application.',
    40,
    null,
    false
  ),
  (
    'SP-PRESS-H3KN8F',
    'Journalists and newsletter writers. THE ONE CODE WITH AN EXPIRY, and deliberately: press access is granted for a story, and a code that outlives the story is a code sitting in a Slack channel at a publication. 90 days, re-mint on request.',
    25,
    now() + interval '90 days',
    false
  ),
  (
    'SP-FOUNDER-V6PL5J',
    'The founder personal share link. Warm intros, people met at events, anyone he wants in without asking anybody. UNCAPPED on purpose: this is the one that must never fail in his hands mid-conversation.',
    null,
    null,
    false
  ),
  (
    'SP-DESIGNPARTNER-Q2ZY9C',
    'Design partners: the small cohort we actually want to watch settle outcomes with. Capped at 15 because that is the number one person can genuinely support, and the cap is the point rather than a limit we hope not to reach.',
    15,
    null,
    false
  )
on conflict do nothing;
