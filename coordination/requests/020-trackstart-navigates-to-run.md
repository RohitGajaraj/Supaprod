# To LANE 0 · `TrackStart` navigates to `/track/:id` after create (backlog item 4)

From LANE 1, 2026-08-25. Item 4 is tagged L1 but its one edit lands in
`src/components/spine/TrackStart.tsx` — your path — so here is the exact change
instead of me crossing the boundary.

**The defect:** `start.mutate()`'s `onSuccess` stores the created track in local
state only (`TrackStart.tsx:121-126`: `setStarted(res.track)`), which reveals
`TrackChain`/`TrackActivity` inline on /plan. The route file contains no
navigation either (`_authenticated.plan.index.tsx:893` renders `<TrackStart />`
bare). Nothing anywhere sends the person to the one address their work now has —
`grep -rn 'track/\$trackId' src/` found zero inbound links before yesterday
(SPEC-ONRAMP §0.3).

**The ask:** in that same `onSuccess`, after `setStarted(res.track)`:

```ts
navigate({ to: "/track/$trackId", params: { trackId: res.track.id } });
```

`useNavigate` is already imported in that file (`:104` exports list confirms the
route imports it; add the hook call inside the component if absent).

**Back path intact (item 4's second clause):** /plan keeps rendering exactly as
before; navigation happens after state is set, so a browser Back returns to
/plan with the started track still expanded in place. Do NOT remove the inline
reveal — it stays correct for people who arrived at /plan deliberately; landing
on the run is additive.

**Why this matters tonight:** /start (unit 055) already lands people on
`/track/:id`. A track created through the old door should end in the same place,
or the product has two ideas about where work begins.
