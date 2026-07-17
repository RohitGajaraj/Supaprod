// The PM's working notepad (founder ask 2026-07-09): "as a product manager, I
// will think like a notepad to keep everything temporarily there." A
// lightweight, private scratchpad for the raw, half-formed thoughts that
// don't yet deserve a task, a signal, or a decision — the space between those
// formal objects. Local-only (never synced, never a Discover signal), so it
// stays genuinely fast and judgment-free. Workspace-scoped so switching
// workspaces never bleeds one project's scratch notes into another's.
//
// Kept free of React (pure + testable); useNotepad (a small hook) wraps this
// for components, shared identically by the Desk's NotepadCard and the
// FocusDock's Note tab so the two are always the same note, not two notes.

const KEY_PREFIX = "supaprod.notepad";
const DEBOUNCE_MS = 400;

// Two surfaces write the same note (the Desk's NotepadCard and the
// FocusDock's Note tab) — a live-verification pass found that without this,
// a note typed in one silently failed to appear in the other until a full
// page reload, even though the write itself had landed. Every writeNotepad
// call dispatches this so any mounted consumer can re-read on a genuine
// external change. Same-tab only (the native `storage` event never fires for
// the tab that made the write); cross-tab sync remains a follow-up.
export const NOTEPAD_CHANGE_EVENT = "supaprod:notepad-change";

export function notepadKey(workspaceId: string | null): string {
  return workspaceId ? `${KEY_PREFIX}.${workspaceId}` : `${KEY_PREFIX}.default`;
}

export type NotepadEntry = { text: string; updatedAt: number };

export function readNotepad(
  storage: Pick<Storage, "getItem"> | null,
  workspaceId: string | null,
): NotepadEntry {
  if (!storage) return { text: "", updatedAt: 0 };
  try {
    const raw = storage.getItem(notepadKey(workspaceId));
    if (!raw) return { text: "", updatedAt: 0 };
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as NotepadEntry).text === "string"
    ) {
      return parsed as NotepadEntry;
    }
    return { text: "", updatedAt: 0 };
  } catch {
    return { text: "", updatedAt: 0 };
  }
}

export function writeNotepad(
  storage: Pick<Storage, "setItem" | "removeItem"> | null,
  workspaceId: string | null,
  text: string,
): void {
  if (!storage) return;
  try {
    if (text.trim().length === 0) {
      storage.removeItem(notepadKey(workspaceId));
    } else {
      const entry: NotepadEntry = { text, updatedAt: Date.now() };
      storage.setItem(notepadKey(workspaceId), JSON.stringify(entry));
    }
  } catch {
    // Storage denied: the notepad is a nicety, never a blocker.
    return;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTEPAD_CHANGE_EVENT, { detail: { workspaceId } }));
  }
}

export { DEBOUNCE_MS as NOTEPAD_DEBOUNCE_MS };
