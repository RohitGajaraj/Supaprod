# Auth and Error Middleware

> 8 nodes · cohesion 0.36

## Key Concepts

- **start.ts** (6 connections) — `src/start.ts`
- **auth-attacher.ts** (4 connections) — `src/integrations/supabase/auth-attacher.ts`
- **error-page.ts** (3 connections) — `src/lib/error-page.ts`
- **renderErrorPage()** (3 connections) — `src/lib/error-page.ts`
- **attachSupabaseAuth** (2 connections) — `src/integrations/supabase/auth-attacher.ts`
- **error-page.test.ts** (2 connections) — `src/lib/error-page.test.ts`
- **errorMiddleware** (1 connections) — `src/start.ts`
- **startInstance** (1 connections) — `src/start.ts`

## Relationships

- [Working State Indicators](Working_State_Indicators.md) (2 shared connections)

## Source Files

- `src/integrations/supabase/auth-attacher.ts`
- `src/lib/error-page.test.ts`
- `src/lib/error-page.ts`
- `src/start.ts`

## Audit Trail

- EXTRACTED: 22 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*