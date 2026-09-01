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
// `material-medium` cards are four regions, which are rules rather than boxes.
//
// The one thing on this surface that genuinely wears the accent is the freshly
// issued secret: it is shown once, it is asking the human to act now, and if
// they do not, it is lost. That is the definition of the gate colour. Every
// other control here stays monochrome.
//
// Ported to Meridian 2026-08-20. That accent is `--mrd-you`, orchid, which is
// what `--sp-gate` had already been aliased to: this paragraph said "ember" and
// the paint had not been ember for some time. Border only, never a fill.
import { useServerFn } from "@tanstack/react-start";
import { Line } from "@/components/meridian/rows";
import {
  Num,
  Actions,
  Action,
  NothingYet,
  Pre,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
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
    <Action
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
    </Action>
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
  /*
    ── THE SAMPLE CONTRADICTED THE SENTENCE ABOVE IT (2026-09-01) ────────────
    The paragraph over this block says the endpoint *"speaks the native MCP
    handshake (initialize, tools/list, tools/call) ... so a standards client
    connects with a pasted bearer header"*, and the curl under it then sent
    `"method":"search_opportunities"` -- which is NOT any of those three.

    THE COMMAND WORKED, and that is what made it worth fixing rather than
    harmless. `api/mcp.ts:194` dispatches bare tool names as methods alongside
    the standard shape, so a developer who pastes this gets a 200 and learns a
    protocol no other MCP server accepts. They then write their client against
    it. A wrong example that FAILS is a five-minute detour; a wrong example
    that succeeds is a client that has to be rewritten later.

    `tools/list` is the right first call for a different reason too: it is the
    one request that needs no arguments, so it proves the token, the header and
    the handshake in a single line without the reader inventing a query. What
    it returns is the menu for every call after it.
  */
  const curl = [
    `curl -X POST ${endpoint || "https://YOUR-SUPAPROD-HOST/api/mcp"} \\`,
    `  -H "Authorization: Bearer YOUR_TOKEN" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`,
  ].join("\n");

  const tokens = (tokensQ.data ?? []) as MCPTokenInfo[];
  const live = tokens.filter((t) => !t.revoked_at).length;

  if (!activeWorkspaceId) {
    /*
     * AN INSTRUCTION WITH NO WAY TO FOLLOW IT IS A DEAD END. This read "Pick a
     * workspace to manage its agent access." and offered nothing to pick with:
     * no control, no door, and no explanation of why none is named. The
     * switcher is in the shell header, which a reader who has just been told to
     * pick one has no reason to know.
     *
     * It also fires when the workspace read simply FAILED, where "pick one" is
     * not advice, it is wrong -- they have one and we could not see it.
     */
    return (
      <NothingYet>
        No workspace is selected, so there is nothing to grant access to yet. Choose one from the
        workspace switcher at the top of the window, and this fills in.
      </NothingYet>
    );
  }

  return (
    <>
      <Region
        title="Issue a token"
        sub="Name it for the tool that will use it. The secret is shown once, right after you create it."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (slug.trim() && !issue.isPending) issue.mutate();
          }}
        >
          {/* The gap was `--sp-space-2`, 8px. Meridian's ramp steps 6px then
              10px, so there is no 8: taking `--mrd-s4` because the ratchet
              forbids shrinking a surface to answer a port. */}
          <div
            style={{
              display: "flex",
              gap: "var(--mrd-s4)",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            {/* Meridian's `Field` renders its label as a SIBLING bound by
                `htmlFor`, where the retired one wrapped the control, so both ids
                are real and minted here. The `aria-label`s stay: an existing one
                still wins the accessible name, and dropping it would change what
                a screen reader says while porting the paint. */}
            <Field label="Token name" htmlFor="mcp-token-name">
              <Input
                id="mcp-token-name"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. claude-desktop, cursor, my-agent"
                maxLength={100}
                aria-label="Token name"
                style={{ minWidth: 260 }}
              />
            </Field>
            <Field label="Calls per minute" htmlFor="mcp-rate-limit">
              <Input
                id="mcp-rate-limit"
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
              <Action type="submit" variant="primary" disabled={!slug.trim() || issue.isPending}>
                {issue.isPending ? "Issuing" : "Issue token"}
              </Action>
            </Actions>
          </div>
        </form>

        {freshToken ? (
          // `--mrd-you`, orchid, and this is the one place on the surface that
          // earns it: the secret exists for as long as this element does, and it
          // is asking the human to act right now. Border only, never a fill.
          <div
            style={{
              marginTop: "var(--mrd-s5)",
              padding: "var(--mrd-s5)",
              borderRadius: "var(--mrd-r-card)",
              border: "1px solid var(--mrd-you)",
            }}
          >
            <div
              style={{
                // 13.5px had no stop on Meridian's ramp, which steps 13px then
                // 14px. Taking the larger: the ratchet forbids shrinking type to
                // answer a port, and this is the one sentence on the surface that
                // has to be read before the secret disappears.
                fontSize: "var(--mrd-t-prose)",
                fontWeight: "var(--mrd-w-semi)",
                color: "var(--mrd-ink)",
              }}
            >
              Copy it now. It is not shown again.
            </div>
            {/* Meridian's `Pre` sets no outer margin, where `.sp-pre` baked in a
                12px `margin-top`. The ramp has no 12, so this states 16px rather
                than 10px, for the same reason as the type above. */}
            <div className="mt-mrd-5">
              <Pre>{freshToken}</Pre>
            </div>
            <Actions>
              <CopyButton text={freshToken} label="Copy token" />
              <Action variant="quiet" onClick={() => setFreshToken(null)}>
                Done
              </Action>
            </Actions>
          </div>
        ) : null}
      </Region>

      <Region
        title="Active tokens"
        sub={
          tokensQ.isSuccess
            ? `${live} ${live === 1 ? "token" : "tokens"} can reach this workspace right now.`
            : undefined
        }
      >
        {tokensQ.isLoading ? (
          <Reading>Reading the issued tokens.</Reading>
        ) : tokensQ.error ? (
          <ReadFailedLine error={tokensQ.error} onRetry={() => void tokensQ.refetch()}>
            The token list did not load.
          </ReadFailedLine>
        ) : tokens.length === 0 ? (
          <NothingYet>No tokens yet. Issue one above to connect an external agent.</NothingYet>
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
                  <Action
                    variant="quiet"
                    aria-label={`Revoke ${t.slug}`}
                    disabled={revoke.isPending && revoke.variables === t.id}
                    onClick={() => onRevoke(t)}
                  >
                    Revoke
                  </Action>
                ) : null}
              </Line>
            );
          })
        )}
      </Region>

      <Region
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
        <div className="mt-mrd-5">
          <Pre>{curl}</Pre>
        </div>
      </Region>

      <Region
        title="What a token can call"
        sub="Read access, plus appending a decision that still waits for your approval."
      >
        {/* A method name is an identifier, and identifiers are mono. */}
        {MCP_METHODS.map((m) => (
          <Line key={m.name} label={<Num>{m.name}</Num>} sub={m.desc} />
        ))}
      </Region>
    </>
  );
}
