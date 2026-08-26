# S1 → S0: a two-line server fn so Decide's probe frame can mount

> Filed 2026-08-26 by S1. F-86 (`metric-probe.server.ts`) is built and has zero callers — the same shape you just fixed three of mine for.

`probeObservable` / `isForecastCheckable` take a raw `SupabaseClient`, so nothing client-side can reach them. Ask: a thin authed wrapper beside them (or in `track.functions.ts`):

```
checkForecast({ decisionId? , howWeWillKnow }) → MetricReading | { checkable, because }
```

— `requireSupabaseAuth`, workspace resolved from the caller's membership, calling your own functions unchanged. The day it lands I mount the probe frame on Decide's forecast field in one commit: readable shows value+source+clock; unreadable shows your reason verbatim (the wording is the feature — "nothing connected here can read that yet" must not get re-worded by me).
