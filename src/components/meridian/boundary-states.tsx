import * as React from "react";

import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { Action, Actions, Figure, NothingHere, ReadFailed } from "./surface-parts";

/*
 * THE FOUR SURFACES EVERY ROUTE IN THE PRODUCT FALLS THROUGH TO.
 *
 * ── WHY THEY LIVE HERE AND NOT IN THE TWO ROUTE FILES ───────────────────
 * They were four module-local functions inside `src/routes/_authenticated.tsx`
 * and `src/routes/__root.tsx`, passed straight to `errorComponent:` and
 * `notFoundComponent:`. Being route OPTIONS rather than `return` statements in a
 * component body is why every early-return sweep of 2026-08 walked past them:
 * the shape they were looking for was not the shape these are in. They carried
 * 27 occurrences of three retired vocabularies between them, and NEITHER FILE
 * CARRIED `data-mrd` ANYWHERE, so every control on them took the legacy
 * app-wide ring instead of Meridian's.
 *
 * Two reasons they are one module rather than two sets of local functions:
 *
 *   1. NOTHING COULD RENDER THEM. A route option that is not exported cannot be
 *      mounted by a test, so the four highest-traffic states in the product had
 *      no assertion of any kind on them. Importing them from a route file
 *      instead would drag `?url` stylesheet imports, the Supabase client and
 *      four providers into every test that wanted to look at a 404.
 *   2. THE TWO PAIRS DRIFTED APART ONCE ALREADY. The authenticated pair said
 *      "This part of Supaprod hit an error" and the root pair said "This page
 *      didn't load" about the same class of failure, with different type
 *      scales, different grounds and different controls. Sitting in one file is
 *      what makes the next divergence visible in a diff.
 *
 * ── THE STATES STAY APART, WHICH IS THE WHOLE STANDARD ──────────────────
 * `DESIGN-SYSTEM.md` section 2: "Empty, partial, failed, denied, very long,
 * very short, slow -- each one COMPOSED, not merely handled." A failed read and
 * a missing route send a person in opposite directions, so a failed read is
 * `ReadFailed` and a missing route is `NothingHere`, here as everywhere. They
 * are never one component with a flag, and the copy never lets one wear the
 * other's clothes.
 *
 * (This replaces the citation the root boundary carried, which named the
 * archived v5 Tempo contract as its authority.)
 *
 * ── THE LITERAL HEX FALLBACKS ARE GONE, DELIBERATELY ────────────────────
 * The code this replaces wrote `var(--text-body, #C6C0B8)` on every line, for a
 * stated reason: these render on public routes and "before token layers load".
 * The fallbacks are not carried over, and the reason is that they never did the
 * job they were there for.
 *
 * `--canvas`, `--text-body` and `--text-muted` are all declared in
 * `src/styles.css` and nowhere else. So the only state in which a fallback
 * fires is the state in which that sheet has not resolved -- and in that state
 * `background: var(--canvas)` is invalid too, which drops the ground to the
 * user agent's white. `#C6C0B8` on white measures 1.7:1. The dark-safe fallback
 * was safe only while the sheet WAS loaded, which is exactly when it was never
 * needed.
 *
 * What actually prevents the flash is upstream and already true: the sheet is a
 * render-blocking `<link rel="stylesheet">` in the root `head()`, so a browser
 * does not paint this content before it resolves. In the one case where it does
 * not resolve, this composition sets no colour at all and falls to the user
 * agent's own black on white, which is legible. That is a better failure than
 * the one it replaces, and `--mrd-*` tokens are declared on `:root` rather than
 * under a scope attribute, so they need nothing mounted to resolve.
 */

/** The message the error actually carried, or a sentence saying it carried none. */
function messageOf(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  return "The error arrived with no message of its own.";
}

/** The raw cause, in the data face, wrapping rather than widening its column.
 *  A machine string is the one thing on these screens a person copies out. */
function Cause({ children }: { children: React.ReactNode }) {
  return <span className="font-mrd-mono text-mrd-tiny text-mrd-mute break-words">{children}</span>;
}

/**
 * The frame for the two surfaces inside the authenticated tree.
 *
 * It keeps the ground the deleted `fallbackWrap` set, because these are not
 * always drawn inside the shell: a not-found bubbles up and renders in the
 * work region with the rail still around it, but an error in this route's own
 * `beforeLoad` replaces the layout entirely and there is no chrome left to
 * supply a ground.
 */
function ShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-mrd=""
      className="flex min-h-[50vh] flex-col items-center justify-center bg-mrd-bg px-mrd-6 py-mrd-8"
    >
      <div className="w-full max-w-[64ch]">{children}</div>
    </div>
  );
}

/**
 * The frame for the two surfaces above the authenticated tree, which are whole
 * pages on their own and are the only thing a person can see.
 *
 * The brand mark is kept from the deleted `BoundaryShell`, and it is the one
 * decorative element on either screen: a person who has hit a wall should be
 * able to tell at a glance that they are still in the right product. It is
 * theme-invariant by founder ruling, so it is correct in both grounds without
 * asking anything of the tokens.
 */
function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-mrd=""
      className="flex min-h-dvh flex-col items-center justify-center bg-mrd-bg px-mrd-6 py-mrd-8"
    >
      <div className="w-full max-w-[62ch]">
        <div className="mb-mrd-5 flex justify-center">
          <SupaprodMark size={44} />
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * A READ FAILED INSIDE THE AUTHENTICATED TREE.
 *
 * `onRetry` is a full reload rather than a router retry, and the label says so.
 * That is the behaviour this surface already had and it is the honest one here:
 * what fails at this boundary is the layout's own session and onboarding gate,
 * so there is no narrower thing left to re-run.
 */
export function ShellReadFailed({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const retry = onRetry ?? (() => window.location.reload());
  return (
    <ShellFrame>
      <ReadFailed
        onRetry={retry}
        retryLabel="Reload the page"
        detail={
          <>
            Nothing was saved and nothing was lost, so there is nothing to undo. Reloading runs this
            screen again from the start. If it stops in the same place twice, this is the line to
            send us: <Cause>{messageOf(error)}</Cause>
          </>
        }
      >
        This screen stopped part way through loading.
      </ReadFailed>
    </ShellFrame>
  );
}

/**
 * NO SCREEN AT THIS ADDRESS, INSIDE THE AUTHENTICATED TREE.
 *
 * `NothingHere` and not `ReadFailed`: nothing failed. The address is simply not
 * one of ours, and telling a person their read broke would send them to reload
 * a URL that will never resolve.
 */
export function ShellRouteMissing({ onGoToToday }: { onGoToToday?: () => void }) {
  const go = onGoToToday ?? (() => window.location.assign("/today"));
  return (
    <ShellFrame>
      <NothingHere
        action={
          <Action variant="primary" onClick={go}>
            Back to Today
          </Action>
        }
      >
        There is no screen at this address. Either the link is out of date or the URL has a typo in
        it. Nothing you were working on is affected, so Today will pick you up where you left off.
      </NothingHere>
    </ShellFrame>
  );
}

/**
 * A READ FAILED ABOVE THE AUTHENTICATED TREE, so this is the whole page.
 *
 * `onRetry` is required and has no default, which is deliberate. The caller
 * has to hand over both halves of the retry -- the router's cache and the
 * boundary's own reset -- and a default here would let a caller supply one,
 * look identical, and never recover.
 */
export function PageReadFailed({
  error,
  onRetry,
  onGoHome,
}: {
  error: unknown;
  onRetry: () => void;
  onGoHome?: () => void;
}) {
  const home = onGoHome ?? (() => window.location.assign("/"));
  return (
    <PageFrame>
      <ReadFailed
        onRetry={onRetry}
        retryLabel="Try again"
        detail={
          <>
            The page stopped before it changed anything, so nothing was saved and nothing was lost.
            Trying again runs the same load once more. If it stops in the same place twice, this is
            the line to send us: <Cause>{messageOf(error)}</Cause>
          </>
        }
      >
        This page did not finish loading.
      </ReadFailed>
      <Actions className="mt-mrd-4">
        <Action variant="quiet" onClick={home}>
          Go home
        </Action>
      </Actions>
    </PageFrame>
  );
}

/**
 * NO PAGE AT THIS ADDRESS, above the authenticated tree.
 *
 * The numeral is kept, because the status code is the one fact a person can act
 * on when they are reporting a bad link, and it is the number that tells them
 * this is an address problem rather than an outage. It is drawn at Meridian's
 * top display stop in the data face, which is where every number in this system
 * goes; it was a 52px Geist Pixel brand moment cited from the archived Tempo
 * contract, and the face went with the citation.
 */
export function PageRouteMissing({
  onGoHome,
  onSignIn,
}: {
  onGoHome?: () => void;
  onSignIn?: () => void;
}) {
  const home = onGoHome ?? (() => window.location.assign("/"));
  const signIn = onSignIn ?? (() => window.location.assign("/login"));
  return (
    <PageFrame>
      <p className="text-mrd-display text-mrd-mute mb-mrd-3 text-center leading-none">
        <Figure>404</Figure>
      </p>
      <h1 className="text-mrd-h2 text-mrd-ink mb-mrd-5 text-center leading-mrd-tight font-medium">
        There is no page at this address
      </h1>
      <NothingHere
        action={
          <>
            <Action variant="primary" onClick={home}>
              Go home
            </Action>
            <Action onClick={signIn}>Sign in</Action>
          </>
        }
      >
        The address you followed does not match anything in Supaprod, so it has either moved or was
        mistyped. Nothing is broken and no work is affected.
      </NothingHere>
    </PageFrame>
  );
}
