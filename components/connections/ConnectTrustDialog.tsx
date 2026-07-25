import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ProviderId } from "@/lib/connectors/registry";
import { trustCopyFor } from "@/lib/connect-trust";
import { ProviderLogo } from "./ProviderLogo";

// RPT-02 - the connect-moment trust card. Shown inline the moment a user
// clicks Connect, before the OAuth redirect fires - not on a policy page
// they have to go find. Answers what we read / what we never read / where
// it lives / no-training / one-click revoke, right at the moment it matters.
// DialogDescription (a <p>) is deliberately skipped in favor of a plain div
// list, since the trust lines are structured rows, not a single paragraph.

function TrustLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
      <span className="w-28 shrink-0 pt-px font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-copy-13 text-foreground">{value}</span>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {provider ? <ProviderLogo provider={provider} size={20} /> : null}
            <DialogTitle>Connect {label}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="divide-y divide-border">
          <TrustLine label="We read" value={copy.weRead} />
          <TrustLine label="We never read" value={copy.weNeverRead} />
          <TrustLine
            label="Where it lives"
            value="Encrypted at rest. Only your workspace can use it."
          />
          <TrustLine label="Training" value="Supaprod never trains models on your data." />
          <TrustLine label="Revoke" value="One click, anytime, from this same screen." />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onContinue} disabled={busy || !provider}>
            {`Continue to ${label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
