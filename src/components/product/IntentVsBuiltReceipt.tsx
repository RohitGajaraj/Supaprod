/**
 * RPT-44 - Intent-vs-built diff receipt.
 *
 * After a Build run ships a changeset, this panel renders what the agents
 * delivered against the PRD's stated intent, as an honest receipt: each intent
 * point marked evidenced (its words appear in the release notes) or not-evident,
 * an overall coverage line, and the matched terms. The caption is deliberately
 * blunt that this is text evidence, not a correctness guarantee. When no
 * changeset has shipped yet it shows a calm empty state.
 *
 * Reads getIntentVsBuiltReceipt; the grading is pure and lives in intent-diff.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, CircleDashed, ExternalLink, Minus, Receipt } from "lucide-react";
import { getIntentVsBuiltReceipt } from "@/lib/intent-diff.functions";

export function IntentVsBuiltReceipt({ prdId }: { prdId: string }) {
  const fGet = useServerFn(getIntentVsBuiltReceipt);
  const q = useQuery({
    queryKey: ["intent-vs-built", prdId],
    queryFn: () => fGet({ data: { prdId } }),
  });

  if (q.isLoading) {
    return (
      <div className="rounded-lg border hairline bg-card/60 p-6">
        <div className="mono-label mb-3">Intent vs built</div>
        <p className="text-xs text-muted-foreground">Reading what shipped...</p>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="rounded-lg border hairline bg-card/60 p-6">
        <div className="mono-label mb-3">Intent vs built</div>
        <p className="text-xs text-destructive">
          {q.error instanceof Error ? q.error.message : "Could not build the comparison."}
        </p>
      </div>
    );
  }

  const { receipt, changeset, has_build } = q.data;

  if (!has_build) {
    return (
      <div className="rounded-lg border hairline bg-card/60 p-6 text-center">
        <Receipt className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-1">No shipped build yet.</p>
        <p className="text-xs text-muted-foreground">
          Once a changeset ships for this spec, this comparison checks what shipped against the
          stated intent.
        </p>
      </div>
    );
  }

  const total = receipt.points.length;
  const checkable = receipt.points.filter((p) => p.checkable).length;
  const evidenced = receipt.points.filter((p) => p.evidenced).length;
  const pct = Math.round(receipt.coverage * 100);

  return (
    <div className="rounded-lg border hairline bg-card/60 p-6">
      <div className="mono-label mb-3 flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <Receipt className="h-3 w-3" />
          Intent vs built
        </span>
        {/* THE CLASS, NOT THE `Button` PRIMITIVE, BECAUSE THIS IS A LINK. It is
            the one control in this port that leaves the app: `Button` renders
            `<button type="button">`, so adopting it would drop href, target and
            rel and turn a middle-clickable PR link into a dead box. `.sp-btn` is
            a plain class selector and dresses an anchor exactly as it dresses a
            button, which is what the two `<Link className="sp-btn">` call sites
            in connections and /sync already do.

            An action rather than an escape, so it takes the raised default and
            no `data-variant`. `inline-flex items-center` went with the pill --
            `.sp-btn` already declares both -- and `gap-1.5` stayed, because it
            does not. `normal-case tracking-normal` stay too: the parent is
            `.mono-label`, and `font: inherit` resets neither text-transform nor
            letter-spacing. */}
        {changeset?.pr_url ? (
          <a
            href={changeset.pr_url}
            target="_blank"
            rel="noreferrer"
            className="sp-btn gap-1.5 normal-case tracking-normal"
            title={changeset.title ?? "Open the pull request"}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {changeset.pr_number ? `PR #${changeset.pr_number}` : "Open PR"}
          </a>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="text-xs text-muted-foreground">
          This spec has no structured success metrics or acceptance criteria to check the build
          against.
        </p>
      ) : (
        <>
          {checkable > 0 ? (
            <p className="text-sm leading-mrd-prose mb-4">
              {evidenced} of {checkable} checkable intent point{checkable === 1 ? "" : "s"} show up
              in the release notes
              <span className="text-muted-foreground"> ({pct}% by text)</span>.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">
              No intent point has gradeable wording to check against the build.
            </p>
          )}

          <ul className="space-y-2">
            {receipt.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-mrd-prose">
                {!p.checkable ? (
                  <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                ) : p.evidenced ? (
                  <Check className="h-3.5 w-3.5 text-foreground shrink-0 mt-0.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <span className={p.evidenced ? "" : "text-muted-foreground"}>{p.text}</span>
                  {!p.checkable ? (
                    <div className="mt-0.5 text-mrd-tiny text-muted-foreground">
                      no gradeable terms to check
                    </div>
                  ) : p.evidenced && p.matched_terms.length > 0 ? (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {p.matched_terms.map((t) => (
                        <span
                          key={t}
                          className="mono-label text-[9px] px-1.5 py-0.5 rounded border hairline text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-mrd-tiny text-muted-foreground">
                      not evident in the release notes
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-5 text-mrd-tiny text-muted-foreground leading-mrd-prose">
        This is a text-evidence projection ({receipt.evidence_basis}): it checks whether the words
        of each intent point appear in what shipped. It is a signal that a point was addressed, not
        a guarantee the behavior is correct.
      </p>
    </div>
  );
}
