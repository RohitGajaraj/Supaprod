import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  /**
   * GENERATED OUTPUT IS NOT SOURCE, AND LINTING IT MADE THE GATE USELESS.
   *
   * This list held three build directories and had not grown; `.gitignore`
   * meanwhile learned six more. The gap was not cosmetic. Measured 2026-08-06,
   * `bun run lint` reported 9,928 errors and 9,203 of them were inside `src/` --
   * of which 8,560 came from ONE file, `src/integrations/supabase/types.ts`,
   * which is Supabase's generated types and was never prettier-formatted. A
   * further ~725 came from `test-results/`, Playwright's HTML report, whose
   * minified vendor bundle prettier reformats line by line.
   *
   * So 93% of the repo's lint baseline was machine-written code that no person
   * will ever edit, and `.github/workflows/ci.yml` excludes the full lint from CI
   * citing "~4k legacy eslint findings in untouched files" -- a fair call against
   * the number it had, but the number was mostly this. With these ignores the
   * baseline is ~640 findings in code humans actually wrote, which is a figure
   * you can drive to zero.
   *
   * NO RULE IS WEAKENED HERE. Every check that applied to hand-written code still
   * applies to it unchanged; this only stops eslint reading files git refuses to
   * store. (Founder approved 2026-08-06 08:45 IST; the `config-protection` hook
   * blocks edits to this file precisely so that a human, not an agent, makes that
   * call.)
   *
   * THE RULE: if git will not store it, eslint should not read it. Kept as an
   * explicit list rather than parsed from `.gitignore`, because that file also
   * ignores things worth linting (`.claude/skills/*`) and secrets that must never
   * be opened at all.
   *
   * TWO EXCEPTIONS GIT DOES STORE (Lane 3's reading of the gate, 2026-09-09;
   * applied by Lane 1, since the hook holds this file for a person). Neither is
   * application code and neither is edited by hand. `.claude/workflows/*.js` are
   * scripts for the Workflow tool, whose runtime documents a top-level `return`,
   * so parsing them as ES modules reports a syntax error for a file that is
   * correct where it runs. `docs/planning/archive/**` is archived by the folder's
   * own name. Together they account for four of the gate's thirty-four errors;
   * the other thirty are real, in code we own, and are being taken by the lane
   * whose files they are.
   */
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      ".nitro",
      ".wrangler",
      "test-results",
      "playwright-report",
      ".playwright-mcp",
      "playwright-cli",
      "coverage",
      "src/integrations/supabase/types.ts",
      ".claude/workflows/**",
      ".remember/tmp/**",
      "docs/planning/archive/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "alert", message: "Use toast() from sonner or an in-app <Alert>." },
        { name: "confirm", message: "Use useConfirm() from @/hooks/use-confirm." },
        { name: "prompt", message: "Use usePrompt() from @/hooks/use-confirm." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='window'][property.name=/^(alert|confirm|prompt|onbeforeunload)$/]",
          message: "No browser popups. Use useConfirm / usePrompt / toast / in-app Dialog instead.",
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  eslintPluginPrettier,
);
