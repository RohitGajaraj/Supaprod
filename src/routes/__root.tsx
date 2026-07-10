import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThemeProvider } from "@/hooks/use-theme";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { MachineViewProvider } from "@/hooks/use-machine-view";
import { CadenceMark } from "@/components/cadence/Primitives";

import appCss from "../styles.css?url";
import faviconAsset from "../assets/favicon.png.asset.json";

// Root boundaries. These render OUTSIDE the _authenticated tree, so they carry
// their own `data-obsidian` scope to read as the same calm dark, on-brand
// Cadence surface as the app (never a raw stack or a blank screen). A user
// always sees the brand mark and a clear way back.
function BoundaryShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-obsidian
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--canvas)",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <CadenceMark size={44} />
        </div>
        {children}
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <BoundaryShell>
      <div className="mono-label" style={{ marginBottom: 8 }}>
        404 · not found
      </div>
      <h1
        className="font-display"
        style={{ fontSize: 26, color: "var(--text-primary)", marginBottom: 8 }}
      >
        Page not found
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.55 }}>
        This page doesn't exist or has moved. Let's get you back on track.
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/" className="btn btn-primary btn-sm">
          Go home
        </a>
        <a href="/login" className="btn btn-ghost btn-sm">
          Sign in
        </a>
      </div>
    </BoundaryShell>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <BoundaryShell>
      <div className="mono-label" style={{ marginBottom: 8 }}>
        something broke
      </div>
      <h1
        className="font-display"
        style={{ fontSize: 26, color: "var(--text-primary)", marginBottom: 8 }}
      >
        This page didn't load
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.55 }}>
        Something went wrong on our end. Try again, or head back home.
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="btn btn-primary btn-sm"
        >
          Try again
        </button>
        <a href="/" className="btn btn-ghost btn-sm">
          Go home
        </a>
      </div>
    </BoundaryShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cadence" },
      {
        name: "description",
        content: "The decision and outcome operating system for product teams.",
      },
      { name: "author", content: "Cadence" },
      { property: "og:title", content: "Cadence" },
      {
        property: "og:description",
        content: "The decision and outcome operating system for product teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cadence" },
      {
        name: "twitter:description",
        content: "The decision and outcome operating system for product teams.",
      },
      // Branded social image (public/og-cadence.png). Absolute URL required by
      // crawlers; swap the host when the custom domain lands (founder note).
      { property: "og:image", content: "https://cadence-flow-beta.lovable.app/og-cadence.png" },
      { name: "twitter:image", content: "https://cadence-flow-beta.lovable.app/og-cadence.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // Branded favicon — the Butterfly mark on the parchment tile, with the
      // sanctioned subtle wing flutter where SVG favicons animate (Firefox);
      // SVG-capable browsers prefer it, the PNG stays as the fallback and
      // the apple-touch-icon (iOS takes no SVG).
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: faviconAsset.url },
      { rel: "apple-touch-icon", href: faviconAsset.url },
      // Agent discovery breadcrumbs: an agent that fetches any page cold (no
      // prior knowledge of Cadence's specific llms.txt/agents.txt convention)
      // finds the machine-readable interfaces from the HTML <head> itself,
      // without needing to guess well-known paths. See docs/features/agent-native-layer.md.
      { rel: "llms.txt", href: "/llms.txt" },
      { rel: "agents.txt", href: "/agents.txt" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        // Ember Editorial type stack — Newsreader (display serif, optical
        // sizing), Schibsted Grotesk (UI), JetBrains Mono (metadata).
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..900&display=swap",
      },
      {
        // Obsidian v3 special inks (OBS-01): Codystar (aurora numerals
        // ONLY) + Caveat (pencil annotations ONLY). The three shared
        // families load above; self-host later per implementation-notes.
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Codystar:wght@300;400&family=Caveat:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <ThemeBootstrapScript />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemeBootstrapScript() {
  // Pre-hydration theme bootstrap: avoid FOUC. Default is light; legacy
  // stored "aurora" resolves to dark.
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('cadence.theme');if(t==='dark'||t==='aurora'){document.documentElement.classList.add('dark');}}catch(e){/* default light */}})();`,
      }}
    />
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Only react to actual sign-in / sign-out. TOKEN_REFRESHED, USER_UPDATED
      // and INITIAL_SESSION fire repeatedly and would cause refresh loops.
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      queueMicrotask(() => {
        if (event === "SIGNED_OUT") {
          // Drop cached protected queries instead of refetching them —
          // refetching would fire server fns without a bearer token and 401.
          queryClient.cancelQueries();
          queryClient.clear();
        } else {
          void queryClient.invalidateQueries();
        }
        void router.invalidate();
      });
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConfirmProvider>
          <MachineViewProvider>
            <Outlet />
            <Toaster position="top-right" richColors />
          </MachineViewProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
