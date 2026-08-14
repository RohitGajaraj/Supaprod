# The 2026-08 funding sweep, harvested lane by lane

> _This folder is written by a harvester while the sweep is still running, so a crash costs one lane rather than all of them. Every file here rebuilds from the run journal, which is the source of truth._

**Why it is built this way.** The research tool returns everything at the end. A run that dies on the last lane would take every earlier lane with it, and each lane costs real time because every programme is checked against its own live apply page rather than a listing.

**7 lanes landed · 329 programmes captured · 🟢 135 open · 🟡 147 blocked · ⚪ 47 closed**

| Lane | Stage | Programmes |
| --- | --- | --- |
| [`aggregators`](./lane-aggregators.md) | discovery only, verification running | 46 |
| [`apac-mena-india`](./lane-apac-mena-india.md) | discovery only, verification running | 40 |
| [`eu-level-nondilutive`](./lane-eu-level-nondilutive.md) | discovery only, verification running | 37 |
| [`france-dach-south`](./lane-france-dach-south.md) | discovery only, verification running | 54 |
| [`nordics-baltics-benelux`](./lane-nordics-baltics-benelux.md) | discovery only, verification running | 46 |
| [`uk-ireland`](./lane-uk-ireland.md) | discovery only, verification running | 48 |
| [`us-ai-native`](./lane-us-ai-native.md) | discovery only, verification running | 58 |

`raw/` holds one untouched JSON file per completed agent. Nothing is merged into it and nothing overwrites it, so it is the recovery point if a roll-up above is ever wrong.

The ranking, tiers and apply-now calls are **not** here. They are produced after every lane lands and go to the founder at Gate 2.

> ### ⏳ This folder is temporary, by founder ruling 2026-08-14. Delete it when the run is done.
>
> It exists to stop a crash costing hours of live page checks, and it stops earning its keep the moment the sweep finishes and the ranked output is written. **It is a safety net for a run in flight, not a permanent record.** Leaving it here afterwards would put a second, staler copy of the programme list next to the tracker, which is exactly the parallel-copy rot the pitch folder's standing rules forbid.
