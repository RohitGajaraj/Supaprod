-- Theme growth and conditional decline.
--
-- Clustering could only ever CREATE themes (`clusterSignalsCore` reads unclustered
-- signals, asks the model for groups, INSERTs each one). Nothing could attach a new
-- signal to a theme that already existed, so frequency never accumulated past what a
-- single pass happened to see, and a dismissed theme could never come back, because
-- coming back requires growing and nothing could grow it.
--
-- `discovery.functions.ts` already promised the opposite in prose: "a dismissed
-- cluster is still corroboration if the same complaint returns louder later". These
-- two columns are what make that sentence true.
--
-- The writer is application code: src/lib/ai/theme-growth.server.ts, which now runs
-- ahead of the model inside clusterSignalsCore.

-- How big the theme was at the moment a human declined it. NULL means it was
-- dismissed before this column existed, and shouldEscalate() deliberately treats
-- NULL as "never escalates": re-raising every historical dismissal on the day this
-- ships would bury the user under decisions they have already made.
ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS dismissed_at_frequency integer;

-- When the system reopened a call the human had closed. Distinct from updated_at so
-- the surface can say "this came back" rather than merely "this changed".
ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

-- The growth pass reads candidate themes by (user, status) and orders by recency of
-- the newest member signal. Partial on the growable statuses so merged themes, which
-- are never attachment targets, stay out of the index.
CREATE INDEX IF NOT EXISTS themes_growth_candidates_idx
  ON public.themes (user_id, last_signal_at DESC NULLS LAST)
  WHERE status IN ('new', 'dismissed', 'promoted');

-- The growth pass recounts a theme's frequency from the signals table rather than
-- incrementing a value it read earlier, so this lookup runs once per grown theme.
CREATE INDEX IF NOT EXISTS signals_theme_id_idx
  ON public.signals (theme_id)
  WHERE theme_id IS NOT NULL;
