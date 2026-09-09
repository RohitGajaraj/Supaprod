/**
 * ── THE PRODUCT COMPOSES ITSELF, INSTEAD OF A SPINNER ON A BLACK FIELD ─────
 *
 * REPORTED BY LANE 2, 2026-09-09, and I could not reproduce it: navigating to
 * a trace URL cold gave a mark centred on pure black for about three seconds,
 * with no rail, no header and no title. My own loads painted at 288ms. Both
 * readings were honest and mine was the useless one, because 122 of the 123
 * scripts were already in my cache.
 *
 * MEASURED ON THE SERVED BUILD, deployment 7ba7499d:
 *
 *   123 script files, 470 KB
 *   ALL 123 load before first contentful paint. Zero after.
 *   The server's HTML for an authenticated URL is 35 KB and contains no rail,
 *   no nav and no title -- nothing matching the page at all.
 *
 * `_authenticated` is `ssr: false` and its `beforeLoad` resolves the session
 * before `component` mounts, so the chrome cannot paint until the whole bundle
 * has arrived AND auth has answered. Everything Lane 2 saw follows from those
 * two facts, and neither is visible from a warm machine.
 *
 * ── WHY A FRAME AND NOT A BETTER SPINNER ──────────────────────────────────
 * The founder's rule is "never a spinner over a black box", and the brief asks
 * for real change rather than another pass of polish. A nicer mark centred in
 * the same void is polish. What removes the void is the product's own frame:
 * the rail's column, the header's bar, the work region's ground, and the mark
 * in the exact position it will occupy for the rest of the session.
 *
 * `_authenticated.tsx` already argues this for internal navigation -- *"the
 * authenticated tree keeps its shell and waits inside the work region"* -- and
 * cold boot was the one case that could not have it, because the shell had not
 * mounted yet. This is what makes it able to.
 *
 * THE MARK DOES NOT MOVE. It is drawn here at the same 21px, at the same
 * offset, as `AppFrame` draws it. So hydration is the rest of the product
 * arriving around a mark that was already in place, rather than a screen being
 * replaced by a different screen. That is the whole effect, and it is why the
 * geometry below is measured from the live shell rather than approximated.
 *
 * ── WHY THE REAL MARK AND NOT A CIRCLE ────────────────────────────────────
 * `SupaprodMark` is rendered, not imitated. The founder's ruling on the
 * wordmark was explicit -- *"it needs to be the real one, not just a mockup"*
 * -- and this repo has paid for approximating its own assets before. It costs
 * a few KB of path data that gzip reduces to very little, and it means the
 * boot frame cannot drift from the brand.
 *
 * ── WHY LITERALS BESIDE THE TOKENS, WHICH LOOKS LIKE DUPLICATION ──────────
 * The stylesheet is render-blocking too. If this skeleton's colours lived only
 * in `meridian.css` it would paint unstyled for exactly the window it exists to
 * fill. So every colour is `var(--token, <literal>)`: the token wins the moment
 * the sheet lands, and the literal covers the window before it.
 *
 * That is a second copy of a value, which this repo is right to distrust. It is
 * made safe by derivation rather than by discipline:
 * `the-boot-frame-cannot-drift.test.ts` reads `meridian.css` and fails if any
 * fallback here stops matching the token it stands in for. A duplicate with a
 * guard is a cache; a duplicate without one is a bug waiting for a redesign.
 */
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";

/**
 * The literals, and the tokens they stand in for until the sheet lands.
 *
 * Exported so the guard can check each pair against `meridian.css` rather than
 * trusting that somebody updated both. See that test for the failure it is
 * written to catch.
 */
export const BOOT_TOKENS = {
  /** `--mrd-sheet`: chrome, the header and rail ground. */
  sheet: { token: "--mrd-sheet", value: "oklch(0.175 0.006 70)" },
  /** `--mrd-bg`: the canvas the work region sits on. */
  bg: { token: "--mrd-bg", value: "oklch(0.145 0.006 70)" },
  /** `--mrd-line`: a real edge, under the header and beside the rail. */
  line: { token: "--mrd-line", value: "oklch(0.98 0.003 70 / 0.11)" },
  /** `--mrd-shell-header-h`: one row of controls and a mark, with air. */
  headerH: { token: "--mrd-shell-header-h", value: "56px" },
  /** `--shell-rail-w`: the rail, named and wide by default. */
  railW: { token: "--shell-rail-w", value: "clamp(212px, 15.5vw, 268px)" },
  /** `--shell-rail-narrow`: the rail a person chose to collapse. */
  railNarrow: { token: "--shell-rail-narrow", value: "64px" },
} as const;

const v = (k: keyof typeof BOOT_TOKENS) => `var(${BOOT_TOKENS[k].token}, ${BOOT_TOKENS[k].value})`;

/**
 * `localStorage` keys this reads, both of them already owned elsewhere.
 *
 * `RAIL_KEY` is `AppFrame`'s (`supaprod:rail-narrow`, "1" means collapsed, and
 * absent means wide since the auto-collapse was retired). Reading it here is
 * what stops the rail changing width under the person a beat after it appears,
 * which would be worse than not drawing it: a shell that resizes itself on
 * arrival is the opposite of composed.
 */
export const BOOT_RAIL_KEY = "supaprod:rail-narrow";

/**
 * Paths that do NOT get the app frame, because they do not get the app shell.
 *
 * The marketing site is parchment and has its own composition; flashing a dark
 * rail in front of it would be a new defect rather than a fix. This list is
 * checked against `src/routes/` by the guard, so a public route added later
 * fails the suite here instead of surprising somebody on the landing page.
 */
export const BOOT_PUBLIC_PREFIXES = [
  /*
   * EVERY DOT-PREFIXED PATH, AS ONE RULE RATHER THAN THREE ENTRIES. The guard
   * found `/.lovable/oauth/consent` on its first run and the same shape covers
   * `/.mcp/*` and `/.well-known/*`. These are protocol and machine surfaces --
   * a leading dot is the convention that says so -- and none of them is ever a
   * screen a person navigates the app to. Stated as the rule so the next one
   * added is covered before anybody notices it was not.
   */
  "/.",
  "/ard",
  "/api",
  "/brief",
  "/checkout",
  "/d/",
  "/demo",
  "/faq",
  "/film",
  "/forgot-password",
  "/health",
  "/investors",
  "/join/",
  "/login",
  "/mcp",
  "/p/",
  "/pricing",
  "/privacy",
  "/product",
  "/proof",
  "/reset-password",
  "/security",
  "/signup",
  "/subprocessors",
  "/t/",
  "/terms",
  "/trust",
  "/updates",
] as const;

/** The element the script toggles and `AuthedLayout` removes. */
export const BOOT_SHELL_ID = "boot-frame";

/*
 * ── ON THE TWO `dangerouslySetInnerHTML` USES BELOW ───────────────────────
 *
 * Neither one interpolates anything a request, a person or the database can
 * reach. The script's only variable is `JSON.stringify` of a `const` array of
 * string literals declared in this file, and the style's only variables are
 * the token names and literals in `BOOT_TOKENS` above -- all compile-time
 * constants, all authored here. Nothing crosses the boundary.
 *
 * It is the same mechanism, for the same reason, as `ThemeBootstrapScript` in
 * `__root.tsx`: work that must happen before hydration cannot be a React
 * effect, because React is precisely what has not arrived yet.
 *
 * The rule this stays inside: if either of these ever needs a value that came
 * from outside this module, it stops being safe by construction and the check
 * has to become a real one. Today it is safe by construction, and that is
 * worth stating rather than leaving a reader to re-derive it.
 */

/**
 * ── WHY A SESSION CHECK AND NOT A ROUTE MATCH ─────────────────────────────
 *
 * This has to decide before any framework code exists, so it cannot ask the
 * router anything. The honest question at that moment is not "is this an app
 * route" but "is this person going to land in the app", and a stored Supabase
 * session answers it synchronously, the same way the theme bootstrap already
 * reads a stored preference to avoid a flash.
 *
 * BOTH CONDITIONS, because either alone is wrong. A signed-out visitor deep
 * linking to `/outcomes` will be redirected to sign in and must not see a dark
 * app frame first. A signed-in visitor reading `/pricing` is on the marketing
 * page and must not either.
 *
 * IT FAILS CLOSED. Every branch is inside a try, and anything unexpected --
 * storage disabled, a renamed key, a parse failure -- leaves the frame hidden
 * and the product exactly as it is today. The worst case is the status quo,
 * never a wrong frame over the wrong page.
 *
 * ── THE ONE CASE IT GETS WRONG, NAMED SO NOBODY REDISCOVERS IT ────────────
 * It asks whether a session token EXISTS, not whether it is still valid. A
 * reader whose token has expired sees the frame, then `beforeLoad` redirects
 * them to sign in. So the frame is briefly right about where they were going
 * and wrong about where they land.
 *
 * Left deliberately. Reading `expires_at` means parsing Supabase's stored
 * token shape in the critical path, which couples this to an internal format
 * that can change -- and when it changed the frame would silently stop
 * appearing for everyone, trading a rare mild flash for a permanent invisible
 * regression. The flash costs an expired session one frame; the coupling
 * would cost every cold arrival, quietly. If Supabase ever exposes validity
 * as a plain stored value, this is the line that changes.
 */
export function bootFrameScript(): string {
  const publics = JSON.stringify(BOOT_PUBLIC_PREFIXES);
  return `(function(){try{
var p=location.pathname;
if(p==='/')return;
var pub=${publics};
for(var i=0;i<pub.length;i++){if(p===pub[i]||p.indexOf(pub[i])===0)return;}
var signedIn=false;
for(var j=0;j<localStorage.length;j++){var k=localStorage.key(j);if(k&&k.indexOf('sb-')===0&&k.indexOf('-auth-token')>0){signedIn=true;break;}}
if(!signedIn)return;
var el=document.getElementById('${BOOT_SHELL_ID}');
if(!el)return;
if(localStorage.getItem('${BOOT_RAIL_KEY}')==='1')el.setAttribute('data-rail','narrow');
el.removeAttribute('hidden');
}catch(e){}})();`;
}

/**
 * The frame, as the server sends it.
 *
 * `hidden` by default and revealed by the script above, so a page that should
 * never wear it never does, even for the instant before the script runs.
 *
 * `aria-hidden` and no live region: this is scenery. The router's own
 * `BrandWait` still owns what a screen reader is told about the wait, and two
 * things announcing one wait is the defect this repo keeps repairing.
 */
export function BootFrame() {
  return (
    <div
      id={BOOT_SHELL_ID}
      hidden
      aria-hidden="true"
      /*
       * ── THE SCRIPT EDITS THIS ELEMENT BEFORE REACT EVER SEES IT ──────────
       *
       * By hydration the DOM legitimately differs from this markup: `hidden`
       * is gone and `data-rail` may be set, both written by the inline script
       * a second earlier. That is the design, not a bug, and without this
       * React would either warn on every cold arrival or patch the attributes
       * back and re-hide the frame it is standing behind.
       *
       * `<body>` above carries the same attribute for the same reason and it
       * does NOT inherit -- `suppressHydrationWarning` applies to one element,
       * so the one whose attributes actually change has to say so itself.
       */
      suppressHydrationWarning
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        background: v("bg"),
        /*
         * NO TRANSITION AND NO SHIMMER, and both are the same argument. A
         * skeleton that pulses is a surface asking to be looked at while it has
         * nothing to say, and the bar here is calm. This appears once, holds
         * still, and is gone.
         */
      }}
    >
      {/* The header. Its ground, its hairline, and the mark where it lives. */}
      <div
        style={{
          height: v("headerH"),
          flex: "none",
          background: v("sheet"),
          borderBottom: `1px solid ${v("line")}`,
          display: "flex",
          alignItems: "center",
          /* 18px from the edge, measured off the live header: the mark's own
             box starts at x=18, y=17 in a 56px row. */
          paddingLeft: 18,
        }}
      >
        <SupaprodMark size={21} glow={false} />
      </div>

      {/* The rail's column beside the work region's ground. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div
          data-boot-rail=""
          style={{
            width: v("railW"),
            flex: "none",
            background: v("sheet"),
            borderRight: `1px solid ${v("line")}`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0, background: v("bg") }} />
      </div>

      {/* The collapsed rail, when this person chose one. A style element
          rather than a second React branch, because the script that knows the
          answer runs long before React does. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `#${BOOT_SHELL_ID}[data-rail="narrow"] [data-boot-rail]{width:${v("railNarrow")};}`,
        }}
      />
    </div>
  );
}
