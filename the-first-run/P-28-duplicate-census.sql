-- P-28 (A-QUEUE.md): "The duplicates the loop wrote are superseded on the record."
-- Read-only census run 2026-09-03 (A3), against the live database via the Lovable MCP.
-- NOT YET EXECUTED. A1 rules on this census before anyone runs part 2.
--
-- Grouping matches the run screen's own live "N of them repeat M things already
-- filed" sentence exactly: src/components/track/what-it-produced.ts (whatItProduced)
-- and src/lib/spine/chain.ts (buildChain, ARTIFACT_SOURCE). Per (track_id, station,
-- LOWER(TRIM(title))), among members whose artifact_id resolves to a real row
-- (an unresolved artifact_id is "missing", a different fact, excluded here exactly
-- as whatItProduced excludes it via `present = members.filter(m => !m.missing)`).
-- A blank/whitespace-only title never joins a group, matching `if (t) byTitle.set(...)`.
--
-- SCHEMA FACTS CONFIRMED LIVE, CORRECTING THE PACKET'S OWN ASSUMPTIONS:
--   spine_track_members has NO `id` column. Its primary key is the composite
--   (track_id, artifact_kind, artifact_id) -- spine_track_members_pkey. The write
--   below targets that composite, not a single id.
--
--   `superseded_at` ALREADY EXISTS, and already carries a DIFFERENT live meaning:
--   rewindTrackTo (src/lib/spine/track.functions.ts:3959-3964) sets it when a
--   person manually rewinds a track past a station ("undo a step, not the run").
--   A partial index (spine_track_members_standing_idx ON (track_id, station)
--   WHERE superseded_at IS NULL) already backs other live reads (driver.server.ts,
--   track.functions.ts) that filter .is("superseded_at", null) for "what is
--   currently standing." Two rows are already non-null today, both from one real
--   rewind on track 6199f3df-989d-4603-a037-fc5d919d9a13 (a changeset and a
--   mission, both 2026-08-26 18:08:10.026+00) -- unrelated to the duplicate-write
--   bug, and verified to have zero overlap with the 171 rows below.
--   THIS MEANS: marking the 171 rows below superseded will change what those
--   OTHER reads see (e.g. whichever reader resolves "the mission for this track"),
--   not only the run screen's own repeat sentence, which does not filter on
--   superseded_at at all today. That is presumably the intended effect of this
--   packet, but it is a second-order consequence beyond "clean up the sentence,"
--   and it means this write shares one column's meaning across two different
--   product concepts (a person's deliberate rewind, and an automated duplicate
--   cleanup) rather than using a column of its own. Worth A1's explicit read
--   before running it.
--
--   `deployment` has ZERO rows in spine_track_members at all (not zero
--   duplicates -- the kind is simply never written), across every workspace,
--   sample or not. The Ship-station tool that would file one appears never to
--   have fired live. Unrelated to this packet; flagged for its own look.
--
-- RESULTS. 226 member rows sit in 55 duplicate groups across 15 tracks, in
-- non-sample workspaces only (1,034 of 1,642 raw rows, in sample workspaces,
-- correctly excluded). 171 rows are candidates to supersede; 55 survive (the
-- newest per group). By kind (in groups / supersede / survive): signal
-- 121/102/19, prototype 27/19/8, task 29/17/12, decision 18/14/4, theme
-- 15/10/5, prd 16/9/7. changeset/mission/learning/deployment: zero collisions.
--
-- The packet's own example track, 2fdf93b6-eb95-4511-b6f4-f74d94a6d39c
-- ("Checkout asks a homeowner to re-enter the delivery address it already has
-- on file"), confirms "four prds and eight prototypes" as raw counts, with one
-- nuance: those are two separate DIFFERENT-TITLE pairs/quads (a title with a
-- metrics clause appended a day later counts as its own group), not one group
-- of 4 and one of 8.

-- ============================================================================
-- PART 1: THE CENSUS (read-only, already run)
-- ============================================================================
WITH resolved AS (
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, s.title AS title, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN signals s ON s.id = m.artifact_id WHERE m.artifact_kind = 'signal'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, t.title, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN themes t ON t.id = m.artifact_id WHERE m.artifact_kind = 'theme'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, p.title, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN prds p ON p.id = m.artifact_id WHERE m.artifact_kind = 'prd'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, tk.title, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN tasks tk ON tk.id = m.artifact_id WHERE m.artifact_kind = 'task'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, c.title, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN studio_changesets c ON c.id = m.artifact_id WHERE m.artifact_kind = 'changeset'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, mi.title, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN missions mi ON mi.id = m.artifact_id WHERE m.artifact_kind = 'mission'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, d.title, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN decisions d ON d.id = m.artifact_id WHERE m.artifact_kind = 'decision'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, pr.name, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN prototypes pr ON pr.id = m.artifact_id WHERE m.artifact_kind = 'prototype'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, l.summary, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN learnings l ON l.id = m.artifact_id WHERE m.artifact_kind = 'learning'
  UNION ALL
  SELECT m.track_id, m.station, m.artifact_kind, m.artifact_id, dp.deploy_url, m.created_at, m.superseded_at
  FROM spine_track_members m JOIN deployments dp ON dp.id = m.artifact_id WHERE m.artifact_kind = 'deployment'
),
scoped AS (
  SELECT r.* FROM resolved r
  JOIN spine_tracks st ON st.id = r.track_id
  JOIN workspaces w ON w.id = st.workspace_id
  WHERE w.is_sample = false AND r.title IS NOT NULL AND btrim(r.title) <> ''
),
grouped AS (
  SELECT scoped.*,
    lower(btrim(title)) AS title_key,
    count(*) OVER (PARTITION BY track_id, station, lower(btrim(title))) AS grp_size,
    row_number() OVER (PARTITION BY track_id, station, lower(btrim(title)) ORDER BY created_at DESC, artifact_id DESC) AS rn
  FROM scoped
)
SELECT * FROM grouped WHERE grp_size > 1;  -- rn=1 is the survivor, rn>1 are supersede candidates

-- ============================================================================
-- PART 2: THE PREPARED WRITE (NOT executed -- pending A1's ruling on Part 1's
-- superseded_at semantic-overlap finding above)
--
-- Dry-run verified as a read-only SELECT COUNT(*) against this exact VALUES
-- list joined the same way: returned 171, confirming every triple below exists,
-- resolves, and currently has superseded_at IS NULL (nothing already handled,
-- nothing mistyped). The IS NULL guard also makes this idempotent to re-run.
-- ============================================================================
UPDATE spine_track_members AS m
SET superseded_at = now()
FROM (VALUES
  ('2fdf93b6-eb95-4511-b6f4-f74d94a6d39c','prd','dd0a33e8-a5dd-48a8-9a12-5124c067ba2f'),
  ('2fdf93b6-eb95-4511-b6f4-f74d94a6d39c','prd','378d26ea-893e-4c09-8285-53f6360a2f43'),
  ('2fdf93b6-eb95-4511-b6f4-f74d94a6d39c','prototype','28c96b6a-31ad-4986-8fc0-3faa8c9164d2'),
  ('2fdf93b6-eb95-4511-b6f4-f74d94a6d39c','prototype','56e7512a-09cd-4bfd-b8d1-1554f84bd3e5'),
  ('2fdf93b6-eb95-4511-b6f4-f74d94a6d39c','prototype','29b78d0a-ac1c-4244-ac60-0505fdce8d42'),
  ('2fdf93b6-eb95-4511-b6f4-f74d94a6d39c','prototype','8bd89ad1-16c9-40d7-bcab-dc5015977071'),
  ('2fdf93b6-eb95-4511-b6f4-f74d94a6d39c','prototype','1a028129-4b80-44f3-9a20-b62f84d92c72'),
  ('2fdf93b6-eb95-4511-b6f4-f74d94a6d39c','prototype','b3d95cb5-de46-44d3-8d19-317f0d8b190b'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','b5ba6d1d-4f2c-44b1-8f0f-9a7519181028'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','5b74c04d-8842-4be8-878a-30086132f6fb'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','16034566-4447-4cc3-9ea8-4176a03d0cf7'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','418c69ef-ca90-4346-8839-f680b16986cb'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','08594a26-1bd5-4d56-ba42-51f648fc45ea'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','57926dac-ee11-4ba6-a0c6-b6acaa6f70ca'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','cce2a2fb-df4d-4f0f-815e-cd703b5d3e29'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','7f586db3-2a24-4790-9212-46e8fdebcf51'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','1c6d6218-c4bd-46fb-8ae4-32d895c9d785'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','03b01dca-008d-4e4a-9a51-e2a90e7fcb70'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','0552a0e6-a624-41f3-9b60-85da0c75e9cb'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','4a215be6-02ed-4c17-b8d9-c39b61a71c07'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','5cc52689-d694-48ed-9e78-e8861f4630ff'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','e9fab1ac-ec54-4426-90d1-45a18d550e32'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','theme','625e3fce-234e-4b39-80e0-81b2955131db'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','theme','945ff018-d304-49ba-9759-c7d5bba30559'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','theme','b78b2a21-9a4d-48a2-acbd-455a635ea84c'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','ad672a02-75a1-44d4-aefc-41d5c0fcda8c'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','d76e81ce-25d3-420a-988d-cf289091819c'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','12ace695-b0ee-4833-8712-1d8f88363973'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','f72908bc-b91b-43a8-b9ef-4d97f1161263'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','febe228c-6de8-448c-a30e-b43777006c81'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','1f38f88e-020d-4f70-9449-5cc116fe60e7'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','fd575ab2-64d2-42d1-95a7-70912aede9fe'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','2deee1e3-3258-4d0b-bae4-d3d23f582740'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','1df5a562-fed3-4bba-8a4c-f27b866daff1'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','e0cd2a4f-ddf1-40b0-9e98-5ff60887d3c2'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','82eec40f-e3fe-47fe-ad62-76849879563c'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','e522ef1c-400f-421c-9e1a-074ff0b38e88'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','95812221-3e19-4142-a59a-0c4249b61081'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','70e11813-09f5-4759-965d-624b761d815b'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','69f4c58a-4eda-4dc1-a4ed-99c9d64b4729'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','3ff338d6-e62e-4f06-884c-6a6a0a02e4ab'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','bcf5d530-4a5b-4cf7-a65d-f3bde3cb2a1d'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','37cf9cbd-f8e5-4bf1-8855-2fb0fbb08ec1'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','fc99b832-cabb-46a7-ae99-00296bb3cf1f'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','aa8abc11-2376-4a1d-b2c4-2f1f2594adc7'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','faf7ad27-d29e-4c3d-9696-5cf056341d26'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','43cf6976-5617-4897-84ab-a89a5e4ce1b2'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','e5467ffb-99d4-4f77-9449-425793c0ec1c'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','dae370b7-6b1f-4ed7-9690-c65d0f0fe9ce'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','c6e45f86-ac09-40ef-aaf2-636a645c9890'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','620ed8e1-b0ee-4e5d-a9e2-2a14493d765a'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','43f9cd80-9206-4685-8611-e07c11fed90f'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','2d078233-a122-4a27-83e4-d6283ec0fd66'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','5da5ffee-7863-4a2c-aade-f8aa1a885f0a'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','theme','e630754b-aa37-4a3b-a3dd-8ec4e096974c'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','theme','87f20e1b-1108-4fc0-a94e-ace0a7dfade0'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','theme','91930984-9e14-493d-a3fb-d56532f51b50'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','theme','d0f466c2-0bf9-4a70-8dc6-3776e4a7a55f'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','theme','b23d09ff-0352-4674-99b1-de21ca099b7a'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','611cc7ee-6511-455c-8c8b-3bb8d49e1203'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','f86c879a-74d7-4bcd-96d0-bbb35297fc3c'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','e878ec88-7090-40e0-8732-6f5fddb77873'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','440b34d5-3524-4fd7-86d7-882ec25f397d'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','d2a7536b-1464-4401-971d-bec3cd06f5a5'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','2c7f8cda-8b9f-4d3f-8f7a-2fa1015e2325'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','5c984860-26da-4661-9572-76c3ec599f83'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','acf4a991-f90d-487b-88b0-052995c71131'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','c3b36e2e-84a2-4cb7-9b25-e4ef5edd9da4'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','c985090e-2240-48a7-9322-adafc2c908b9'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','631bf053-0f68-4f07-924d-ff1a4e2ff14b'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','da093369-e128-4c5f-9508-e1d3eb3efb8b'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','5463cbc4-d154-4148-b2fb-3d48d3854164'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','4d8d2182-4447-4047-b2d1-2fe31eede888'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','94c5ab05-1c12-4f96-a108-1609214c893f'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','2c3f9243-ac61-4959-ae26-5f04633ddd51'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','f310477b-43bf-4c7a-b9bf-3aef78fc675e'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','15320bed-eef6-4beb-bdb7-e0041efdaf59'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','1afeeb8c-7124-48b5-8ff7-5e046e6d0211'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','3722f256-cca1-4f8f-b207-eb9906291f95'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','0ae13eb0-7619-430e-a83e-47839621938a'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','a194f0b5-4047-4690-bab6-e2049ea70b84'),
  ('425e6887-90c5-4eac-a62f-8cd3989b1b86','signal','c070582e-6b73-4bcc-97c5-e3ac8bcf70a3'),
  ('6817e386-28e9-4a57-9ed1-0c24328af93a','task','a16c9f36-5ae4-4586-b6da-e23f92f0c876'),
  ('6817e386-28e9-4a57-9ed1-0c24328af93a','task','9294a39f-4aa6-438b-9831-d632f99cfbd6'),
  ('7977dc06-4a4e-4083-bb6a-07c83791ace7','task','312345d4-2e0e-4087-addb-2a4743f61a67'),
  ('7977dc06-4a4e-4083-bb6a-07c83791ace7','signal','d676c37c-8ae2-42a0-a5e5-97810d22c0b1'),
  ('8391835f-0999-472e-8886-0e82fee06a02','prd','148d5737-c1a2-49b6-943f-efe637581a03'),
  ('8391835f-0999-472e-8886-0e82fee06a02','prototype','6bc1631e-7643-49b5-bc0e-b7f3acf9b637'),
  ('a30238f5-767b-4a2b-854d-3624f714f068','prd','5f7793b8-900c-401b-b7fd-39663dc6e67d'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','decision','c2c6a1a9-762f-434b-a393-efa86afa2fe0'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','decision','2b05037c-fcbc-4d2c-bfb5-8fd7244b0bd5'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','decision','666f860f-170b-4a38-a5e9-3ff59a1963aa'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','decision','420732eb-0f34-4294-a850-897f94473ba8'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','task','3746966c-d793-40e0-9a69-cb1bb483a354'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','task','f23c91c1-54c7-4de7-9c10-3af6e99fbe0a'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','task','0c05e191-296c-43cd-9272-fd936b23890a'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','task','70162321-83ce-40d5-8c20-22cf5c48d4c0'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','task','fdf05ff1-88c2-4bfe-bf65-e116bfd73926'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','task','38396562-28ca-4697-a82d-2e9d6f7088ab'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','e4022397-28d3-4b44-b356-d61b32af09df'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','theme','5945ee55-9f33-4fba-ace9-ff7441d1ee0a'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','6833bc21-5d5b-4952-bf5c-98f508a233c0'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','c8fc0e35-7847-45f9-9f57-ad1fb7bc1665'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','5e715df5-fd92-4b2d-8d0e-7c1df699c373'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','4029c227-7a9e-4123-bfb4-c5db9395d309'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','891311fd-46d1-4a05-a5b4-59b97738ff10'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','e4874176-d7dc-418d-9ec3-25a4e1a860b0'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','9bd283f5-ec2b-41ef-a478-01ae160a6891'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','e71bc321-f834-476b-8819-52393b71437c'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','144395be-bb47-45c8-90b9-9434343734b5'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','586ba88d-bf25-4cb4-8978-2d12b7abb4c3'),
  ('ad8c2a5d-d117-441a-980a-28d77a4990ce','signal','c0eed32b-f970-4cc9-8495-2178ca229de8'),
  ('b8a36b6f-b45e-4ed9-9091-8a36ad8c2806','signal','3f3f1e6c-e8ca-4c1d-ac1f-f76ae14a3d9e'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','26aa4f8f-826a-40d7-a69c-0a82a69977ee'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','92a1fad3-3844-4850-a459-abbe5013f3fe'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','b27b23b6-e9c9-4414-b6de-52be9e094596'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','53db34b8-ca9f-4f82-bae5-3a83ca4e8ba6'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','02a67617-5cb5-4a0b-8ee0-a1c54f3ca3f0'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','86752181-d617-44aa-aab3-588479cf6106'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','328f8376-f74a-4ae5-9847-239cc49dbb78'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','49fa5e2c-8b08-44da-9f90-6190c7a0669f'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','4239af14-290b-40f0-8175-498f7996bff2'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','ce379669-fbaf-4689-a71e-ca0b57ec6684'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','77b7b187-9ece-47b4-a85a-09cbebbb1949'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','0e153d6a-cd60-4f5d-aef8-177fdfb49a32'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','c7099114-0dce-4b80-8032-c57d46abb5b2'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','bf9e02e2-6bb4-4c48-b4b9-be07ece1fd75'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','b3d464e1-0a71-4bb3-8c16-d7e0b36a0ad3'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','593dd9b6-f86f-49e2-a9ca-67bc76bea225'),
  ('bb405f6c-1381-414b-93a2-075445163fde','signal','8267ed8e-82d6-4bc6-a9a0-727e5ca6d2bd'),
  ('c4b12e7c-2be4-4ef3-aa54-14645bf28510','prototype','acaade7e-c4f6-45ba-9296-1c5bc696ffbc'),
  ('c4b12e7c-2be4-4ef3-aa54-14645bf28510','theme','846a0fd1-5ece-4471-8577-991dab0a3316'),
  ('c4b12e7c-2be4-4ef3-aa54-14645bf28510','signal','dcdd6954-06ab-4fa9-b71d-37a93054a5bc'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','task','1712604f-9967-4e79-9306-ec7ca437e6c2'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prd','33b4c0f7-47bb-4a9f-845b-87df6dacea2e'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prd','ebca33b5-f488-4aaf-8b2b-edfa5c1c63a6'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','task','eb1d3908-d7ad-4753-8503-7fee198b4cd7'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','task','509af20b-4d78-4c61-9406-626ac6565d4a'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','task','b7ab34a7-bb18-4826-888b-c23c4a6d6741'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','task','b01af1c7-295f-4f60-9bce-2c3668902984'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prototype','1fdb6fd2-9fe7-4c10-9c4f-c28b514d1e1c'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prototype','8cc354d8-0b62-481c-b15f-5a0054dd6b55'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prototype','73aa45de-2c00-421a-9ff8-5d1019971746'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prototype','62ba5e73-5ad9-4389-be38-f595af41eabd'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prototype','05879000-41eb-40c2-a979-1fffb5690832'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prototype','cb2b1f0b-7dcd-4646-9963-6813376cf01d'),
  ('ce846e9b-2f40-416a-92da-205848f9541c','prototype','07aade11-4ae4-4dad-98fb-6cd8d948e907'),
  ('d1168015-05fb-4d6e-82b2-d80bdf7f5ff8','signal','5acb3bf1-bae6-485b-8be6-b8274c279611'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','7f977fe4-2e63-4113-93d6-99e0897c0327'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','6ae82a99-a473-4db7-83fe-a37b1a93db21'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','057b8088-1e2a-4512-9688-c311aeab26b2'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','5a08c1d0-2c15-4fc5-b4f1-b095e91dfe60'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','71cd415d-9076-4fcc-93cf-774ef92a1421'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','6752bdf6-4476-4cd3-b9d5-d9c5aac68e11'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','af6bb80c-8c1d-45c3-b7b7-3d3a0469f0a7'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','d62c63fa-bc68-46fa-98b6-05a445a883a6'),
  ('d2263583-cec9-4b14-8f52-4ccedd07534f','decision','ae3e1caa-8e03-47a9-9d27-63a441da0c3c'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','task','6e944a2a-eda9-4594-b142-edbc94b9eb08'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','task','f0f0cc63-576d-41bd-a33e-27d3536fd319'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','prd','dc3eaff7-f105-4c1e-8f94-0c450dc942bc'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','prd','f4c7e1d4-1fdf-4146-9b22-54a5f0578ff1'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','prd','74730708-7222-4a6f-931e-b422462bacc0'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','task','5954d2b8-0129-4f3c-a10b-722e3b4f4b6c'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','prototype','174a23eb-a9c4-439b-bc65-152dea0ff343'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','prototype','f57ffbef-8c99-43e9-aa3d-ec55c1624ca0'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','prototype','ad7dd206-bc8b-45bc-9807-c61d6cd22e6c'),
  ('e976e60e-be6f-423e-b640-4ca26a469e11','prototype','8cf64105-2ad2-47e8-ba71-df3957507634'),
  ('f9e41393-7774-4b30-9368-0c2f2670acf1','decision','eec7780d-3f8f-4afc-9714-335844bd11ef'),
  ('f9e41393-7774-4b30-9368-0c2f2670acf1','signal','1fbc382e-ccfa-4781-824e-f9ed5cca8db3'),
  ('f9e41393-7774-4b30-9368-0c2f2670acf1','signal','d4078398-9ccd-47ff-839e-aa7309617bd4'),
  ('f9e41393-7774-4b30-9368-0c2f2670acf1','signal','96c51081-78a6-48e1-9777-cd2be5545d0f')
) AS v(track_id, artifact_kind, artifact_id)
WHERE m.track_id = v.track_id::uuid
  AND m.artifact_kind = v.artifact_kind
  AND m.artifact_id = v.artifact_id::uuid
  AND m.superseded_at IS NULL;
