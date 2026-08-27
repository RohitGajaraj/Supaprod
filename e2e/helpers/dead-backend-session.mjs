/**
 * A SIGNED-IN BROWSER WITH NOTHING BEHIND IT.
 *
 * ── WHY THIS IS NEEDED AND WHY IT IS NOT A LOGIN ───────────────────────────
 * The dead backend test is only interesting on the surfaces where a person
 * watches their own work: the run board, today, approvals. Signed out, all six
 * of those redirect to `/login` and the measurement is of the login page.
 *
 * Logging in properly is impossible here BY CONSTRUCTION, not by accident: the
 * whole point is that the database is unreachable, so no credential can be
 * checked against it. The repo's own auth setup needs `E2E_DEMO_PASSWORD` and a
 * live backend, which is the opposite of this test.
 *
 * So this fabricates the ONE thing the route guard actually reads.
 * `_authenticated.tsx` calls `supabase.auth.getSession()`, which reads
 * localStorage and makes no network call, and `previewAuthStorage.ts:18` returns
 * plain `localStorage` in an unframed browser. A session-shaped value under the
 * key supabase-js derives from the URL is therefore enough to render the
 * authenticated shell, while every data read behind it fails.
 *
 * WHAT THIS IS NOT. It is not a credential, it is not a bypass of anything on a
 * live system, and it cannot reach one: the token is locally fabricated, unsigned
 * by any real secret, and the only server it is ever sent to is a port with
 * nothing listening. Against a real backend it is rejected on the first request.
 * It is a test double for a guard that reads a value out of a browser.
 *
 * ── THE KEY ────────────────────────────────────────────────────────────────
 * `client.ts` sets no `storageKey`, so supabase-js derives it from the URL host:
 * `sb-<first hostname label>-auth-token`. The dead env points at
 * `http://localhost:54321`, which makes it `sb-localhost-auth-token`.
 *
 * Usage:  bun run e2e/helpers/dead-backend-session.mjs > playwright/.auth/dead.json
 */
const FAR_FUTURE = 4102444800; // 2100-01-01, so nothing tries to refresh it.
const USER_ID = "00000000-0000-4000-8000-00000000dead";

const b64url = (o) =>
  Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Shaped like a JWT so anything that decodes it finds what it expects. Signed by nothing. */
const jwt = [
  b64url({ alg: "HS256", typ: "JWT" }),
  b64url({ sub: USER_ID, aud: "authenticated", role: "authenticated", exp: FAR_FUTURE }),
  "not-a-real-signature",
].join(".");

const session = {
  access_token: jwt,
  refresh_token: "dead-backend-test-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: FAR_FUTURE,
  user: {
    id: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "dead-backend-test@localhost",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
  },
};

process.stdout.write(
  JSON.stringify(
    {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:8080",
          localStorage: [{ name: "sb-localhost-auth-token", value: JSON.stringify(session) }],
        },
      ],
    },
    null,
    2,
  ) + "\n",
);
