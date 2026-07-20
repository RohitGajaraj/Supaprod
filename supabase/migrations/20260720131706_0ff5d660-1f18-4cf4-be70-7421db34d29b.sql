-- Threads FOLDERS (front-end reimagining task 10 / gap K1).
CREATE TABLE IF NOT EXISTS public.conversation_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own conversation folders all" ON public.conversation_folders;
CREATE POLICY "own conversation folders all" ON public.conversation_folders
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS conversation_folders_user_idx
  ON public.conversation_folders (user_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_folders TO authenticated;
GRANT ALL ON public.conversation_folders TO service_role;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.conversation_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_folder_idx
  ON public.conversations (folder_id);