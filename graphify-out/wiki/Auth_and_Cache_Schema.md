# Auth and Cache Schema

> 11 nodes · cohesion 0.18

## Key Concepts

- **auth** (10 connections) — `.lovable/mcp/manifest.json`
- **activation_events** (4 connections) — `supabase/migrations/20260710210000_pc04_activation_events.sql`
- **ai_response_cache** (3 connections) — `supabase/migrations/20260619230000_wm_m15b_response_cache.sql`
- **accepted_audiences** (2 connections) — `.lovable/mcp/manifest.json`
- **issuer** (1 connections) — `.lovable/mcp/manifest.json`
- **type** (1 connections) — `.lovable/mcp/manifest.json`
- **authenticated** (1 connections) — `.lovable/mcp/manifest.json`
- **20260619230000_wm_m15b_response_cache.sql** (1 connections) — `supabase/migrations/20260619230000_wm_m15b_response_cache.sql`
- **auth.users** (1 connections)
- **20260710210000_pc04_activation_events.sql** (1 connections) — `supabase/migrations/20260710210000_pc04_activation_events.sql`
- **auth.users** (1 connections)

## Relationships

- [MCP Server Manifest](MCP_Server_Manifest.md) (1 shared connections)
- [Event Fanout Schema](Event_Fanout_Schema.md) (1 shared connections)
- [Admin Feature Flags](Admin_Feature_Flags.md) (1 shared connections)
- [Activation Funnel Tracking](Activation_Funnel_Tracking.md) (1 shared connections)
- [Fanout Batch Processing](Fanout_Batch_Processing.md) (1 shared connections)
- [Workspace Preference Schema](Workspace_Preference_Schema.md) (1 shared connections)

## Source Files

- `.lovable/mcp/manifest.json`
- `supabase/migrations/20260619230000_wm_m15b_response_cache.sql`
- `supabase/migrations/20260710210000_pc04_activation_events.sql`

## Audit Trail

- EXTRACTED: 26 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*