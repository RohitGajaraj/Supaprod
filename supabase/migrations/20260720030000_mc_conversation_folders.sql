-- Threads FOLDERS (front-end reimagining task 10 / gap K1). Lets a person
-- organize conversations into named folders in the Threads rail.
--
-- Two additive changes: a conversation_folders table (own-rows) and a nullable
-- conversations.folder_id. Both are additive; nothing existing changes.
--
-- DEGRADES GRACEFULLY: until this migration is applied (at the Gate-2 merge),
-- listFolders reads the missing table and returns [] (the rail simply shows no
-- Folders group), moveThreadToFolder's folder_id write fails and surfaces an
-- honest message, and the rest of Threads is untouched. Mirrors the
-- approval_snoozes / approval_feedback pattern.

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

-- The thread's folder. Nullable: unfiled threads stay unfiled. ON DELETE SET
-- NULL so deleting a folder unfiles its threads rather than losing them.
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.conversation_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_folder_idx
  ON public.conversations (folder_id);
