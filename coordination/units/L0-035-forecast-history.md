# UNIT L0-035: the forecast trail and its door

**Lane:** LANE 0
**Completed:** 2026-08-25T01:40+05:30
**Commit:** ad084a7c5

## What this unit was

The half-built forecast-history work, picked up whole. reopenForecast and
getForecastHistory existed with their safety properties (reason-required,
log-before-clear, guarded clear) and zero callers. Both now have doors:

- ForecastDeskPanel's agent-settled rows carry Disagree: a reason-first
  inline form (the reason IS the new trail entry), reopening the verdict
  back onto the desk. The oversight half of the auto-settle gate is
  finally reversible, which the module docblock has claimed since it
  shipped.
- DecisionDetail's forecast block renders the per-decision trail: each
  filed verdict, its words, who settled it, when and why it was reopened.
  Read fails soft; a first verdict reads as no history.

## Measured

| Metric | Before | After |
| --- | --- | --- |
| reopenForecast callers | 0 | the desk |
| getForecastHistory readers | 0 | the drill-down |
| tsc / suite | - | exit 0 / green but for LANE 1's 11 in-flight nav fails |

## Handed forward

- REQ-L0-018's remaining Decide route-side items (bulk-approve mount,
  decided history, snooze list, sent-back notes) still wait on routes.
- The nav-model failures on main are LANE 1's /track restructure,
  documented in L0-034.
