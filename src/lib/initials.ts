/**
 * ONE DEFINITION OF A PERSON'S INITIALS, and the reason it is a module rather
 * than a local helper is the invariant ReceiptsPanel stated first: your
 * initials, derived the same way the app header derives them, so the disc on a
 * receipt you settled is the same disc you see in the corner.
 *
 * That held by luck until 2026-08. Seven non-test files carried a
 * byte-identical body -- the shell, Ask, Threads, the run detail, Decisions,
 * the memory queue and Receipts -- which is seven chances for the invariant to
 * stop being true silently, because the copies drift and then two surfaces
 * draw the same person differently and a reader cannot tell which is right.
 *
 * The signature is the widest of the seven (the shell's), because the shell
 * reads an account row where the email can be absent. Narrower callers pass
 * `string | null` and are unaffected.
 */
export function initialsFrom(email: string | null | undefined, name?: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
