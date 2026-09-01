/**
 * S4 instrument for F-149. Compares what the model was shown BEFORE the fix
 * (xmlEscape + slice(0,2000)) against what it is shown AFTER, on the two
 * payload shapes the Build brief actually starts with: repo.tree then repo.read.
 * Pure function calls, no server, no network, no database.
 */
import { shortenToolResult } from "@/lib/ai/loop.server";

const oldPath = (result: unknown): string =>
  JSON.stringify(result)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 2000);

const treeOf = (n: number) => ({
  repo: "Supaprod/relay-homeowner-app",
  ref: "main",
  total: n,
  truncated: false,
  entries: Array.from({ length: n }, (_, i) => ({
    path: `src/components/module${i}/Thing${i}.tsx`,
    type: "file",
    size: 2000 + i,
  })),
});
const paths = (s: string) => (s.match(/Thing\d+\.tsx/g) ?? []).length;

console.log("== repo.tree: usable paths the model receives ==");
console.log("entries  rawChars  OLD(chars/paths)  NEW(chars/paths)");
for (const n of [50, 100, 110, 115, 120, 200, 400]) {
  const t = treeOf(n);
  const o = oldPath(t);
  const w = shortenToolResult(t);
  console.log(
    `${String(n).padEnd(8)} ${String(JSON.stringify(t).length).padEnd(9)} ${String(o.length + "/" + paths(o)).padEnd(17)} ${w.length + "/" + paths(w)}`,
  );
}

console.log("\n== repo.read: source characters the model receives ==");
const SRC = (n: number) =>
  "const a = () => <div>{x && y}</div>;\n".repeat(Math.ceil(n / 37)).slice(0, n);
for (const size of [2000, 4000, 7000, 8000, 12000, 30000, 60000, 120000]) {
  const p = {
    repo: "x/y",
    ref: "main",
    files: [{ path: "src/checkout/AddressStep.tsx", sha: "abc", size, content: SRC(size) }],
  };
  const o = oldPath(p);
  const w = shortenToolResult(p);
  let newContent = "";
  try {
    newContent = (JSON.parse(w).files?.[0]?.content ?? "").replace(/\n\n\[SHORTENED[\s\S]*$/, "");
  } catch {
    newContent = "<unparseable>";
  }
  const oldParses = (() => {
    try {
      JSON.parse(o);
      return "yes";
    } catch {
      return "NO";
    }
  })();
  console.log(
    `size=${String(size).padEnd(7)} OLD: ${String(o.length).padEnd(5)} chars, parses=${oldParses}, entities=${(o.match(/&(amp|lt|gt);/g) ?? []).length}` +
      `  |  NEW: ${String(w.length).padEnd(5)} chars, content=${String(newContent.length).padEnd(6)}, byteIdentical=${newContent === SRC(size)}`,
  );
}
