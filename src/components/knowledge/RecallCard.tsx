// RPT-01 - the Brain "recall card": a named query surface over the ledger.
// Type "why did we decide X?", get a shareable, cited answer in seconds -
// the wedge's demo moment (research §12.1: "cue hours of finding that slack
// conversation"). Deliberately the thinnest surface over what the ledger
// already holds: getJudgmentTimeline's existing decisions + supersession
// composition, extended (this row) with an optional keyword search, so a
// match reads exactly like a Judgment-lens entry - same status chip, same
// "Replaced by 'X'" honesty, same trace ref - because a recalled decision
// and a timeline decision are the same object, just reached a different way.
// Sharing reuses DecisionDetail's ShareDecisionButton verbatim (exported for
// this row) rather than re-deriving the /d/<slug> public-link flow.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { VerdictChip } from "@/components/obsidian/verdict";
import { getJudgmentTimeline, type JudgmentEntry } from "@/lib/brain-front-door.functions";
import { OBS_STATUS_TONE } from "./DecisionsPanel";
import { ageOf, displayWho } from "./decisions-shared";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/cadence/AutoChip";
import { traceRef } from "@/components/discover/format";
import { ShareDecisionButton } from "./DecisionDetail";

const EXAMPLES = ["pricing", "onboarding", "the freemium tier", "checkout"];

function ResultCard({ entry }: { entry: JudgmentEntry }) {
  const navigate = useNavigate();
  const openDetail = () =>
    navigate({ to: "/brain", search: { tab: "decisions", decision: entry.id } });
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--top-light)",
        padding: "4px 18px 14px",
      }}
    >
      <button
        type="button"
        onClick={openDetail}
        className="w-full text-left outline-none hover:[background-color:#141416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          padding: "14px 0 0",
          background: "transparent",
          border: "none",
          borderRadius: "var(--radius-card)",
        }}
      >
        <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
          <VerdictChip tone={OBS_STATUS_TONE[entry.status]} />
          <span style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>
            {stripAutoPrefix(entry.title)}
          </span>
          {isAutoTitle(entry.title) ? <AutoChip /> : null}
        </div>

        {entry.rationale ? (
          <p
            style={{
              fontSize: 12.5,
              color: "var(--text-subtle)",
              margin: "6px 0 0",
              lineHeight: 1.5,
              // Two-line cite excerpt, never a single truncated sliver -
              // a recalled answer needs enough of the "why" to be useful.
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {entry.rationale}
          </p>
        ) : null}

        <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 8 }}>
          {entry.decidedBy ? (
            <>
              <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>
                decided by {displayWho(entry.decidedBy)}
              </span>
              <span style={{ color: "var(--text-faint)" }}>·</span>
            </>
          ) : null}
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              color: "var(--text-subtle)",
            }}
          >
            {ageOf(entry.createdAt)}
          </span>
        </div>

        {/* Same honesty rule as the Judgment timeline: a stale citation says
            so, in plain language, right where the answer is being read. */}
        {entry.supersededByTitle ? (
          <p
            style={{
              fontSize: 11.5,
              color: "var(--madder-bright)",
              margin: "6px 0 0",
              lineHeight: 1.5,
            }}
          >
            Replaced by '{entry.supersededByTitle}'
          </p>
        ) : entry.contradicted ? (
          <p
            style={{
              fontSize: 11.5,
              color: "var(--madder-bright)",
              margin: "6px 0 0",
              lineHeight: 1.5,
            }}
          >
            A later outcome contradicted this, no replacement decided yet
          </p>
        ) : null}

        <span
          style={{
            display: "block",
            marginTop: 8,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.06em",
            color: "var(--text-faint)",
          }}
        >
          DEC·{traceRef(entry.id)}
        </span>
      </button>

      <div style={{ marginTop: 10 }}>
        <ShareDecisionButton id={entry.id} />
      </div>
    </div>
  );
}

export function RecallCard() {
  const [text, setText] = useState("");
  const [searchedFor, setSearchedFor] = useState<string | null>(null);
  const fRecall = useServerFn(getJudgmentTimeline);

  const search = useMutation({
    mutationFn: (q: string) => fRecall({ data: { q } }),
  });

  const runSearch = () => {
    const q = text.trim();
    if (!q) return;
    setSearchedFor(q);
    search.mutate(q);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: "var(--surface-card, var(--card))",
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--radius-panel, 14px)",
          boxShadow: "var(--top-light)",
          padding: "18px 20px",
        }}
      >
        <MonoLabel style={{ display: "block", marginBottom: 10 }}>
          Ask why a call was made
        </MonoLabel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          className="flex items-center"
          style={{ gap: 10 }}
        >
          <span className="relative flex-1" style={{ minWidth: 0 }}>
            <Search
              size={14}
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-faint)",
              }}
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Why did we decide to... ?"
              aria-label="Ask why a call was made"
              style={{
                width: "100%",
                fontSize: 14,
                fontFamily: "var(--font-ui)",
                color: "var(--text-primary)",
                background: "var(--surface-recessed, var(--raised))",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-control)",
                padding: "10px 12px 10px 34px",
              }}
            />
          </span>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={search.isPending}
            disabled={!text.trim()}
          >
            Recall
          </Button>
        </form>
        {!searchedFor ? (
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "10px 0 0" }}>
            Searches your own record - titles and rationales already on the ledger. Try{" "}
            {EXAMPLES.map((ex, i) => (
              <span key={ex}>
                <button
                  type="button"
                  onClick={() => {
                    setText(ex);
                    setSearchedFor(ex);
                    search.mutate(ex);
                  }}
                  className="hover:underline"
                  style={{
                    color: "var(--text-subtle)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {ex}
                </button>
                {i < EXAMPLES.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      {search.isPending ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            padding: "16px 18px",
          }}
        >
          <p style={{ fontSize: 12.5, color: "var(--text-subtle)", margin: 0 }}>
            Searching your record...
          </p>
        </div>
      ) : search.isError ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            padding: "16px 18px",
          }}
        >
          <MonoLabel style={{ marginBottom: 8, display: "block" }}>
            Recall · failed to search
          </MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
            {(search.error as Error)?.message ?? "Unknown error"}
          </p>
          <Button variant="secondary" onClick={() => searchedFor && search.mutate(searchedFor)}>
            Retry
          </Button>
        </div>
      ) : search.data ? (
        search.data.entries.length === 0 ? (
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-card)",
              padding: "24px 22px",
            }}
          >
            <p style={{ fontSize: 12.5, color: "var(--text-subtle)", lineHeight: 1.6, margin: 0 }}>
              No matching decision on record for '{searchedFor}'. Try different words - the search
              matches the decision's title and its recorded rationale.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {search.data.entries.map((entry) => (
              <ResultCard key={entry.id} entry={entry} />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
