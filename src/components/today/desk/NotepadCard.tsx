// The Desk's free-form scratch space (founder ask 2026-07-09): "like a
// notepad to keep everything temporarily there" — distinct from Capture
// (which turns text into a Discover signal) and Tasks (structured,
// due-dated). Local-only, workspace-scoped, autosaved. Sits directly after
// Capture: both are personal, low-ceremony write tools.
import * as React from "react";
import { Button } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import {
  readNotepad,
  writeNotepad,
  NOTEPAD_CHANGE_EVENT,
  NOTEPAD_DEBOUNCE_MS,
} from "@/lib/notepad";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const card: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "12px 14px",
  boxShadow: "var(--top-light)",
};

// Minutes/hours only, no full library: this is a quiet meta line, not a
// clock. Matches the register of other Desk timestamps.
function relativeTime(updatedAt: number): string {
  const deltaMs = Date.now() - updatedAt;
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "Saved just now";
  if (minutes < 60) return `Saved ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Saved ${hours}h ago`;
}

export function NotepadCard() {
  const { activeWorkspaceId } = useWorkspace();
  const confirmDialog = useConfirm();

  const [text, setText] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState(0);
  // Tracks the text last known to be in storage (from load or from a
  // completed save), so the autosave effect can tell a load-triggered text
  // change apart from a real edit and never bump "Saved just now" for a note
  // the user hasn't touched.
  const lastSyncedTextRef = React.useRef("");

  // Load on mount and whenever the active workspace changes, so switching
  // workspaces never bleeds one project's scratch notes into another's.
  React.useEffect(() => {
    const entry = readNotepad(window.localStorage, activeWorkspaceId);
    lastSyncedTextRef.current = entry.text;
    setText(entry.text);
    setUpdatedAt(entry.updatedAt);
  }, [activeWorkspaceId]);

  // The dock's Note tab writes the same note (live-verification finding: a
  // note typed there silently never appeared here until a reload). Re-read
  // on any external write; same-value sets are a no-op re-render, so this is
  // safe even when the change is this card's own debounced write echoing back.
  React.useEffect(() => {
    const onChange = () => {
      const entry = readNotepad(window.localStorage, activeWorkspaceId);
      lastSyncedTextRef.current = entry.text;
      setText(entry.text);
      setUpdatedAt(entry.updatedAt);
    };
    window.addEventListener(NOTEPAD_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(NOTEPAD_CHANGE_EVENT, onChange);
  }, [activeWorkspaceId]);

  // Autosave, debounced: no external library needed for a single timer.
  React.useEffect(() => {
    if (text === lastSyncedTextRef.current) return;
    const timer = setTimeout(() => {
      writeNotepad(window.localStorage, activeWorkspaceId, text);
      lastSyncedTextRef.current = text;
      setUpdatedAt(text.trim().length === 0 ? 0 : Date.now());
    }, NOTEPAD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, activeWorkspaceId]);

  const clearNote = async () => {
    const ok = await confirmDialog({
      title: "Clear this note?",
      body: "This clears the notepad for good. It cannot be undone.",
      confirmLabel: "Clear",
      destructive: true,
    });
    if (!ok) return;
    writeNotepad(window.localStorage, activeWorkspaceId, "");
    lastSyncedTextRef.current = "";
    setText("");
    setUpdatedAt(0);
  };

  return (
    <section aria-label="Notepad" style={card}>
      <div className="flex items-baseline" style={{ gap: 10, marginBottom: 8 }}>
        <h3 style={{ ...mono, color: "var(--text-subtle)", margin: 0 }}>Notepad</h3>
        <div style={{ flex: 1 }} />
        {updatedAt > 0 ? (
          <span style={{ ...mono, fontSize: 9.5, color: "var(--text-faint)" }}>
            {relativeTime(updatedAt)}
          </span>
        ) : null}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Jot anything. Only you see this."
        style={{
          width: "100%",
          height: 80,
          resize: "vertical",
          background: "var(--surface-card-deep)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--radius-control)",
          padding: "8px 12px",
          fontSize: 13,
          color: "var(--text-primary)",
          fontFamily: "var(--font-ui)",
        }}
      />
      <div className="flex items-center justify-end" style={{ marginTop: 8 }}>
        <Button
          variant="tertiary"
          onClick={() => void clearNote()}
          disabled={text.trim().length === 0}
          style={{ fontSize: 12 }}
        >
          Clear
        </Button>
      </div>
    </section>
  );
}
