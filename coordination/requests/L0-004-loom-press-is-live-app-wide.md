# REQ-L0-004: loom-press is live app-wide, not dead under data-mrd, and its retirement needs a ruling before styles.css sheds it

**Kind:** approval
**Blocking:** no
**Raised:** 2026-08-23T15:40+05:30

## What I need

A ruling on when `loom-press` (src/styles.css:1639) may be deleted, because the
premise that it resolves nothing is wrong. It is scoped `[data-obsidian] .loom-press`,
and `data-obsidian` is hoisted onto `<html>` for the ENTIRE authenticated tree by the
portal theme fix at src/routes/_authenticated.tsx:113 (AuthedLayout's useEffect). Both
attributes coexist: `data-mrd` scopes Meridian's rules while `data-obsidian` keeps
legacy portal theming AND this class alive. Every signed-in surface, including every
`data-mrd` root, currently gets loom-press's two behaviours:

- a press transform transition (:active)
- a 44px minimum touch target under 768px width

Stripping the class from components today would silently drop the mobile touch-target
guard on those controls. That is live behaviour changing, not dead-code cleanup.

## Why I cannot answer it myself

Both files that decide this are outside my set: the rule lives in src/styles.css and
the attribute mount lives in src/routes/_authenticated.tsx, both LANE 1 paths. Whether
the right move is porting the touch-target guard into Meridian (a `[data-mrd]`
equivalent), keeping the html-level hoist, or retiring the class with the shell layer
is a cross-lane sequencing call.

## What I assumed in the meantime

Unit L0-002 listed "loom-press remains on native buttons but resolves nothing under a
data-mrd root" as an open item. This request refutes that premise with the cascade
evidence above. Until ruled on, I keep loom-press on native buttons in MY files where
its touch target still protects them (BriefFormationFlow's Close control carries it),
and record the dependency in each unit file.
