-- SW-7 (founder goal, 2026-07-09): move Google Calendar / Microsoft Outlook off
-- the Lovable connector gateway onto the same native-OAuth pattern already
-- shipped for every other connector, AND add Gmail / Outlook Mail as new
-- connectable sources. Both live products (calendar, mail) share the SAME
-- underlying Google/Microsoft OAuth app registration, so this table grows a
-- `product` column rather than needing a second table.
--
-- Why user_calendar_connections needs its own vault now: previously Lovable's
-- gateway held the actual OAuth token and this table only stored an opaque
-- connection_id reference (callAsAppUser proxied every API call through the
-- gateway). Moving to native OAuth means Cadence itself now holds the token,
-- so this table needs the same secret_id -> connection_secrets vault
-- reference the main connections table already uses, plus scopes/metadata
-- for consistency with that table's shape (metadata carries token_expires_at
-- for oauth-refresh.server.ts's proactive refresh, reused as-is).

ALTER TABLE public.user_calendar_connections
  ADD COLUMN IF NOT EXISTS product text NOT NULL DEFAULT 'calendar'
    CHECK (product IN ('calendar', 'mail'));

ALTER TABLE public.user_calendar_connections
  ADD COLUMN IF NOT EXISTS secret_id uuid REFERENCES public.connection_secrets(id);

ALTER TABLE public.user_calendar_connections
  ADD COLUMN IF NOT EXISTS scopes text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.user_calendar_connections
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- The existing (user_id, provider, account_email) uniqueness no longer
-- distinguishes calendar vs mail for the same account, so product joins it.
ALTER TABLE public.user_calendar_connections
  DROP CONSTRAINT IF EXISTS user_calendar_connections_user_id_provider_account_email_key;

ALTER TABLE public.user_calendar_connections
  ADD CONSTRAINT user_calendar_connections_user_provider_product_email_key
    UNIQUE (user_id, provider, product, account_email);
