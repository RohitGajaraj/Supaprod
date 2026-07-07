// W5a: The Cadence starter template - the honest first commit for a newly
// provisioned build repo. Pure module (no imports, no side effects) so it is
// unit-testable and safe to import from anywhere.
//
// The template is a minimal, genuinely deployable Deno app: an HTTP handler
// that serves a real HTML page naming the product plus a /health JSON route,
// one real test against the handler, and real CI (deno check + deno test).

export type TemplateFile = { path: string; content: string };

export type TemplateParams = {
  productName: string;
  specTitle: string;
};

/** Escape a value for safe inlining into generated HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Collapse whitespace/newlines so names are safe in comments and one-liners. */
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Derive a GitHub-safe repo name from a spec title (letters, numbers, ., _, -).
 * Falls back to "cadence-build" when the title has no usable characters.
 */
export function repoNameFromTitle(title: string): string {
  const slug = oneLine(title)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(0, 80)
    .replace(/^[-._]+/, "")
    .replace(/[-._]+$/, "");
  return slug || "cadence-build";
}

/**
 * Render the starter files for a new build repo. Parameterized by the product
 * name and the spec title; all values are escaped for the context they land in
 * (JS string literal, HTML, Markdown one-liners).
 */
export function renderStarterTemplate(params: TemplateParams): TemplateFile[] {
  const productName = oneLine(params.productName) || "Cadence build";
  const specTitle = oneLine(params.specTitle) || productName;
  const productJs = JSON.stringify(productName);
  const productHtml = escapeHtml(productName);
  const specHtml = escapeHtml(specTitle);

  const mainTs = `// ${productName} - provisioned by Cadence.
// Spec: ${specTitle}
//
// A minimal Deno web service: an HTML page for the product at / and a JSON
// health check at /health. Cadence builds the product on top of this.

export const PRODUCT_NAME = ${productJs};

export function handler(req: Request): Response {
  const url = new URL(req.url);
  if (url.pathname === "/health") {
    return Response.json({ ok: true, product: PRODUCT_NAME });
  }
  return new Response(page(), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function page(): string {
  return \`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${productHtml}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; display: grid; place-items: center; min-height: 100vh; background: #0b0d12; color: #e8eaf0; }
    main { max-width: 32rem; padding: 2rem; }
    h1 { font-size: 1.75rem; margin: 0 0 0.5rem; }
    p { color: #9aa3b2; line-height: 1.5; }
    code { background: #161a22; padding: 0.15rem 0.4rem; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    <h1>${productHtml}</h1>
    <p>${specHtml}</p>
    <p>This service is live. Health check at <code>/health</code>.</p>
  </main>
</body>
</html>\`;
}

if (import.meta.main) {
  Deno.serve(handler);
}
`;

  const mainTestTs = `import { handler, PRODUCT_NAME } from "./main.ts";

Deno.test("GET /health returns ok JSON naming the product", async () => {
  const res = handler(new Request("http://localhost/health"));
  if (res.status !== 200) throw new Error(\`expected 200, got \${res.status}\`);
  const body = await res.json();
  if (body.ok !== true) throw new Error("expected ok: true in /health body");
  if (body.product !== PRODUCT_NAME) {
    throw new Error(\`expected product \${PRODUCT_NAME}, got \${body.product}\`);
  }
});

Deno.test("GET / serves the product page", async () => {
  const res = handler(new Request("http://localhost/"));
  if (res.status !== 200) throw new Error(\`expected 200, got \${res.status}\`);
  const html = await res.text();
  if (!html.includes("<!doctype html>")) throw new Error("expected an HTML page");
});
`;

  const denoJson =
    JSON.stringify(
      {
        tasks: {
          check: "deno check main.ts main_test.ts",
          test: "deno test",
        },
      },
      null,
      2,
    ) + "\n";

  const ciYml = `name: CI

on:
  push:
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - name: Type check
        run: deno task check
      - name: Test
        run: deno task test
`;

  const readmeMd = `# ${productName}

Starter repository provisioned by Cadence for the spec "${specTitle}".

## What this is

A minimal Deno web service. \`main.ts\` serves a small HTML page for
${productName} and a JSON health check at \`/health\`. It ships with a real
test (\`main_test.ts\`) and real CI (\`.github/workflows/ci.yml\`) so every
change is type-checked and tested from the first commit.

## Run it locally

\`\`\`sh
deno task check              # type-check
deno task test               # run the tests
deno run --allow-net main.ts # serve on http://localhost:8000
\`\`\`

## How Cadence builds on it

Cadence commits changes on branches, opens change requests against the default
branch, and reads the CI defined here to verify each change before merge.
\`cadence.json\` marks this repository as Cadence-managed.
`;

  const cadenceJson =
    JSON.stringify(
      {
        managedBy: "cadence",
        template: "deno-starter",
        version: 1,
      },
      null,
      2,
    ) + "\n";

  return [
    { path: "main.ts", content: mainTs },
    { path: "main_test.ts", content: mainTestTs },
    { path: "deno.json", content: denoJson },
    { path: ".github/workflows/ci.yml", content: ciYml },
    { path: "README.md", content: readmeMd },
    { path: "cadence.json", content: cadenceJson },
  ];
}
