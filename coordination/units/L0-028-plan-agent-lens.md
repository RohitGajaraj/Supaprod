# UNIT L0-028: Plan station, agent lens + section drift

**Lane:** LANE 0
**Completed:** 2026-08-24T07:50+05:30
**Commits:** 27980fa3f (engine), REQ-L0-015 (route-side asks)

## What this unit was

Second station through the two-lens method (Brain was L0-026). Census
mapped Plan end to end against the ChatPRD reference. Agent lens closed
in-engine: prd.draft duplicate guard (mirroring generatePrd's),
is_sample propagation, prd.search/prd.get crew reads reusing MCP
handlers, blast-radius tables filled. Authoring drift unified: one
SPEC_SECTION_ORDER constant now feeds all three spec prompts that
disagreed about structure.

User lens produced REQ-L0-015: adaptive interrogation mount (the dead
140-line question-asking generator), handoff preview, reader
consolidation, honest-framing line.

Also repaired shell's dialogs test reading the deleted primitives file.

## Measured

| Metric | Before | After |
| --- | --- | --- |
| Crew spec read tools | 0 | 2 (+26 tests) |
| Duplicate specs per bet from agent runs | possible | refused |
| Section orders across prompts | 3 disagreeing | 1 constant |
| tsc / full suite | - | exit 0 / 10,746 pass, 0 fail |
