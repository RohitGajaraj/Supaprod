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
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";

import appCss from "../styles.css?url";

// Root boundaries. These render OUTSIDE the _authenticated tree, so they carry
// their own `data-obsidian` scope to read as the same calm dark, on-brand
// Supaprod surface as the app (never a raw stack or a blank screen). A user
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
          <SupaprodMark size={44} />
        </div>
        {children}
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <BoundaryShell>
      {/* The 404 numeral is the page's single Geist Pixel brand moment
          (DESIGN-TEMPO.md sections 3 and 8: big numerals qualify, max one
          Pixel element per screen). --text-score is the 52px display scale. */}
      <div
        style={{
          fontFamily: "var(--font-pixel)",
          fontSize: "var(--text-score, 52px)",
          lineHeight: 1,
          color: "var(--ds-gray-1000)",
          marginBottom: 12,
        }}
      >
        404
      </div>
      <h1 className="text-heading-24" style={{ color: "var(--text-primary)", marginBottom: 8 }}>
        Page not found
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.55 }}>
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
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.55 }}>
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
      { title: "Supaprod" },
      {
        name: "description",
        content: "The decision and outcome operating system for product teams.",
      },
      { name: "author", content: "Supaprod" },
      { property: "og:title", content: "Supaprod" },
      {
        property: "og:description",
        content: "The decision and outcome operating system for product teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Supaprod" },
      {
        name: "twitter:description",
        content: "The decision and outcome operating system for product teams.",
      },
      // Branded social image (public/og-supaprod.png). Absolute URL required by crawlers.
      { property: "og:image", content: "https://supaprod.ai/og-supaprod.png" },
      { name: "twitter:image", content: "https://supaprod.ai/og-supaprod.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // Branded favicon — the Supaprod mark (seven-petal spiral + ember/gold
      // core), transparent with NO box, theme-aware: the SVG switches black
      // (light tabs) / silver (dark tabs) via prefers-color-scheme so it is
      // always visible. The transparent PNG + .ico are legacy fallbacks; the
      // apple-touch icon is the same mark (iOS takes no SVG).
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon.png" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      // Agent discovery breadcrumbs: an agent that fetches any page cold (no
      // prior knowledge of Supaprod's specific llms.txt/agents.txt convention)
      // finds the machine-readable interfaces from the HTML <head> itself,
      // without needing to guess well-known paths. See docs/features/agent-native-layer.md.
      { rel: "llms.txt", href: "/llms.txt" },
      { rel: "agents.txt", href: "/agents.txt" },
      // Tempo v5 type stack (DESIGN-TEMPO.md §3): Geist Sans/Mono variable +
      // Geist Pixel, self-hosted from /public/fonts/geist (SIL OFL 1.1).
      // @font-face lives in src/styles.css; no external font hosts.
      {
        rel: "preload",
        href: "/fonts/geist/Geist-Variable.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/geist/GeistMono-Variable.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
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
    // className="dark" makes SSR, no-JS, and pre-hydration states dark-first
    // (Tempo v5 theme law); the bootstrap script below flips to light only
    // when the user explicitly stored that preference.
    <html lang="en" className="dark" suppressHydrationWarning>
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
  // Pre-hydration theme bootstrap: avoid FOUC. Tempo v5 contract: dark is the
  // default (class 'dark', no data-theme); light = data-theme='light' plus the
  // 'dark' class removed. Legacy stored "aurora" resolves to dark.
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('supaprod.theme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark');d.setAttribute('data-theme','light');}else{d.classList.add('dark');d.removeAttribute('data-theme');}}catch(e){/* default dark via the SSR class */}})();`,
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
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </MachineViewProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
