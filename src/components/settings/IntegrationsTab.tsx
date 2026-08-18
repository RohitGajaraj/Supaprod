// Q1-MCP-P3 · Settings -> Agent access, Lane F.
//
// The Phase-3 UI for the read-only MCP (Model Context Protocol) server whose
// backend (token RPCs + the live /api/mcp JSON-RPC route, 4 tool dispatchers,
// rate-limit, audit) already shipped (Phase 1/2). This surface lets an
// operator issue and revoke per-workspace MCP tokens and copy the connection
// details, so an external agent can use Supaprod as a governed tool.
//
// Honesty note (Phase 4a, 2026-06-21): /api/mcp now speaks the native MCP
// request/response methods (initialize / ping / tools.list / tools.call /
// notifications) over JSON-RPC-over-HTTP, so a standards-compliant MCP client
// that accepts a single JSON response and a manually-pasted bearer header
// completes the handshake. SSE/streamable streaming and OAuth auto-discovery
// remain Phase 4b, so the panel still leads with the working curl + bearer
// contract rather than promising zero-config desktop discovery ("claim never
// outruns wiring").
//
// Ported to the rebuild primitives 2026-07-29. The route draws the PageHead and
// the "what an agent outside Supaprod may read" line, so the intro card that
// said the same thing a second time is gone (hard ban 10). The four stacked
// `material-medium` cards are four Blocks, which are rules rather than boxes.
//
// The one thing on this surface that genuinely wears ember is the freshly
// issued secret: it is shown once, it is asking the human to act now, and if
// they do not, it is lost. That is the definition of the gate colour. Every
// other control here stays monochrome.
import { useServerFn } from "@tanstack/react-start";
import { Line } from "@/components/meridian/rows";
import { Num, Actions } from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
import { Block, Button, Empty, Failed, Field, Input, Loading, Pre } from "@/components/shell/primitives";
import {
  listMCPTokens,
  issueMCPToken,
  revokeMCPToken,
  type MCPTokenInfo,
} from "@/lib/mcp.functions";

const MCP_METHODS = [
  { name: "search_signals", desc: "Search discovery signals by keyword" },
  { name: "search_opportunities", desc: "Search opportunities by title/problem or ICE" },
  { name: "search_decisions", desc: "Search decisions, each tagged still-stands or superseded" },
  { name: "search_prds", desc: "Find specs by keyword or status" },
  { name: "get_prd", desc: "Fetch a spec's requirements" },
  { name: "get_ard", desc: "Fetch a spec's compiled ARD (contract + oracles)" },
  { name: "get_roadmap", desc: "Fetch the roadmap: now / next / later by ICE" },
  {
    name: "export_skillpack",
    desc: "Export the workspace's distilled lessons as a versioned skill-pack",
  },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) {
    const h = Math.floor(ms / 3_600_000);
    if (h <= 0) return "just now";
    return `${h}h ago`;
  }
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      aria-label={copied ? "Copied to clipboard" : `${label} to clipboard`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error("Couldn't copy. Select and copy manually.");
        }
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

export function IntegrationsTab() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { activeWorkspaceId } = useWorkspace();

  const fList = useServerFn(listMCPTokens);
  const fIssue = useServerFn(issueMCPToken);
  const fRevoke = useServerFn(revokeMCPToken);

  const tokensQ = useQuery({
    queryKey: ["mcp-tokens", activeWorkspaceId],
    queryFn: () => fList({ data: { workspace_id: activeWorkspaceId as string } }),
    enabled: !!activeWorkspaceId,
  });

  const [slug, setSlug] = useState("");
  const [rate, setRate] = useState(60);
  const [freshToken, setFreshToken] = useState<string | null>(null);

  const issue = useMutation({
    mutationFn: () =>
      fIssue({
        data: {
          workspace_id: activeWorkspaceId as string,
          slug: slug.trim(),
          rate_limit_per_min: rate,
        },
      }),
    onSuccess: (res) => {
      setFreshToken(res.display_token);
      setSlug("");
      setRate(60);
      qc.invalidateQueries({ queryKey: ["mcp-tokens"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (tokenId: string) => fRevoke({ data: { token_id: tokenId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mcp-tokens"] });
      toast.success("Token revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onRevoke(t: MCPTokenInfo) {
    const ok = await confirm({
      title: `Revoke "${t.slug}"?`,
      body: "Any external agent using this token stops working immediately. This can't be undone. Issue a new token to reconnect.",
      destructive: true,
      confirmLabel: "Revoke token",
    });
    if (ok) revoke.mutate(t.id);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const endpoint = `${origin}/api/mcp`;
  const curl = [
    `curl -X POST ${endpoint || "https://YOUR-SUPAPROD-HOST/api/mcp"} \\`,
    `  -H "Authorization: Bearer YOUR_TOKEN" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"jsonrpc":"2.0","id":1,"method":"search_opportunities","params":{"query":"","limit":5}}'`,
  ].join("\n");

  const tokens = (tokensQ.data ?? []) as MCPTokenInfo[];
  const live = tokens.filter((t) => !t.revoked_at).length;

  if (!activeWorkspaceId) {
    return <Empty>Pick a workspace to manage its agent access.</Empty>;
  }

  return (
    <>
      <Block
        title="Issue a token"
        sub="Name it for the tool that will use it. The secret is shown once, right after you create it."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (slug.trim() && !issue.isPending) issue.mutate();
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "var(--sp-space-2)",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <Field label="Token name">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. claude-desktop, cursor, my-agent"
                maxLength={100}
                aria-label="Token name"
                style={{ minWidth: 260 }}
              />
            </Field>
            <Field label="Calls per minute">
              <Input
                type="number"
                min={1}
                max={1000}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                aria-label="Rate limit per minute"
                style={{ width: 130 }}
              />
            </Field>
            <Actions>
              <Button type="submit" variant="primary" disabled={!slug.trim() || issue.isPending}>
                {issue.isPending ? "Issuing" : "Issue token"}
              </Button>
            </Actions>
          </div>
        </form>

        {freshToken ? (
          // Ember, and this is the one place on the surface that earns it: the
          // secret exists for as long as this element does, and it is asking
          // the human to act right now. Border only, never a fill.
          <div
            style={{
              marginTop: "var(--sp-space-4)",
              padding: "var(--sp-space-4)",
              borderRadius: "var(--sp-radius-panel)",
              border: "1px solid var(--sp-gate)",
            }}
          >
            <div
              style={{
                fontSize: "var(--sp-text-prose)",
                fontWeight: "var(--sp-weight-strong)",
                color: "var(--sp-ink)",
              }}
            >
              Copy it now. It is not shown again.
            </div>
            <Pre>{freshToken}</Pre>
            <Actions>
              <CopyButton text={freshToken} label="Copy token" />
              <Button variant="ghost" onClick={() => setFreshToken(null)}>
                Done
              </Button>
            </Actions>
          </div>
        ) : null}
      </Block>

      <Block
        title="Active tokens"
        sub={
          tokensQ.isSuccess
            ? `${live} ${live === 1 ? "token" : "tokens"} can reach this workspace right now.`
            : undefined
        }
      >
        {tokensQ.isLoading ? (
          <Loading>Reading the issued tokens.</Loading>
        ) : tokensQ.error ? (
          <Failed onRetry={() => void tokensQ.refetch()}>
            The token list did not load. {(tokensQ.error as Error).message}
          </Failed>
        ) : tokens.length === 0 ? (
          <Empty>No tokens yet. Issue one above to connect an external agent.</Empty>
        ) : (
          tokens.map((t) => {
            const revoked = !!t.revoked_at;
            return (
              <Line
                key={t.id}
                label={revoked ? `${t.slug} · revoked` : t.slug}
                sub={
                  <>
                    created {fmtDate(t.created_at)} · last used {fmtDate(t.last_used_at)} ·{" "}
                    <Num>{t.rate_limit_per_min}</Num>/min
                  </>
                }
              >
                {!revoked ? (
                  <Button
                    variant="ghost"
                    aria-label={`Revoke ${t.slug}`}
                    disabled={revoke.isPending && revoke.variables === t.id}
                    onClick={() => onRevoke(t)}
                  >
                    Revoke
                  </Button>
                ) : null}
              </Line>
            );
          })
        )}
      </Block>

      <Block
        title="How to connect"
        sub="It speaks the native MCP handshake (initialize, tools/list, tools/call) over JSON-RPC 2.0, so a standards client connects with a pasted bearer header."
      >
        <Line label="Endpoint" sub={endpoint || "/api/mcp"}>
          <CopyButton text={endpoint || "/api/mcp"} />
        </Line>
        {/* A JSX string attribute is not HTML, so the angle brackets are written
            as literal characters rather than entities. */}
        <Line label="Auth" sub={"Authorization: Bearer <your-token>"} />

        <Actions>
          <CopyButton text={curl} label="Copy curl" />
        </Actions>
        <Pre>{curl}</Pre>
      </Block>

      <Block
        title="What a token can call"
        sub="Read access, plus appending a decision that still waits for your approval."
      >
        {/* A method name is an identifier, and identifiers are mono. */}
        {MCP_METHODS.map((m) => (
          <Line key={m.name} label={<Num>{m.name}</Num>} sub={m.desc} />
        ))}
      </Block>
    </>
  );
}
