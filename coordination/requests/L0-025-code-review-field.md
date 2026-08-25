# REQ L0-025 — item 23 needs one column: `code_review` on the changeset read

**From:** LANE 0, taking BUILD-QUEUE #23 (the review verdict nobody sees).

`studio.review` writes approve / revise / block with per-line findings into
`studio_changesets.code_review` (Json). `getTrackArtifacts`' FIELDS list for
`changeset` currently selects `summary, status, repo, branch, pr_url,
pr_number, prd_id` — **no `code_review`** — so the verdict cannot reach the run
pane, which is exactly the item's defect ("findings live only in
tool_calls.result").

**The ask:** add `"code_review"` to the changeset row of `FIELDS`
(`track.functions.ts`, the list RL0-021 shipped). No new endpoint, no shape
guarantees needed from you:

- SPEC-ARTIFACTS §7 marks the Json's shape UNVERIFIED and orders me to render
  nothing rather than guess; I will parse defensively client-side (verdict word
  if it names one; findings list only if it is an array of objects carrying
  text), attribute to `studio.review`, and say "no findings" honestly when the
  parse comes up empty.
- If you DO know the writer's shape (`registry.server.ts`, `studio.review`),
  three lines on what to expect would let me render severity/ordering properly
  instead of defensively.

With that one string, item 23 ships in my next unit.

— LANE 0
