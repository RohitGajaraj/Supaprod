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
      { title: "Supaprod" },
      {
        name: "description",
        content: "Supaprod is where product decisions live when agents do the work.",
      },
      { name: "author", content: "Supaprod" },
      { property: "og:title", content: "Supaprod" },
      {
        property: "og:description",
        content: "Supaprod is where product decisions live when agents do the work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Supaprod" },
      {
        name: "twitter:description",
        content: "Supaprod is where product decisions live when agents do the work.",
      },
      // Branded social image (public/og-supaprod.png). Absolute URL required by crawlers.
      { property: "og:image", content: "https://supaprod.ai/og-supaprod.png" },
      { name: "twitter:image", content: "https://supaprod.ai/og-supaprod.png" },
      // Paints the mobile browser's own chrome (the strip above the page on
      // Android Chrome, and the status bar area on iOS Safari) to the app
      // ground, so the surface does not end in a white band above a black page.
      // One value, not a light/dark pair, because <html> ships class="dark"
      // unconditionally: this site has one ground and it is #0A0A0A.
      { name: "theme-color", content: "#0A0A0A" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // Branded favicon: the Supaprod mark, a WHITE seven-petal spiral with an
      // ember core and a gold bead. There is no second brand colour; if you are
      // looking at blue or violet you are looking at a pre-2026-08-05 artifact,
      // see the retired-"grad" note in docs/growth/branding/generate-social.ts.
      //
      // EVERY ICON HERE CARRIES ITS OWN DARK GROUND. That is a 2026-08-07
      // reversal and it is worth understanding before anyone reverts it.
      //
      // What shipped before was the ADAPTIVE mark: transparent, no box, with
      // `@media (prefers-color-scheme)` inside the SVG swapping the stroke to
      // #111111 on light and #FFFFFF on dark. It is a clever file and it failed
      // in the tab, for two independent reasons the founder hit at once:
      //
      //   1. SUB-PIXEL. faviconMark strokes 4.6 units on a 100 viewBox. At a 16px
      //      tab that is 0.74px, which antialiases to nothing, while the r=7 core
      //      survives at 2.2px. The mark did not render faintly; it rendered as a
      //      lone orange dot. The kit's own README predicted this ("seven petals
      //      plus seven gaps plus a core do not fit") and shipped a tuned
      //      favicon-16.png, which nothing referenced. It is referenced now.
      //
      //   2. prefers-color-scheme CANNOT SEE THE TAB. It reports the OS theme. A
      //      Chrome profile tint, a custom theme, or a light strip under a dark
      //      OS all defeat it, and the founder's strip is profile-green. No media
      //      query can read that, so adaptivity was solving for a signal that is
      //      not the background the icon actually sits on.
      //
      // A grounded icon is correct against every one of those cases without
      // needing to know which it is in. Vercel, Linear and Raycast all ship a
      // solid ground for the same reason. favicon-adaptive.svg is kept beside it
      // as the revert path, unreferenced.
      //
      // iOS takes no SVG, so apple-touch-icon is the grounded PNG by necessity,
      // downscaled from the 1024 master rather than rendered small.
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon.png" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      // Agent discovery breadcrumbs: an agent that fetches any page cold (no
      // prior knowledge of Supaprod's specific llms.txt/agents.txt convention)
      // finds the machine-readable interfaces from the HTML <head> itself,
      // without needing to guess well-known paths. See docs/features/agent-native-layer.md.
      { rel: "llms.txt", href: "/llms.txt" },
      { rel: "agents.txt", href: "/agents.txt" },
      /**
       * PRELOAD WHAT THE PRODUCT ACTUALLY RENDERS IN.
       *
       * These two entries preloaded Geist Sans and Geist Mono, citing the Tempo
       * v5 type stack. Tempo v5 is the RETIRED design system; the built one is
       * src/styles/ink.css, whose `--sp-font-sans` is Mona Sans and whose
       * `--sp-font-mono` is IBM Plex Mono. So every page load spent two
       * critical-path fetches on files the app shell does not render in.
       *
       * MEASURED IN A BROWSER ON /decide, not inferred: `document.fonts`
       * reported `Geist Mono: unloaded` after the app had finished painting,
       * while it was being preloaded on every navigation. A preloaded font that
       * never loads is a fetch bought and thrown away.
       *
       * WHAT THIS DOES NOT FIX, recorded so nobody chases it twice. Chrome also
       * logs "preloaded using link preload but not used within a few seconds"
       * for these fonts, and that warning is NOT evidence of waste here:
       * `performance.getEntriesByType("resource")` shows exactly ONE request per
       * font, initiated by the link. The warning is a load-event heuristic that
       * a client-rendered SPA with `font-display: swap` trips routinely, because
       * the face is applied after the window it watches. It survives this change
       * and is expected to.
       *
       * Mona Sans 400 and IBM Plex Mono Regular are the two faces the shell
       * paints first: body text and the machine voice. The other weights are
       * left to load normally, because preloading a whole family is how a
       * preload budget stops meaning anything. Geist is NOT dropped from the
       * sheet: it is still declared in styles.css and used by public surfaces,
       * and Geist Pixel remains the brand face. It simply is not what the
       * authenticated product renders in, so it is not what gets preloaded.
       *
       * ===================================================================
       * REVISED 2026-08-07. THE REASONING ABOVE IS SOUND AND WAS SCOPED TO
       * THE WRONG HALF OF THE SITE.
       *
       * Everything above was measured on /decide, an AUTHENTICATED route, and
       * it is correct there. This root is shared by marketing and authenticated
       * routes alike, so one preload list cannot serve both, and the list was
       * tuned for the half that launch traffic never sees.
       *
       * Measured on the public routes:
       *
       *   `.sp-*` classes, the ONLY consumers of --sp-font-sans (Mona Sans) and
       *   --sp-font-mono (IBM Plex Mono), appear ZERO times in
       *   src/components/landing/. So 35,648 bytes were preloaded on every
       *   marketing pageview and never used.
       *
       *   Meanwhile Geist Pixel Square paints the H1 on `/` (Hero.tsx), the
       *   largest text block on a page with no raster images, which makes it
       *   the likely LCP element. It was NOT preloaded, so it was discovered
       *   only after a 46,638-byte stylesheet downloaded and parsed, competing
       *   with 33 modulepreloaded JS chunks.
       *
       *   Geist Sans is the Tailwind preflight default, so it paints ordinary
       *   body copy on every public page.
       *
       *   styles.css:14 explicitly bans IBM Plex Mono as belonging to "the
       *   retired Ember Editorial system", which the block above independently
       *   arrived at from the other direction.
       *
       * WHY MARKETING WINS THE PRELOAD BUDGET rather than splitting it. A
       * marketing visitor is cold: first request, empty cache, and the one
       * chance the company gets at a first impression. An authenticated user
       * has the shell fonts cached from their first session and is a repeat
       * visitor by definition. Spending the critical path on the cold case is
       * the right trade, and preloading all four faces would spend it on
       * neither.
       *
       * The authenticated shell still gets its fonts, just discovered normally
       * rather than preloaded. Nothing is dropped from the sheet.
       * ===================================================================
       */
      {
        rel: "preload",
        href: "/fonts/geist/GeistPixel-Square.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/geist/Geist-Variable.woff2",
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
  // Pre-hydration theme bootstrap: avoid FOUC. Contract: dark = class 'dark'
  // with NO data-theme (:root already holds the dark tokens); light =
  // data-theme='light' with the 'dark' class removed. Legacy stored "aurora"
  // and an absent value both resolve to dark.
  //
  // THIS MUST MIRROR `resolveTheme` IN use-theme.tsx EXACTLY, INCLUDING 'system'.
  // It did not, and that was a real defect rather than a nicety: the stored
  // value is one of three ("dark" | "light" | "system", use-theme.tsx:3) and the
  // toggle cycles through all three (CYCLE, use-theme.tsx:65), but this script
  // branched only on 'light'. So a user in SYSTEM mode on a light-preferring OS
  // was painted dark here, then ThemeProvider's mount effect resolved
  // system -> light and flipped the document: a dark-to-light flash on every
  // single page load, in the one mode that cannot express itself as a stored
  // literal. Reading the media query here is what makes "system" a real theme
  // at first paint rather than a preference that only applies after hydration.
  //
  // The media query is read ONLY when the stored value is 'system'. An absent
  // value still resolves to dark, deliberately: "dark is the default
  // experience" is a product decision (DEFAULT_THEME, use-theme.tsx:8), and
  // quietly following the OS for brand-new users would change it here rather
  // than where it belongs.
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('supaprod.theme');var d=document.documentElement;var light=t==='light'||(t==='system'&&typeof window.matchMedia==='function'&&window.matchMedia('(prefers-color-scheme: light)').matches);if(light){d.classList.remove('dark');d.setAttribute('data-theme','light');}else{d.classList.add('dark');d.removeAttribute('data-theme');}}catch(e){/* default dark via the SSR class */}})();`,
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
