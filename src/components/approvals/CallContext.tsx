import type { ReactNode } from "react";

import { glyphForSlug } from "@/components/shell/agent-glyphs";

/*
 * THE CONTEXT COLUMN, drawn in Meridian.
 *
 * It describes the ONE call in focus and nothing else. That is the ruling this
 * surface was rebuilt on: the evidence, the cost and where a call came from
 * belong beside the question being asked, never repeated down twenty rows.
 *
 * ── THE GLYPH IS NEUTRAL HERE, AND THAT IS A CHANGE ─────────────────────
 * The shell's agent mark encodes the agent as a SHAPE and its loop stage as a
 * HUE, seven hues across the roster. That is a good system and it is the wrong
 * one on this surface: Meridian spends colour on one distinction only, what a
 * machine did against what a person must decide, and a stage rainbow beside a
 * gate competes with the single accent that says a person is required. The
 * shape still carries the identity, which is what it was drawn to do, and it
 * survives greyscale on its own.
 */

function Head({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium tracking-wide text-mrd-mute uppercase">{children}</h2>
  );
}

function Section({ children }: { children: ReactNode }) {
  return (
    <section className="pt-mrd-5 first:pt-0">
      {children}
    </section>
  );
}

export function CallContext({
  agentSlug,
  agentName,
  where,
  impact,
  keys,
}: {
  agentSlug: string | null | undefined;
  /** The agent's display name, resolved by the caller from the catalog. */
  agentName: string;
  /** The project or mission the call sits in, already resolved to a name. */
  where: string;
  /** What answering it costs or touches. Absent on families that carry none. */
  impact?: string | null;
  /** The keyboard, drawn by the file that binds it. */
  keys?: ReactNode;
}) {
  const Glyph = glyphForSlug(agentSlug);

  return (
    <div className="flex flex-col gap-mrd-5">
      <Section>
        <Head>Where this call came from</Head>
        <div className="mt-mrd-4 flex items-start gap-mrd-4">
          <span aria-hidden className="mt-0.5 shrink-0 text-mrd-mute [&>svg]:size-4">
            <Glyph />
          </span>
          <span className="min-w-0">
            <span className="block text-[12.5px] text-mrd-ink">{agentName}</span>
            <span className="mt-0.5 block text-[11px] text-mrd-mute">{where}</span>
          </span>
        </div>
      </Section>

      {impact ? (
        <Section>
          <Head>Before you decide</Head>
          <p className="mt-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-body">{impact}</p>
        </Section>
      ) : null}

      {keys ? (
        <Section>
          <Head>Moving through</Head>
          <p className="mt-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-body">{keys}</p>
        </Section>
      ) : null}
    </div>
  );
}

/** A key, as it is actually pressed. Mono so it reads as a keycap in a sentence. */
export function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="font-mrd-mono rounded-mrd-xs border border-mrd-line bg-mrd-lift px-1 text-[11px] text-mrd-ink">
      {children}
    </kbd>
  );
}

export default CallContext;
