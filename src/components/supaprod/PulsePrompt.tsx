// PC-15: the tiny in-product feedback pulse. Thumb reaction submits
// immediately (one real signal, no lost feedback if the user never opens
// a note field); the optional line is a genuine add-on, not a blocker.
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { submitPulse, type PulseSurface } from "@/lib/pulse.functions";

export function PulsePrompt({ surface, targetId }: { surface: PulseSurface; targetId: string }) {
  const [reacted, setReacted] = useState<"useful" | "not_useful" | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [noteSent, setNoteSent] = useState(false);
  const fSubmit = useServerFn(submitPulse);

  const react = useMutation({
    mutationFn: (useful: boolean) => fSubmit({ data: { surface, targetId, useful } }),
    onSuccess: (_, useful) => setReacted(useful ? "useful" : "not_useful"),
  });

  const sendNote = useMutation({
    mutationFn: () =>
      fSubmit({
        data: { surface, targetId, useful: reacted === "useful", note: note.trim() },
      }),
    onSuccess: () => setNoteSent(true),
  });

  if (!reacted) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--ds-gray-900, var(--text-muted))" }}>Was this useful?</span>
        <button
          type="button"
          aria-label="Useful"
          onClick={() => react.mutate(true)}
          disabled={react.isPending}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          👍
        </button>
        <button
          type="button"
          aria-label="Not useful"
          onClick={() => react.mutate(false)}
          disabled={react.isPending}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          👎
        </button>
      </div>
    );
  }

  return (
    <div style={{ color: "var(--ds-gray-900, var(--text-muted))" }}>
      {noteSent ? (
        <span>Thanks, noted.</span>
      ) : showNote ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What made you say that?"
            rows={2}
            style={{
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid var(--hairline)",
              background: "transparent",
              color: "inherit",
              resize: "vertical",
            }}
          />
          <button
            type="button"
            onClick={() => sendNote.mutate()}
            disabled={!note.trim() || sendNote.isPending}
            style={{
              alignSelf: "flex-start",
              padding: "3px 10px",
              borderRadius: 99,
              border: "1px solid var(--hairline)",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {sendNote.isPending ? "Sending..." : "Send"}
          </button>
        </div>
      ) : (
        <span>
          Thanks.{" "}
          <button
            type="button"
            onClick={() => setShowNote(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              textDecoration: "underline",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            Say more
          </button>
        </span>
      )}
    </div>
  );
}
