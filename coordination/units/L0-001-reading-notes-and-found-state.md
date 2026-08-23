# UNIT L0-001: reading notes, and the state I found the lane in

**Lane:** LANE 0 (`cadence-lane-0`)
**Written:** 2026-08-23T13:40+05:30
**Kind:** notes + provenance record

## Reading notes (the required first unit)

**What the product is.** Three layers told door then body then brain: the director
(evidence clusters into themes worth acting on), the operating system (seven stations,
agent crews, boundaries, escalation only when judgment is needed), and the brain (guides
the next call from what happened). The moat is not storage and not even the compounding
record: it is the **forecast captured at decision time**, graded against the outcome once
the outcome exists, because causes survive in artifacts but beliefs-before-the-fact do not.
Any surface touching a decision must treat that forecast as first-class.

**What surprised me.**

1. The design system was never the bottleneck. Meridian had 13 type steps, five status
   words with chip variants, and grounds before this run started; surfaces were simply not
   reaching for them. MAIN LANE's M04/M08/M09/M10 turned the founder's complaint into four
   measured mechanisms, and the fix is adoption plus two guard tests, not new vocabulary.
2. The lifecycle is honestly non-linear in the code, not just in the docs: Plan can go
   straight to Build, stations get skipped, and the spine drives rather than the menu.
3. `--mrd-stop` paints intent (the button), never outcome (the state). Five status words,
   not six. I had to read meridian.css twice to believe the chip family deliberately omits it.
4. Two lanes' worth of coordination debt came from one unpushed request file. The protocol's
   first paragraph is written in blood and I am treating the push cadence as sacred.

**Where I disagree, stated plainly.**

1. `.mono-label` (10px uppercase tracked mono) is doing the work of an eyebrow, a table
   label AND a section marker on dense surfaces. As an eyebrow it is fine. As the ONLY
   voice a card has, it flattens everything above body size into one register, which is the
   founder's "back to back" complaint on detail surfaces. My ports should use `mrd-eyebrow`
   where a category sits above a title, and reserve mono-label styling for true micro-labels.
2. The ratchet's headline number will under-report this lane's best work (it cannot see
   Tailwind sizes or Tailwind spacing). I will carry M04's second metric (rival size refs)
   in every unit file so a good hierarchy pass does not read as flat.

**Biggest wins available to LANE 0, ranked:** MissionOrchestratorDetail detail-surface
reading order; the 337 untiered controls worst-first per M10; retired tokens still live in
my tree (MissionDiff.tsx carries `--text-*`, `--madder`, `--hairline`); empty/loading/error
states on component-owned surfaces; then agent-first substance (visible progress,
interrupt/inspect) inside components.

## Provenance note MAIN LANE should know about

This worktree held **uncommitted work from the earlier LANE 0 session** (STATUS.md records
LANE 0 joining at 11:50). That session died after editing three files at 12:41-12:44 and
before committing or writing any unit file; its own code comments reference a
`units/L0-001` it never wrote. I verified its diff line by line, ran all gates on the
merged tree (tsc 0; bun test 10,631 pass / 0 fail, exit 0), and adopted it as L0-002. No
file was touched by two live writers: the other opencode process awake right now is LANE 1
(cwd `cadence-lane-1`), confirmed via lsof.

## One decision I am handing to whoever owns routes (not mine)

`MissionOrchestratorDetail.tsx` renders the mission title as its h1, and the host route
`src/routes/_authenticated.runs.$missionId.tsx` renders `<PageHead>` with the SAME string
at the same 25px directly above it. Two identical page titles stacked. Deleting one is an
information-architecture call on a route file LANE 1 owns. Until then the duplicate stands,
documented in the file.
