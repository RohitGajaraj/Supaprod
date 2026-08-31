import { readFileSync } from "node:fs";
const src = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
// Split on tool definitions: name: "x", ... description: "..." ... argsSchema: z.object({...})
const blocks = src.split(/\n\s*(?=name:\s*")/);
let total = 0, withRequired = 0, namesAll = 0, namesNone = 0;
const offenders = [];
for (const b of blocks) {
  const nm = b.match(/^name:\s*"([^"]+)"/);
  if (!nm) continue;
  const schema = b.match(/argsSchema:\s*z\.object\(\{([\s\S]*?)\n\s{2}\}\)/);
  if (!schema) continue;
  total++;
  // required = a key whose value chain has no .optional() before the line ends
  const req = [];
  for (const line of schema[1].split("\n")) {
    const m = line.match(/^\s{4}(\w+):\s*z\./);
    if (!m) continue;
    if (!/\.optional\(\)|\.default\(/.test(line)) req.push(m[1]);
  }
  if (req.length === 0) continue;
  withRequired++;
  // description = concatenated string literals before argsSchema
  const dIdx = b.indexOf("description:");
  const aIdx = b.indexOf("argsSchema:");
  const desc = dIdx >= 0 && dIdx < aIdx ? b.slice(dIdx, aIdx) : "";
  const named = req.filter((r) => new RegExp(`\\b${r}\\b`).test(desc));
  if (named.length === req.length) namesAll++;
  else if (named.length === 0) { namesNone++; offenders.push({ t: nm[1], req }); }
}
console.log(`tools with an argsSchema and at least one REQUIRED field: ${withRequired}`);
console.log(`  description names EVERY required field:  ${namesAll}`);
console.log(`  description names NONE of them:          ${namesNone}`);
console.log(`\nA sample of those naming none (tool -> required fields the model must guess):`);
for (const o of offenders.slice(0, 14)) console.log(`  ${o.t.padEnd(26)} ${o.req.join(", ")}`);
