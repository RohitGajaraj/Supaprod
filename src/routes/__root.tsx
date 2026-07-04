import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
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

import appCss from "../styles.css?url";
import faviconAsset from "../assets/favicon.png.asset.json";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
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
        {/* Pre-hydration theme bootstrap — avoid FOUC. Default = light
            (parchment). Legacy stored 'aurora' resolves to dark (char). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cadence.theme');if(t==='dark'||t==='aurora'){document.documentElement.classList.add('dark');}}catch(e){/* default light */}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
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
