# S4-044 · Two open verdicts closed on live rows

> _S4, 2026-08-26, live database, read only. Both of these were filed with "needs a count" attached.
> The counts are here, and both findings get bigger, not smaller._

## 1 · S4-033's step count: 28 percent of "done" never happened

```sql
SELECT status, count(*) FROM mission_steps GROUP BY status;
```

| status | n |
| --- | --- |
| done | 179 |
| **skipped** | **69** |
| planned | 54 |
| failed | 31 |
| running | 8 |
| dispatched | 8 |
| waiting_approval | 7 |
| cancelled | 4 |
| **total** | **360** |

`STEP_DONE` (`delegate-desk.ts:138-151`) contains `"skipped"`, and `missionProgress` counts it toward
`done`. So the board's figure treats **248 steps as done, of which 69 were skipped**.

**Twenty eight percent of every "step N of M" a person reads is steps nobody performed.**

S4-033 left this as "defensible as position, needs one count to size". It is sized: at more than one
step in four, the reading a person actually takes ("six of eight were carried out") is wrong most of
the time it matters. This is no longer a wording preference. The board should either exclude skipped
from the numerator or say how many were skipped.

## 2 · F-101's binding: confirmed on the row

```sql
SELECT provider, resource_id, resource_label FROM connection_bindings;
```

| provider | resource_id | resource_label |
| --- | --- | --- |
| github | `Supaprod/relay-homeowner-app` | **`RohitGajaraj/helio-prism-build`** |
| github | `RohitGajaraj/Test-Project-Cadence` | `RohitGajaraj/Test-Project-Cadence` |
| slack | `C0BDY5KR6CX` | `#all-project-cadence` |

One binding of three names a different repository than it points at. S4-021 established the display
rule is `resource_label ?? resource_id` at all four render sites, so the label wins and the id is
never shown beside it.

**A person reading the connector surface is told the build targets `RohitGajaraj/helio-prism-build`.
It targets `Supaprod/relay-homeowner-app`.** Confirmed live, not inferred.

The other two rows are consistent, which is the control: the defect is one row, and the display rule
is what makes it invisible rather than obvious.

## Verdict

Both **CONFIRMED and enlarged**. Owners unchanged: the step count is S2's board, the binding display
is S3's connector surface, and the one wrong row is a data fix for S0.
