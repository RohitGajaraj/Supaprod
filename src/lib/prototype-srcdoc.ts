/*
 * ONE BUILDER FOR A PROTOTYPE'S PREVIEW DOCUMENT.
 *
 * Extracted from `routes/p.$slug.tsx` on 2026-08-25 so the artifact pane can
 * render a prototype AS ITSELF without a second copy of this logic — a copy is
 * a thing that drifts, and this repo has paid for that shape enough times to
 * have a rule about it.
 *
 * The contract is unchanged from the public page: find the entry HTML (exact
 * `entry_path` first, any `.html` second), then inline same-set CSS links and
 * JS script tags by path match. Files it cannot match are left as written —
 * the sandbox blocks the fetch and the preview degrades honestly rather than
 * silently reaching out to the network.
 */

export type PrototypeFileRow = { path: string; content: string; language?: string | null };

export function buildSrcDoc(files: PrototypeFileRow[], entry: string): string {
  const html = files.find((f) => f.path === entry) ?? files.find((f) => f.path.endsWith(".html"));
  if (!html) return "<html><body><p>No HTML file</p></body></html>";
  let out = html.content;
  out = out.replace(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/g, (_m, href) => {
    const css = files.find((f) => f.path === href);
    return css ? `<style>${css.content}</style>` : _m;
  });
  out = out.replace(/<script[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/g, (_m, src) => {
    const js = files.find((f) => f.path === src);
    return js ? `<script>\n${js.content}\n</script>` : _m;
  });
  return out;
}
