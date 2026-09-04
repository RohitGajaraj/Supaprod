-- P-128b: how a deploy was produced, on the deploy's own row.
--
-- R-41 gave Supaprod a second hostable shape: a repo with a build script and a
-- tool whose output directory is unambiguous is built in the sandbox and served
-- behind a generated entrypoint. Until now every deployment row described only
-- WHERE it went -- a URL, a status, a failure reason -- because there was only
-- ever one way it could have got there: the repo already contained a `main.ts`
-- and we uploaded the repo.
--
-- With two shapes that is no longer enough to answer the question a person
-- actually asks when a preview looks wrong: what did you build, with what, and
-- where did you get the files. Without it, "the site is blank" and "the build
-- wrote to a directory we did not upload" are the same row.
--
-- JSONB rather than four columns, deliberately. This is a record OF a build
-- rather than a thing the product queries on: no reader filters by build tool,
-- and adding `build_tool`, `build_out_dir`, `build_ms` and `build_bytes` would
-- put four permanently-NULL columns on every template deploy and every captured
-- row. Shape written today: {shape, tool, outDir, buildMs, bytes}.
--
-- NULL for the template shape and for captured rows, which is honest: nothing
-- was built here, so there is nothing to say about a build. A reader must treat
-- NULL as "not built by us" and never as "built with nothing".

ALTER TABLE public.deployments
  ADD COLUMN IF NOT EXISTS build_detail jsonb;

COMMENT ON COLUMN public.deployments.build_detail IS
  'How a static-build deploy was produced: {shape, tool, outDir, buildMs, bytes}. NULL when nothing was built here -- a template-shape deploy or a captured row (P-128b).';
