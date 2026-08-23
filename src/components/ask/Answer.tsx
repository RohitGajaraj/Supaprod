/**
 * THE BOUNDARY EVERY ASSISTANT MESSAGE CROSSES.
 *
 * Founder, 2026-07-30, looking at a real answer in the pane: *"it is showing in
 * form of hash and asterisk for headers and highlights. It looks so unformatted
 * and not touched. We should not display anything in form of hash and hashtags.
 * It needs to come out clean: what needs to be highlighted, what is the header.
 * See how PERMANENTLY we can solve this."*
 *
 * He was reading `### Workspace Status`, `**finalizing the integration**` and
 * `* **System Diagnostics:**` printed literally on screen, because the thread
 * rendered model output into a `white-space: pre-wrap` div. The model has always
 * been TOLD to use Markdown (api/chat.ts: "Use Markdown, tight bullets, no
 * fluff"), so this was never the model misbehaving. It was us asking for
 * Markdown and then refusing to read it.
 *
 * PERMANENTLY MEANS AT THE BOUNDARY, NOT AT THE CALL SITE. The fix is not "wrap
 * the one div that was wrong"; a second message type would arrive next month and
 * print hashes again. So there is exactly ONE component that turns an assistant's
 * words into pixels, `Answer`, and `AskTurn` has no other way to render
 * `content`. Anything that wants to show what the crew said comes through here
 * or it does not render at all. That is the permanence he asked for: not a fix
 * applied everywhere, but a place where the mistake cannot be made.
 *
 * RAW HTML IS OFF, AND STAYS OFF. No `rehype-raw`. Model output is untrusted
 * input from a system that reads this workspace's own records and, through
 * retrieval, text other people wrote. `react-markdown` escapes embedded HTML by
 * default and sanitises link protocols through its own `urlTransform`, so the
 * safe configuration is the one where we add nothing. If a future answer needs
 * an element Markdown cannot express, it arrives as a typed block through
 * `ask-blocks.ts`, which the server resolved, not as HTML the model wrote.
 *
 * ONE PROSE STYLE, NOT TWO. Everything below leans on `.sp-prose`, the existing
 * primitive, in its `markdown` form: same size, same leading, same ink. The only
 * difference is the container, because a tinted panel behind every answer is the
 * "two nested tinted containers per message" wallpaper AskTurn exists to remove,
 * and because the ONE recessed surface in this product is reserved for the
 * record. The element rules (headings, bold, lists, code) live in
 * primitives.css under `.sp-prose`, so the panel form and the bare form can
 * never drift into two typographies.
 */

import * as React from "react";
import Markdown from "react-markdown";
import { Prose } from "@/components/meridian/Prose";

/**
 * A link the model wrote, which is a link we did not verify.
 *
 * New tab, and `noopener noreferrer` with it: `noopener` because a page opened
 * from here must not get a handle on this one through `window.opener`, and
 * `noreferrer` because where the user was standing inside their own workspace
 * is not a destination's business. New tab rather than same tab because losing
 * the conversation to a citation is the one thing this pane is built not to do.
 */
function AnswerLink({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/**
 * Drop react-markdown's `node`, which is the mdast node it hands every override
 * for inspection and is NOT an HTML attribute.
 *
 * Caught in the browser rather than by a type: spreading the props straight
 * through put a literal `node="[object Object]"` on every heading in the DOM.
 * It rendered fine and it is still wrong, because the next person to read that
 * markup has to work out whether anything depends on it.
 */
type MdProps = React.HTMLAttributes<HTMLHeadingElement> & { node?: unknown };
function heading(level: "1" | "2" | "3") {
  return function Heading({ node: _node, ...rest }: MdProps) {
    return <h3 data-level={level} {...rest} />;
  };
}

/**
 * A heading, flattened to three levels.
 *
 * The model writes `#` through `######` with no idea how wide the surface is.
 * This pane is 392px, and an h1 at the page-title size would be louder than the
 * page it is floating over. So the six collapse to three, and the deepest ones
 * land on the same quiet weight rather than shrinking into the metadata ramp
 * where they would read as labels instead of headings.
 */
const HEADINGS = {
  h1: heading("1"),
  h2: heading("2"),
  h3: heading("3"),
  h4: heading("3"),
  h5: heading("3"),
  h6: heading("3"),
} as const;

const COMPONENTS = { ...HEADINGS, a: AnswerLink } as const;

/** What the crew said. The only renderer of assistant prose in the pane. */
export function Answer({ children }: { children: string }) {
  return (
    <Prose markdown>
      <Markdown components={COMPONENTS}>{children}</Markdown>
    </Prose>
  );
}
