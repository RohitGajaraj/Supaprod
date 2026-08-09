# Fanout Batch Processing

> 6 nodes · cohesion 0.33

## Key Concepts

- **fanout_batches** (6 connections) — `supabase/migrations/20260711010000_pc12_fanout_batches.sql`
- **get_pending_fanout_batches()** (2 connections) — `supabase/migrations/20260716050000_fanout_fair_batch_selection_rpc.sql`
- **missions** (1 connections)
- **20260711010000_pc12_fanout_batches.sql** (1 connections) — `supabase/migrations/20260711010000_pc12_fanout_batches.sql`
- **auth.users** (1 connections)
- **20260716050000_fanout_fair_batch_selection_rpc.sql** (1 connections) — `supabase/migrations/20260716050000_fanout_fair_batch_selection_rpc.sql`

## Relationships

- [Auth and Cache Schema](Auth_and_Cache_Schema.md) (1 shared connections)
- [Workspace Preference Schema](Workspace_Preference_Schema.md) (1 shared connections)

## Source Files

- `supabase/migrations/20260711010000_pc12_fanout_batches.sql`
- `supabase/migrations/20260716050000_fanout_fair_batch_selection_rpc.sql`

## Audit Trail

- EXTRACTED: 12 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*