# Apply the 8 pending database updates, one at a time

The live ledger stops at `20260807145610`. Eight files on disk have never been recorded as applied. They will be applied individually, in timestamp order, exactly as written. Nothing combined, nothing rewritten, nothing skipped.

## Order

1. `20260807200000_reserve_static_root_files` - reserves 7 static root filenames as workspace URL names
2. `20260807210000_signup_closes_entry_is_by_invite_code` - closes open signup, entry is by invite code
3. `20260807220000_seed_shareable_invite_codes` - seeds 5 audience-specific invite codes
4. `20260807230000_reserve_email_asset_slugs` - reserves 6 email asset filenames
5. `20260810120000_an_unnamed_tier_should_not_delete_your_memory` - removes the hardcoded paid-tier allow list from memory expiry
6. `20260810140000_the_record_could_be_dated_whenever_you_liked` - stops backdating of created_at on decisions, learnings, prds, artifact lineage
7. `20260810160000_a_decision_an_agent_made_had_nowhere_to_say_so` - adds an agent source kind to decisions
8. `20260810180000_the_forecast_is_the_part_that_cannot_be_rebuilt` - captures the forecast at decision time

## Method

- One migration call per file. Each carries the file's SQL byte for byte.
- After each, confirm the objects it creates or changes actually exist in the live database, not just that the call returned.
- If one fails, stop there and report it rather than continuing or patching around it.
- Where the ledger records a file under a drifted name, reconcile the entry additively only. No existing row is deleted or rewritten.

## After the migrations

- Full typecheck and production build.
- Reload the preview and confirm it renders.
- Publish to supaprod.ai.

## Note on the GitHub gap

This applies the database side only. The stale GitHub-to-Lovable code sync you flagged earlier is unchanged, so the published build still lacks the MCP write tools that exist on GitHub main. Migration 7 and 8 above prepare the schema those tools need, so the database will be ready when the code sync is repaired.
