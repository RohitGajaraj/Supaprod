import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { acceptInvitation } from "@/lib/workspaces.functions";
import { authErrorMessage } from "@/lib/auth-errors";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { ACTION_LINK_FACE, Action } from "@/components/meridian/surface-parts";
import { useObsidianAuthSurface } from "@/components/supaprod/AuthScaffold";

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
  head: () => ({ meta: [{ title: "Join a workspace · Supaprod" }] }),
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
  background: "var(--mrd-sheet)",
  color: "var(--mrd-ink)",
};

const card: CSSProperties = {
  background: "var(--mrd-lift)",
  border: "1px solid var(--mrd-edge)",
  borderRadius: "var(--radius-card, 12px)",
  boxShadow: "var(--mrd-shadow-float)",
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
          <SupaprodMark size={40} />
        </div>

        {(state.kind === "checking" || state.kind === "accepting") && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--mrd-mute)" }} />
            <p className="text-mrd-prose" style={{ color: "var(--mrd-mute)" }}>
              {state.kind === "checking" ? "Checking your invitation" : "Joining the workspace"}
            </p>
          </div>
        )}

        {state.kind === "needs-login" && (
          <div>
            <h1
              className="font-display text-mrd-h3"
              style={{ color: "var(--mrd-ink)", marginBottom: 8 }}
            >
              You have a workspace invitation
            </h1>
            <p
              className="text-mrd-base"
              style={{
                color: "var(--mrd-mute)",
                marginBottom: 18,
                lineHeight: "var(--mrd-lh-prose)",
              }}
            >
              Log in or sign up with the email it was sent to. You will land right back here to
              join.
            </p>
            {/* ⚠️ A WORKSPACE INVITATION IS NOT AN INVITE CODE, and after
                2026-08-07 that is a wall rather than a footnote.
                Signup went invite only that day. This token proves an existing
                member asked for you by name, which is exactly the cohort control
                the founder closed the door to get, but the gate on /signup
                cannot see it: it validates codes in invite_codes, and honouring
                a `next=/join/<token>` instead would be trusting a URL parameter
                anybody can type, which is a bypass and not a fix.
                Closing it properly means a server-side check of the token before
                the account is created, which is a founder call about who the
                beta admits and not a decision to make inside a copy change. Said
                here, in front of the person it affects, rather than left as a
                dead button they discover on the next screen. */}
            <p
              className="text-mrd-small"
              style={{
                color: "var(--mrd-mute)",
                marginBottom: 18,
                lineHeight: "var(--mrd-lh-prose)",
              }}
            >
              If you do not have a Supaprod account yet, you will need a beta invite code as well.
              Ask whoever sent you this link for one; your invitation waits here until you have it.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Link
                to="/login"
                search={{ next: `/join/${token}` }}
                className={ACTION_LINK_FACE.primary}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                search={{ next: `/join/${token}` }}
                className={ACTION_LINK_FACE.quiet}
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
                background: "color-mix(in srgb, var(--mrd-pass) 16%, transparent)",
                color: "var(--mrd-pass)",
                marginBottom: 12,
              }}
            >
              <Check size={16} />
            </div>
            <h1
              className="font-display text-mrd-h3"
              style={{ color: "var(--mrd-ink)", marginBottom: 8 }}
            >
              You are in
            </h1>
            <p className="text-mrd-base" style={{ color: "var(--mrd-mute)", marginBottom: 18 }}>
              You have joined the workspace.
            </p>
            <Action variant="primary" onClick={() => navigate({ to: "/" })}>
              Go to Supaprod
            </Action>
          </div>
        )}

        {state.kind === "error" && (
          <div>
            <h1
              className="font-display text-mrd-h3"
              style={{ color: "var(--mrd-ink)", marginBottom: 8 }}
            >
              This invitation could not be accepted
            </h1>
            <p
              className="text-mrd-base"
              style={{
                color: "var(--mrd-mute)",
                marginBottom: 18,
                lineHeight: "var(--mrd-lh-prose)",
              }}
            >
              {state.message}
            </p>
            <Link to="/" className={ACTION_LINK_FACE.quiet}>
              Go to Supaprod
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
