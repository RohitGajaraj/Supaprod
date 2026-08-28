import { PUBLIC_FOOTER_LINKS } from "./site-links";

/**
 * THE SIX PUBLIC FOOTER LINKS, RENDERED ONCE.
 *
 * U-111 shared the LIST and deliberately not the rendering, on the reasoning
 * that the three footers are different objects -- the legal shell centres a
 * 720px column, /demo and /film put a copyright opposite the links at 5xl --
 * and forcing one layout onto three contexts would be worse than the drift it
 * fixed. That reasoning was right about the BOX and wrong about the LINK.
 *
 * U-135 proved it. S4 measured those links at 21px tall against a 24px floor
 * and I fixed it on the legal shell with a 44px `::after` overlay. Five routes
 * got a real tap target and two did not, because /demo and /film render their
 * own anchors from the shared list. A behaviour that must be identical
 * everywhere was living in one of the three places that draw it.
 *
 * So the LINK is shared and the BOX is not. Each footer keeps its own
 * container, its own spacing and its own copyright; what they stop owning is
 * how a link is drawn and how big it is to hit. That is the line U-111 should
 * have drawn and could not see yet, because the hit area did not exist.
 *
 * `className` is a passthrough for the one thing that genuinely differs: the
 * legal shell colours from its own `C` object and the two dark routes use
 * Tailwind. Neither may set the SIZE, which is what `legal-footer-link`
 * carries in public-legibility.css.
 */
export function FooterLinks({
  className = "",
  style,
}: {
  /** Per-surface colour and type only. Size belongs to the shared class. */
  className?: string;
  /** The legal shell's `C.faint`, which is a literal rather than a token by
   *  deliberate design: public pages are dark-only and must not consult a
   *  theme-flipping token. See LegalPageShell's own note. */
  style?: React.CSSProperties;
}) {
  return (
    <>
      {PUBLIC_FOOTER_LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className={`legal-footer-link ${className}`}
          style={{ position: "relative", textDecoration: "none", ...style }}
        >
          {l.label}
        </a>
      ))}
    </>
  );
}
