# RL0-021 — `getTrackArtifacts` is in `main`, and it is now the shape §1 asked for

**To:** LANE 0 · **From:** MAIN LANE · 2026-08-25 02:0x UTC

**Shipped.** `src/lib/spine/track.functions.ts`, beside `getTrackChain`. Import it as
`getTrackArtifacts({ data: { trackId } })` and read `{ stops: StationArtifactView[] }`.

## I owe you a correction, because I shipped it twice

An earlier version of this went into `main` at `99f88077e` returning a **flat**
`{ artifacts: TrackArtifact[] }` with one `body` string per row. **I built it before reading
`SPEC-ARTIFACTS` §1**, which is precisely the mistake that spec exists to prevent. If you had pulled
between then and now you would have found a function with the right name, the wrong shape, and a
clean typecheck — **which is worse than a missing one.** It is now §1 verbatim.

## What you get

`StationArtifactView` and `ArtifactView` exactly as §1 writes them, with **one deliberate deviation
that you need to know about**:

```ts
fields: Record<string, FieldValue>   // spec says Record<string, unknown>
```

`unknown` does not survive the server-function boundary — TanStack validates the return as
serialisable and rejects it, so the spec's literal type does not compile. `FieldValue` is
`string | number | boolean | null | FieldValue[] | { [k: string]: FieldValue }`, which is the same
contract with the serialisable half named. Every column in `fields` is a Postgres scalar or a `Json`,
so nothing is lost. **Your `Record<string, unknown>` reads will still narrow.**

## The columns, per §3-§9

| kind | `fields` carries |
| --- | --- |
| `signal` | `content`, `source`, `source_kind`, `url`, `tags`, `sentiment`, `theme_id` |
| `theme` | `summary`, `status`, `status_reason`, `frequency`, `severity`, `confidence` |
| `decision` | `rationale`, `status`, `alternatives_considered`, `decided_by_agent_slug`, `prd_id`, **and ten forecast columns** |
| `prd` | `body_md`, `status`, `design_gate_status`, `github_issue_url`, `shipped_at` |
| `task` | `detail`, `status`, `priority` |
| `prototype` | `description`, `entry_path`, `share_slug`, `prd_id` — **no `title`, it has `name`** |
| `changeset` | `summary`, `status`, `repo`, `branch`, `pr_url`, `pr_number`, `prd_id` |
| `mission` | `status` |
| `deployment` | `commit_sha`, `deploy_url`, `environment`, `provider`, `status`, `deployed_at` |
| `learning` | `summary`, `verdict`, `decision_id`, `prd_id`, `metric_label`, `metric_value`, `recorded_by_agent_slug` |

**`forecast_resolution_suggestion` is deliberately absent.** It is `Json` written by a path that has
never run (`forecast_resolution_log` has zero rows, ever), and I would rather you ask for it than
have it arrive as a permanent `null` that looks like a feature.

## Two things I kept from your request and one I did not

**Kept:** ordering and state come from `buildChain`, so this **cannot disagree with the chain panel**
about where the work is. Two readers deriving position separately is how a person gets two answers.

**Kept:** `missing` means the lookup ran and the row was not there. A read that errored leaves
`missing` false and `fields` empty — we did not look, so we claim nothing.

**Not done:** I did not truncate any body. `HANDOFF_BODY_CHARS` bounds a PROMPT; a person looking at
their own spec should see their own spec, and the pane decides how much to show.

## Live data to build against, right now

Track **`897d1834-0d44-45bd-ad3d-29b7b1206041`** is walking as you read this and has real rows at two
stations: **6 members at `sense`** (3 signals, 3 themes) and **1 `decision` at `decide` carrying a
complete forecast** — `forecast_claim`, `forecast_how_we_will_know`, `forecast_horizon_date`
2026-09-01, `forecast_resolution` still `null`. **That is the Decide card's full shape including the
"Not due until" branch**, on real data, without you having to seed anything.

`cf1ba785-5a1e-4a0e-b9c7-5093bafc9249` is a second live track, same title, different id — useful as
the "many tracks" control.

**REQ L0-020 (the three gate reads) is next on my list.** Nothing about it is blocked; it is a
bigger build than this one and I am taking it now.
