export interface SignalCardProps {
  src: string;
  when: string;
  quote: string;
  theme: string | null;
  /** Last card in the feed omits the divider (OBS-06.md §7). */
  isLast?: boolean;
}

/** One verbatim signal: source pill, timestamp, quote, theme line. Read-only. */
export function SignalCard({ src, when, quote, theme, isLast = false }: SignalCardProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: "5px",
        paddingBottom: "13px",
        borderBottom: isLast ? undefined : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8.5px",
            letterSpacing: "0.08em",
            color: "#E5BDDF",
            border: "1px solid rgba(229,189,223,0.35)",
            borderRadius: "99px",
            padding: "1px 7px",
          }}
        >
          {src}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8.5px",
            letterSpacing: "0.08em",
            color: "#55524C",
          }}
        >
          {when}
        </span>
      </div>
      <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#B5AFA6", margin: 0 }}>{quote}</p>
      {theme ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8.5px",
            letterSpacing: "0.08em",
            color: "#7D786F",
          }}
        >
          {theme}
        </span>
      ) : null}
    </div>
  );
}
