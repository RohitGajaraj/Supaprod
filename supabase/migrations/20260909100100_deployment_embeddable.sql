-- Lane 3, 2026-09-08: whether a deployment's URL can be drawn inside a frame.
--
-- ── WHY A COLUMN ─────────────────────────────────────────────────────────────
-- On the shipped run 2fdf93b6 the run screen's right pane drew a blank white
-- iframe for the production URL, because the host answers with a framing
-- policy (X-Frame-Options, or CSP frame-ancestors) that refuses supaprod.ai.
-- The browser will not tell the page why the frame is empty, and the page
-- cannot read the host's headers from inside the browser, so the fact has to
-- be read server-side and kept: one HEAD per deployment, not one per view.
--
-- ── NULL UNTIL CHECKED ───────────────────────────────────────────────────────
-- Three states, and the surface draws each differently: NULL means nobody has
-- looked yet (the pane asks for the check), TRUE means the host allows a frame
-- from our origin, FALSE means it refuses, could not be reached, or answered
-- with an error. A frame that cannot be proven to draw is not offered; the URL
-- is drawn as a door with the provider and the commit instead.
ALTER TABLE public.deployments
  ADD COLUMN IF NOT EXISTS embeddable boolean,
  ADD COLUMN IF NOT EXISTS embeddable_checked_at timestamptz;

COMMENT ON COLUMN public.deployments.embeddable IS
  'Whether deploy_url may be drawn inside a frame on supaprod.ai, read from the host''s X-Frame-Options and CSP frame-ancestors. NULL until checked; FALSE also when the host could not be reached or answered with an error.';
COMMENT ON COLUMN public.deployments.embeddable_checked_at IS
  'When embeddable was last read from the host. NULL until checked.';
