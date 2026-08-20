import { Dialog } from "@/components/meridian/Dialog";
import { Action, Actions, Eyebrow } from "@/components/meridian/surface-parts";
import type { ProviderId } from "@/lib/connectors/registry";
import { trustCopyFor } from "@/lib/connect-trust";
import { ProviderLogo } from "./ProviderLogo";

// RPT-02 - the connect-moment trust card. Shown inline the moment a user
// clicks Connect, before the OAuth redirect fires - not on a policy page
// they have to go find. Answers what we read / what we never read / where
// it lives / no-training / one-click revoke, right at the moment it matters.
//
// EVERY STRING HERE IS LOAD BEARING AND NONE OF IT IS OURS TO REWORD. The two
// provider lines come from `trustCopyFor`, which is hand-authored per provider
// precisely so a trust claim is never derived from a scope string, and
// `connectors/registry.ts` records that this component renders one of those
// lines VERBATIM on purpose. A port that improves the wording breaks a
// documented contract, so the 2026-08 Meridian port changed the paint and not
// one character of the copy.
//
// ── WHAT THE MERIDIAN PORT ACTUALLY MOVED ───────────────────────────────
// Was `@/components/ui/dialog` and `@/components/ui/button`, the retired Tempo
// v5 (shadcn) layer, plus the Tempo class `text-copy-13`. Now Meridian's own
// `Dialog` and `Action`. Three differences worth writing down, because each one
// looks like a liberty and is not:
//
//   THE PRIMARY IS `Action variant="primary"` AND NOT `Approve`. `Approve` is
//       the one place orchid is spent on a control, and it names a GATE: work
//       is stopped until the click lands. A dialog the reader opened by
//       pressing Connect is not stopped work, so the accent would be spent on
//       chrome and would stop meaning anything where it does matter.
//   THE ROWS ALIGN ON THE BASELINE rather than on `items-start` with a `pt-px`
//       nudge. The nudge existed to drag a 10px label onto the first line of a
//       13px value; `items-baseline` is the same intent stated exactly, and it
//       survives the value wrapping to two or three lines in a 420px pane.
//   ONE RULE BETWEEN ROWS, NOT TWO. The retired version set `divide-y` on the
//       container AND `border-b` on every row, so between any two rows a
//       bottom edge and a top edge stacked into a 2px line. Only the last row's
//       suppression was doing anything a reader could see.
//
// The body is Meridian's `Dialog` body slot, a div rather than a paragraph,
// which is what these structured rows need: they are a labelled list, not prose.

function TrustLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-mrd-5 border-b border-mrd-line-soft py-mrd-4 last:border-b-0">
      {/* The label column is fixed so five labels of different lengths do not
          give the values five different left edges. `Eyebrow` is the micro-label
          Meridian already owns: 10px, weight 650, `tracking-mrd-label`, muted.
          It is the sans face rather than the mono the retired row reached for,
          per `Num`'s rule that mono is for data a reader compares down a column,
          and a word is not that. */}
      <span className="w-28 shrink-0">
        <Eyebrow>{label}</Eyebrow>
      </span>
      {/* Ink, not body: the label is the quiet half of this pair and the claim is
          the half a person is here to read. Size and leading are inherited from
          the Dialog's body slot, so a trust line cannot drift away from the
          measure every other dialog in the product reads at. */}
      <span className="min-w-0 text-mrd-ink">{value}</span>
    </div>
  );
}

export function ConnectTrustDialog({
  provider,
  label,
  open,
  onOpenChange,
  onContinue,
  busy,
}: {
  provider: ProviderId | null;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  busy: boolean;
}) {
  const copy = provider ? trustCopyFor(provider) : { weRead: "", weNeverRead: "" };

  return (
    <Dialog
      open={open}
      /* Escape and the scrim both land here. The signature stays `onOpenChange`
         because three live call sites in `AccountConnectionsSection` drive this
         with a `useState` setter, and Meridian's Dialog only ever reports a
         dismissal. */
      onClose={() => onOpenChange(false)}
      title={
        <span className="flex items-center gap-mrd-4">
          {provider ? <ProviderLogo provider={provider} size={20} /> : null}
          Connect {label}
        </span>
      }
      actions={
        <Actions>
          <Action variant="quiet" onClick={() => onOpenChange(false)}>
            Cancel
          </Action>
          <Action variant="primary" onClick={onContinue} disabled={busy || !provider}>
            {`Continue to ${label}`}
          </Action>
        </Actions>
      }
    >
      <div>
        <TrustLine label="We read" value={copy.weRead} />
        <TrustLine label="We never read" value={copy.weNeverRead} />
        <TrustLine
          label="Where it lives"
          value="Encrypted at rest. Only your workspace can use it."
        />
        <TrustLine label="Training" value="Supaprod never trains models on your data." />
        <TrustLine label="Revoke" value="One click, anytime, from this same screen." />
      </div>
    </Dialog>
  );
}
