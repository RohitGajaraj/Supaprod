-- Data Cleanup: QA debris + em-dash humanization on stored rows
-- Safe to run multiple times (idempotent, UPDATE...WHERE pattern).
-- Context: docs/planning/loom/live-qa-round-1.md "The data sweep" section.
-- Run this in the Lovable SQL editor after the 2026-07-06 publish.

-- ============================================================
-- 1. TEST DEBRIS: delete rows that are purely test/debug junk
-- ============================================================

-- Delete the "This is an Test Message - By RG" test entries from learnings
DELETE FROM public.learnings
WHERE summary ILIKE '%This is an Test Message%';

-- Delete test tasks (debug tasks created during QA)
DELETE FROM public.tasks
WHERE title ILIKE '%Optimistic toggle check%'
   OR title ILIKE '%Verify Loom triage strip%';

-- Delete duplicate "[auto] ...Unattributed Revenue Loss" missions (keep one if any)
-- First, find duplicates and delete all but the oldest
DELETE FROM public.missions
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
    FROM public.missions
    WHERE title ILIKE '%Unattributed Revenue Loss%'
  ) sub WHERE rn > 1
);

-- ============================================================
-- 2. EM-DASH HUMANIZATION: replace em/en dashes in stored rows
--    (the seed functions were already fixed in commit 17098e16;
--     this sweeps existing rows the old seeds created)
-- ============================================================

-- Mission/session titles
UPDATE public.missions
SET title = REPLACE(REPLACE(title, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE title LIKE E'%\u2014%' OR title LIKE E'%\u2013%';

-- Mission descriptions/goals
UPDATE public.missions
SET goal = REPLACE(REPLACE(goal, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE goal IS NOT NULL AND (goal LIKE E'%\u2014%' OR goal LIKE E'%\u2013%');

-- PRD/Spec titles
UPDATE public.prds
SET title = REPLACE(REPLACE(title, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE title LIKE E'%\u2014%' OR title LIKE E'%\u2013%';

-- Decisions titles
UPDATE public.decisions
SET title = REPLACE(REPLACE(title, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE title LIKE E'%\u2014%' OR title LIKE E'%\u2013%';

-- Learnings summary
UPDATE public.learnings
SET summary = REPLACE(REPLACE(summary, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE summary LIKE E'%\u2014%' OR summary LIKE E'%\u2013%';

-- Agent memory content
UPDATE public.agent_memory
SET content = REPLACE(REPLACE(content, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE content LIKE E'%\u2014%' OR content LIKE E'%\u2013%';

-- Signals titles
UPDATE public.signals
SET title = REPLACE(REPLACE(title, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE title IS NOT NULL AND (title LIKE E'%\u2014%' OR title LIKE E'%\u2013%');

-- Opportunities titles
UPDATE public.opportunities
SET title = REPLACE(REPLACE(title, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE title LIKE E'%\u2014%' OR title LIKE E'%\u2013%';

-- Docs titles
UPDATE public.docs
SET title = REPLACE(REPLACE(title, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE title LIKE E'%\u2014%' OR title LIKE E'%\u2013%';

-- ============================================================
-- 3. VOCABULARY FIX: "PRD" -> "Spec" in user-visible titles
--    (only for rows that start with "PRD - " pattern, which is
--     the old auto-generated prefix)
-- ============================================================

UPDATE public.prds
SET title = REGEXP_REPLACE(title, '^PRD [- ] ', '', 'i')
WHERE title ~* '^PRD [- ] ';

-- ============================================================
-- 4. PROMPT SURFACE LABELS: humanize the em-dashes
--    (these are in prompt_templates.name)
-- ============================================================

UPDATE public.prompt_templates
SET name = REPLACE(REPLACE(name, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE name LIKE E'%\u2014%' OR name LIKE E'%\u2013%';

-- Guardrail names
UPDATE public.guardrail_rules
SET name = REPLACE(REPLACE(name, E'\u2014', ' - '), E'\u2013', ' - ')
WHERE name LIKE E'%\u2014%' OR name LIKE E'%\u2013%';

-- ============================================================
-- 5. STUDIO prefix cleanup: "Studio · " prefix in mission titles
--    Replace with nothing (the Build surface doesn't need the prefix)
-- ============================================================

UPDATE public.missions
SET title = REGEXP_REPLACE(title, '^Studio [·.] ', '', '')
WHERE title ~ '^Studio [·.] ';

-- Also "Build · " prefix
UPDATE public.missions
SET title = REGEXP_REPLACE(title, '^Build [·.] ', '', '')
WHERE title ~ '^Build [·.] ';
