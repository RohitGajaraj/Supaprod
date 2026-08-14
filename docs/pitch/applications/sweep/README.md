# The 2026-08 funding sweep, harvested lane by lane

> _This folder is written by a harvester while the sweep is still running, so a crash costs one lane rather than all of them. Every file here rebuilds from the run journal, which is the source of truth._

**Why it is built this way.** The research tool returns everything at the end. A run that dies on the last lane would take every earlier lane with it, and each lane costs real time because every programme is checked against its own live apply page rather than a listing.

**6 lanes landed · 283 programmes captured · 🟢 104 open · 🟡 137 blocked · ⚪ 42 closed**

| Lane | Stage | Programmes |
| --- | --- | --- |
| [`apac-mena-india`](./lane-apac-mena-india.md) | discovery only, verification running | 40 |
| [`eu-level-nondilutive`](./lane-eu-level-nondilutive.md) | discovery only, verification running | 37 |
| [`france-dach-south`](./lane-france-dach-south.md) | discovery only, verification running | 54 |
| [`nordics-baltics-benelux`](./lane-nordics-baltics-benelux.md) | discovery only, verification running | 46 |
| [`uk-ireland`](./lane-uk-ireland.md) | discovery only, verification running | 48 |
| [`us-ai-native`](./lane-us-ai-native.md) | discovery only, verification running | 58 |

`raw/` holds one untouched JSON file per completed agent. Nothing is merged into it and nothing overwrites it, so it is the recovery point if a roll-up above is ever wrong.

The ranking, tiers and apply-now calls are **not** here. They are produced after every lane lands and go to the founder at Gate 2.
