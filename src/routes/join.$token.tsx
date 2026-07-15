import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { acceptInvitation } from "@/lib/workspaces.functions";
import { authErrorMessage } from "@/lib/auth-errors";
import { CadenceMark } from "@/components/cadence/CadenceMark";
import { useObsidianAuthSurface } from "@/components/cadence/AuthScaffold";

// WM-F5 accept side: the join landing for a workspace invitation link. A standalone
// page (not under the auth shell, so a logged-out invitee gets a clear prompt instead of
// a silent bounce that loses the token). If signed in, it redeems the token via
// acceptInvitation (the email-bound, single-use definer RPC) and drops the user into the app.
// auth_surfaces pass: on-brand dark surface + humanized invite errors; the accept
// mechanism, the single-use double-run guard, and the states are unchanged. The token
// is never logged or echoed into an error string.
// Engine-Room: the accept_workspace_invitation RPC -> a calm "You're in" landing -> the user
// just lands in the workspace, no mechanism shown.

export const Route = createFileRoute("/join/$token")({
  ssr: false,
  component: JoinPage,
  head: () => ({ meta: [{ title: "Join a workspace · Cadence" }] }),
});

type State =
  | { kind: "checking" }
  | { kind: "needs-login" }
  | { kind: "accepting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const surface: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "var(--canvas)",
  color: "var(--text-primary)",
};

const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card, 12px)",
  boxShadow: "var(--shadow-elevated)",
  padding: 32,
  maxWidth: 420,
  width: "100%",
  textAlign: "center",
};

function JoinPage() {
  useObsidianAuthSurface();
  const { token } = Route.useParams();
  const fAccept = useServerFn(acceptInvitation);
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "checking" });
  const ran = useRef(false);

  useEffect(() => {
    // Accept is single-use and not idempotent, so guard against a double run
    // (StrictMode invokes effects twice in dev).
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setState({ kind: "needs-login" });
        return;
      }
      setState({ kind: "accepting" });
      try {
        await fAccept({ data: { token } });
        if (!cancelled) setState({ kind: "done" });
      } catch (e) {
        if (!cancelled) {
          setState({ kind: "error", message: authErrorMessage(e, "invite") });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, fAccept]);

  return (
    <div style={surface}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <CadenceMark size={40} />
        </div>

        {(state.kind === "checking" || state.kind === "accepting") && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-subtle)" }} />
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {state.kind === "checking" ? "Checking your invitation" : "Joining the workspace"}
            </p>
          </div>
        )}

        {state.kind === "needs-login" && (
          <div>
            <h1
              className="font-display"
              style={{ fontSize: 20, color: "var(--text-primary)", marginBottom: 8 }}
            >
              You have a workspace invitation
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 18,
                lineHeight: 1.55,
              }}
            >
              Log in or sign up with the email it was sent to. You will land right back here to
              join.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Link
                to="/login"
                search={{ next: `/join/${token}` }}
                className="btn btn-primary btn-sm"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                search={{ next: `/join/${token}` }}
                className="btn btn-ghost btn-sm"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}

        {state.kind === "done" && (
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "color-mix(in srgb, var(--moss) 16%, transparent)",
                color: "var(--moss)",
                marginBottom: 12,
              }}
            >
              <Check size={18} />
            </div>
            <h1
              className="font-display"
              style={{ fontSize: 20, color: "var(--text-primary)", marginBottom: 8 }}
            >
              You are in
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
              You have joined the workspace.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate({ to: "/" })}
            >
              Go to Cadence
            </button>
          </div>
        )}

        {state.kind === "error" && (
          <div>
            <h1
              className="font-display"
              style={{ fontSize: 20, color: "var(--text-primary)", marginBottom: 8 }}
            >
              This invitation could not be accepted
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 18,
                lineHeight: 1.55,
              }}
            >
              {state.message}
            </p>
            <Link to="/" className="btn btn-ghost btn-sm">
              Go to Cadence
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
