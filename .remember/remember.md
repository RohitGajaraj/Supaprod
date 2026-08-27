# S3 (platform lane), night of 2026-08-27 into 08-28

Lane `lane/platform`, head after handoff commit. 32 build units U-111 to U-141, all pushed, all
gated, fast-forwarded into `main` at the founder's direct instruction.

## Read this before you touch a governance surface

`getBoundary` buckets tools by what they RUN AS, not what they are set to. It composes seed → arc
dial → safety floors through `resolveToolMode`, the same path the loop takes. 96 of 97 `agent_tools`
rows run as `auto`. If you change the bucketing, the screen starts lying about what needs asking.

`BoundaryControls.tsx` renders `AutomationBoundary` OUTSIDE the `!data` guard on purpose, with the
reason written at the line. It must survive a failed boundary read. I moved it inside once (U-119)
and put it back.

## The class to keep hunting

Unreachable finished work — a capability wired end to end with no way in. Seven found in one night.
It typechecks, it lints, it builds, its tests pass, and no gate sees it. S4 gated it as
`bun run check:unreachable`, but that detector does not follow `React.lazy(() => import(…))`, so its
80 is an upper bound. Grep for the component name before mounting anything off that list.

## Three open, each one small, each needs an owner who was offline

1. `Door` is 56x21 inline in prose (`src/components/meridian/`). The remedy already exists: the
   centred `::after` overlay in `src/styles/public-legibility.css`.
2. `ReadFailed` repeats the shell's session sentence and adds a second door. `AppFrame` states the
   rule: the shell says it once, above everything.
3. Nothing mounts a recall-rating control. `MessageMetaFooter` and `submitFeedback` both work; the
   surface that would carry "did this help" is S1's.

## Two habits that cost me time

`bunx tsc … | head` reports exit 0 because the pipe swallows the status. Capture exit codes.
A busy :8080 is SOMEBODY ELSE'S. I killed S4's harness three times before I learned to check the
process owner instead of the port.

Full detail: `docs/operations/session-handoff.md`, top section.
