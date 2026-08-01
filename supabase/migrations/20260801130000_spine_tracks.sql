-- The spine track: the one thing that walks all seven stations.
--
-- THE DECISION (2026-08-01, delegated by the founder: "you decide what is the
-- best call... from a holistic perspective, not just from today's").
--
-- Until now no single entity walked the loop. signal -> theme -> opportunity ->
-- prd -> prototype -> mission -> deployment -> learning is eight tables chained
-- by artifact_lineage, and a station transition was a client-side navigate call.
-- Two options were on the table: derive the route from the lineage chain, or
-- make one first-class object that spans the spine.
--
-- IT IS THE OBJECT, and one fact decided it. Work that enters at Plan for an
-- existing product HAS NO LINEAGE ROOT: there is no signal and no theme behind
-- it, because the problem was settled before the product ever saw it. A
-- lineage-derived identity cannot exist for that case at all, and that case is
-- the single most common one for any real customer. An architecture that cannot
-- represent "add SSO to the product we already run" is not an architecture.
--
-- Three more reasons, in the order they matter:
--   1. A handoff needs a subject. "Move it to the next station" has no referent
--      when the thing is a set of rows.
--   2. An agent needs a handle. You can hand an agent a track id; you cannot
--      hand it a graph traversal and expect two agents to agree on its bounds.
--   3. A person needs one address. The learning curve of this product is the
--      number of nouns in it, and "your work is eight different things
--      depending on which page you are on" is the expensive version.
--
-- THE CONSTRAINT THAT KEEPS IT HONEST, and it is why this is not a second
-- source of truth: A TRACK NEVER DUPLICATES ARTIFACT CONTENT. artifact_lineage
-- remains the sole truth for what-came-from-what. A track owns only the three
-- things lineage structurally cannot express:
--   - IDENTITY: this is one piece of work, and here is its address.
--   - INTENT: why it exists (origin), which lineage has no room for and which
--     Learn needs in order to grade anything that entered below Discover.
--   - THE ROUTE: which stations it will visit, which are waived and why.
-- Lineage is a fact about the past. A route is a plan about the future. They
-- have different lifetimes, so they get different tables and cannot drift:
-- they answer different questions.
--
-- WHY NOT REUSE `missions`. The founder already caught the cost of overloading
-- that noun ("if /runs is for /build then what happens to the other 6?").
-- Missions only exist once work reaches Build, so four stations would have no
-- representation, which is the exact defect being fixed.
--
-- ZERO LEARNING CURVE BY CONSTRUCTION. A person never creates a track. It is
-- created for them by the act they were already performing: keeping a cluster
-- on Discover, or starting work on an existing product. The noun can stay
-- almost invisible; what the user notices is that the spine strip now follows
-- their work instead of describing the workspace.

CREATE TABLE IF NOT EXISTS public.spine_tracks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  workspace_id uuid NOT NULL DEFAULT current_user_default_workspace(),
  -- Product scope, carried so a track is visible in the same product view its
  -- artifacts are. Nullable for workspace-level work with no product yet.
  product_id   uuid,
  project_id   uuid,

  title        text NOT NULL,

  -- WHY THIS WORK EXISTS. Required in the application layer whenever
  -- entry_station <> 'sense' (validateRoute enforces it), because work that
  -- skipped Discover has no evidence behind it and Learn would have nothing to
  -- grade the outcome against. Left nullable in the schema so a track promoted
  -- from a cluster, whose origin IS its evidence, does not carry a redundant
  -- sentence.
  origin       text,

  entry_station text NOT NULL DEFAULT 'sense',

  -- THE ROUTE. Shapes match src/lib/spine/route.ts exactly:
  --   path   : ordered subset of the spine, spine order always
  --   waived : [{station, reason, by, reopensWhen}]
  -- Stored as jsonb rather than as two more tables because the route is read
  -- and written as a whole, never queried by its parts, and a waiver has no
  -- identity of its own.
  path         jsonb NOT NULL DEFAULT
                 '["sense","decide","define","design","build","ship","learn"]'::jsonb,
  waived       jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Where it stands now. DERIVED AND CACHED, never the truth: the artifacts
  -- reached through artifact_lineage are. Stored so the board and the strip can
  -- read a workspace's positions without a graph walk per row.
  station      text NOT NULL DEFAULT 'sense',

  -- open | done | abandoned. A track that ends is not deleted, because the
  -- record of work that was stopped is worth as much as the record of work that
  -- shipped.
  status       text NOT NULL DEFAULT 'open',

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Which artifacts belong to this track.
--
-- This is an INDEX, not a duplication of lineage. Lineage answers "what came
-- from what"; this answers "what is part of this one piece of work", which
-- lineage cannot answer for a track that entered mid-loop and therefore has no
-- root to walk from. Kind + id rather than seven nullable foreign keys, so
-- adding an eighth artifact kind is not a migration.
CREATE TABLE IF NOT EXISTS public.spine_track_members (
  track_id      uuid NOT NULL REFERENCES public.spine_tracks(id) ON DELETE CASCADE,
  artifact_kind text NOT NULL,
  artifact_id   uuid NOT NULL,
  -- The station this artifact belongs to, so a track can be read station by
  -- station without a kind-to-station lookup in three languages.
  station       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (track_id, artifact_kind, artifact_id)
);

CREATE INDEX IF NOT EXISTS spine_tracks_workspace_status_idx
  ON public.spine_tracks (workspace_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS spine_tracks_station_idx
  ON public.spine_tracks (workspace_id, station) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS spine_track_members_artifact_idx
  ON public.spine_track_members (artifact_kind, artifact_id);

ALTER TABLE public.spine_tracks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spine_track_members ENABLE ROW LEVEL SECURITY;

-- Same ownership shape every other artifact table in this schema uses.
DROP POLICY IF EXISTS "own tracks all" ON public.spine_tracks;
CREATE POLICY "own tracks all" ON public.spine_tracks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Membership is reachable exactly when its track is. No second ownership rule
-- to keep in step with the first.
DROP POLICY IF EXISTS "own track members all" ON public.spine_track_members;
CREATE POLICY "own track members all" ON public.spine_track_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.spine_tracks t
             WHERE t.id = spine_track_members.track_id AND t.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.spine_tracks t
             WHERE t.id = spine_track_members.track_id AND t.user_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spine_tracks        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spine_track_members TO authenticated;
GRANT ALL ON public.spine_tracks        TO service_role;
GRANT ALL ON public.spine_track_members TO service_role;

-- NO BACKFILL, deliberately.
--
-- Existing artifacts keep working exactly as they do today: every surface still
-- reads its own table and lineage still answers provenance. Tracks are additive
-- and appear as new work is started, so this migration cannot break a single
-- existing read. Backfilling historical chains into invented tracks would be
-- asserting an intent nobody recorded, on a product whose whole claim is that
-- it does not do that.
