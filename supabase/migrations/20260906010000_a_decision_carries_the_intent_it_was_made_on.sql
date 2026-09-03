-- THE FIVE FIELDS A HANDOFF NEEDS, ON THE ROW THAT MAKES THE CALL.
--
-- Anthropic's AI-native SDLC playbook (adopted 2026-08-31, SPEC-AI-NATIVE-SDLC.md
-- §3C) says `intent.md` carries: problem statement, proposed outcome, affected
-- users and systems, constraints, open questions. A team on that playbook holds
-- that file in its repo, and every leading indicator it defines is the gap
-- between two of those files' git timestamps.
--
-- We hold a `decisions` row with eleven `forecast_*` columns and nothing that
-- says what the work IS. The spec's own note on this: a track enters at `sense`
-- as a slug and ~46 died there, because nothing ever said what a thing must
-- contain to be worth deciding on.
--
-- WHY JSONB AND NOT FIVE COLUMNS. The five are one document, written together by
-- a person and an agent, read together, and rendered together into one file.
-- Five nullable text columns invite a form that fills three of them; one object
-- is the unit that is actually passed around. `prds.contract` is the same shape
-- for the same reason and is the precedent here.
--
-- NOT NULL-DEFAULTED TO '{}'. A decision with no intent and a decision whose
-- intent is an empty object are different facts: the first predates this column,
-- the second means somebody looked and wrote nothing. NULL says the first, which
-- is true of every one of the 182 decisions on the record today.
--
-- "OPEN QUESTIONS" IS THE FIELD TO PROTECT. The spec singles it out as "the one
-- we would never have thought of: it is the one that makes a handoff honest
-- rather than confident", and P-21's own scope line dropped it in a paraphrase.
-- It is named in the comment below so a future reader adding a sixth field, or
-- trimming to four, meets the reason it is there.
alter table public.decisions
  add column if not exists intent jsonb;

comment on column public.decisions.intent is
  'The playbook''s five intent fields as one document: problem_statement, proposed_outcome, affected_users_and_systems, constraints, open_questions. Rendered into .supaprod/intent.md. NULL means the decision predates the column; an empty object means somebody looked and wrote nothing. open_questions is load-bearing: it is what makes the handoff honest rather than confident.';
