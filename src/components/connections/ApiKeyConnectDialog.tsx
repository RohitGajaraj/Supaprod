import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProviderSpec } from "@/lib/connectors/registry";

// F-CONN Phase 1 — paste-an-API-key connect for api_key providers
// (Linear / Notion / Firecrawl / …). The key is sent once to
// connectWithApiKey, validated against the provider, then vaulted encrypted.

export function ApiKeyConnectDialog({
  spec,
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  spec: ProviderSpec | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (args: { apiKey: string; label?: string }) => void;
  pending: boolean;
}) {
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!open) {
      setApiKey("");
      setLabel("");
    }
  }, [open]);

  const method = spec?.authMethods.find((m) => m.kind === "api_key");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {spec?.label ?? ""}</DialogTitle>
          <DialogDescription>
            {method?.kind === "api_key"
              ? method.help
              : "Paste an API key for this provider. It is stored encrypted."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!apiKey.trim()) return;
            onSubmit({ apiKey: apiKey.trim(), label: label.trim() || undefined });
          }}
          className="space-y-3"
        >
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={method?.kind === "api_key" ? method.placeholder : "API key"}
            aria-label="API key"
            autoFocus
          />
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional, e.g. Acme workspace)"
            aria-label="Connection label"
            maxLength={80}
          />
          <DialogFooter>
            <Button type="submit" size="sm" disabled={pending || !apiKey.trim()}>
              {pending ? "Connecting…" : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
