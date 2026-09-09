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
    <h2 className="text-mrd-tiny font-medium tracking-wide text-mrd-mute uppercase">{children}</h2>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <section className="pt-mrd-5 first:pt-0">{children}</section>;
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
  /**
   * The project or run the call sits in, already resolved to a name — or null
   * when it sits in neither, which is an ordinary case rather than a hole.
   *
   * ── NULLABLE BECAUSE THE ALTERNATIVE WAS AN INVENTION (Lane 2, 2026-09-09) ─
   * This was `string`, so the one caller had to supply something, and it
   * supplied `subjectOf(focused) ?? "This workspace"`. `subjectOf` is four
   * hundred lines above that call site in the same file, and its docstring
   * forbids exactly the sentence the call site wrote:
   *
   *   *"Null on the families that are workspace wide (memory, house rules,
   *    trust, assumption challenges, playbooks), and null is drawn as nothing
   *    rather than as 'Workspace', because inventing a container for a call
   *    that has none says something the read never said."*
   *
   * Measured on production: 17 of Helio Labs' 57 pending design gates carry no
   * project, and every one of them was being told it came from "This
   * workspace" — a container the read never mentioned, under a heading that
   * promises to say where the call came from.
   *
   * A REQUIRED PROP IS WHY IT HAPPENED. The type asked for a string and the
   * caller had a null, so the fallback was written at the call site where no
   * reviewer would meet the rule it broke. Making the prop nullable moves the
   * decision here, next to the rendering that acts on it.
   */
  where: string | null;
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
            <span className="block text-mrd-label text-mrd-ink">{agentName}</span>
            {/* Nothing at all when the call sits in no project and no run.
                The agent's name above is a complete answer on its own; a second
                line naming a container that does not exist is worse than one
                line, not better. */}
            {where ? (
              <span className="mt-0.5 block text-mrd-tiny text-mrd-mute">{where}</span>
            ) : null}
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
    <kbd className="font-mrd-mono rounded-mrd-xs border border-mrd-line bg-mrd-lift px-1 text-mrd-tiny text-mrd-ink">
      {children}
    </kbd>
  );
}

export default CallContext;
