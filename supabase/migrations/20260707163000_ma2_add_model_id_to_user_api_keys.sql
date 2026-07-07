-- MA-2: Add model_id column to user_api_keys to support custom model IDs per key
-- This enables users to specify which exact model to use (e.g., "qwen-max", "glm-4-plus")
-- instead of always using the default for a provider

ALTER TABLE public.user_api_keys
  ADD COLUMN model_id text;

-- Create an index for efficient querying by (user_id, provider, model_id)
CREATE INDEX idx_user_api_keys_provider_model ON public.user_api_keys(user_id, provider, model_id);

-- Add comment to document the column
COMMENT ON COLUMN public.user_api_keys.model_id IS
  'Custom model ID (e.g., "qwen-max", "glm-4-plus"). If null, uses default model for provider.';
