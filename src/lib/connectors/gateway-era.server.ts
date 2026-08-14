/**
 * The three providers whose feature code never learned to read a user's own token.
 *
 * THE DEFECT THIS EXISTS TO CLOSE. Linear, Notion and Google Docs each have a
 * real, working, two-way integration in this product, and each authenticated
 * with SHARED ADMIN ENV KEYS through the Lovable connector gateway:
 * `LOVABLE_API_KEY` plus `LINEAR_API_KEY` / `NOTION_API_KEY` /
 * `GOOGLE_DOCS_API_KEY`. Meanwhile all three have native OAuth flows that mint a
 * per-user token, encrypt it, and store it against a `connections` row.
 *
 * Those two halves never met. `linear.functions.ts` and its two siblings read
 * `process.env` and nothing else, so the token the OAuth callback wrote was
 * never read by anything, and the error raised when the admin key was unset
 * read: "Linear isn't connected yet. Link it from Integrations." A person who
 * had just completed the Linear round trip was told to go and connect Linear.
 *
 * It is not hypothetical. Production holds a real Linear connection in exactly
 * that state, recorded in the registry's own notes.
 *
 * WHY A TRANSPORT AND NOT JUST A TOKEN. The two credentials do not go to the
 * same place. A per-user OAuth token is bearer auth against the provider's own
 * API; the admin key is a gateway credential that only the gateway understands.
 * So resolving auth is not enough, the base URL moves with it, and a helper that
 * returned only a token would leave every call site to work that out again.
 *
 * WHAT IS DELIBERATELY UNCHANGED. The gateway path is byte-identical to what it
 * was, and it is still what answers when no user connection exists. The only
 * behaviour that changes is for a user who HAS connected, and today that user
 * gets an error, so this cannot regress anyone.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveProviderAuth } from "./resolve.server";
import type { ConnectorCapability } from "@/lib/entitlements";

/** The three providers that authenticate through the gateway rather than direct. */
export type GatewayEraProvider = "linear" | "notion" | "google_docs";

export type ProviderCall = {
  /**
   * Where the request goes, without a trailing slash.
   *
   * It moves with the credential, which is the whole reason this type exists:
   * the gateway and the provider's own API are different hosts speaking
   * different auth.
   */
  baseUrl: string;
  headers: Record<string, string>;
  /**
   * Which tier of the credential chain answered.
   *
   * Surfaced so a caller can say "your connection" rather than "a connection",
   * and so a support question has an answer that does not require a log dive.
   */
  source: "user_connection" | "env";
};

/**
 * The Notion REST version every request must carry.
 *
 * Notion requires the `Notion-Version` header on every call and rejects a
 * request without one. The gateway was injecting it, which is why none of the
 * call sites ever set it; going direct makes it ours. Pinned rather than
 * floating, because Notion's versions are dated releases and a silent bump is a
 * silent change in response shape.
 */
const NOTION_VERSION = "2022-06-28";

const DIRECT: Record<GatewayEraProvider, string> = {
  linear: "https://api.linear.app/graphql",
  notion: "https://api.notion.com/v1",
  google_docs: "https://docs.googleapis.com/v1",
};

const GATEWAY: Record<GatewayEraProvider, string> = {
  linear: "https://connector-gateway.lovable.dev/linear/graphql",
  notion: "https://connector-gateway.lovable.dev/notion/v1",
  google_docs: "https://connector-gateway.lovable.dev/google_docs/v1",
};

/** The env var each provider's admin key lives in, matching the registry. */
const ENV_KEY: Record<GatewayEraProvider, string> = {
  linear: "LINEAR_API_KEY",
  notion: "NOTION_API_KEY",
  google_docs: "GOOGLE_DOCS_API_KEY",
};

/**
 * Linear takes its two credential types in two different headers.
 *
 * An OAuth access token is `Authorization: Bearer <token>`, per Linear's own
 * developer docs. A personal API key is the raw key with NO `Bearer` prefix, and
 * they are told apart by their `lin_api_` prefix. Sending a personal key as a
 * bearer token fails authentication, so this is not a stylistic choice.
 *
 * Only the direct path needs it. The gateway never sees either credential.
 */
function linearAuthHeader(token: string): string {
  return token.startsWith("lin_api_") ? token : `Bearer ${token}`;
}

function directHeaders(provider: GatewayEraProvider, token: string): Record<string, string> {
  if (provider === "linear") {
    return { Authorization: linearAuthHeader(token), "Content-Type": "application/json" };
  }
  if (provider === "notion") {
    return {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    };
  }
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/**
 * How to reach one provider on behalf of one person, or null if we cannot.
 *
 * Null means "no credential of any kind resolved", which is the only honest
 * answer a caller can turn into a sentence. It never throws for an
 * unconfigured environment, matching the chokepoint's own contract; the one
 * thing that DOES propagate is the tier gate, because "your plan does not
 * include this" is a different fact from "nothing is connected" and a caller
 * that flattened them would tell a Free user to go and connect something that
 * would not work either.
 */
export async function resolveProviderCall(args: {
  provider: GatewayEraProvider;
  /** The caller's own RLS client, which is how tier 2 finds their connection. */
  userClient?: SupabaseClient;
  userId?: string | null;
  workspaceId?: string | null;
  productId?: string | null;
  requiredCapability?: ConnectorCapability;
}): Promise<ProviderCall | null> {
  const { provider } = args;
  const resolved = await resolveProviderAuth({
    userClient: args.userClient,
    userId: args.userId,
    workspaceId: args.workspaceId,
    productId: args.productId,
    provider,
    requiredCapability: args.requiredCapability,
  });

  // The person's own token, or a workspace binding's. Straight to the provider.
  if (resolved.auth?.kind === "token") {
    return {
      baseUrl: DIRECT[provider],
      headers: directHeaders(provider, resolved.auth.token),
      source: "user_connection",
    };
  }

  // The admin key, exactly as it has always worked. The gateway needs its own
  // credential as well as the provider's, and without it there is no transport
  // at all rather than a half-formed one.
  if (resolved.auth?.kind === "env") {
    const lovable = process.env.LOVABLE_API_KEY;
    if (!lovable) return null;
    return {
      baseUrl: GATEWAY[provider],
      headers: {
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": resolved.auth.token,
        "Content-Type": "application/json",
      },
      source: "env",
    };
  }

  /*
   * `github_app` and `gateway` are deliberately unhandled.
   *
   * None of these three providers can produce either: all three are
   * `oauth_native` in the registry, so a connection row carries a vault secret
   * and materializes as `token`. A `gateway`-kind row could only exist from the
   * pre-native era, and the gateway's header shape for a stored connection id is
   * not the one above and is not verifiable from here. Falling through to null
   * says "nothing usable resolved", which is true, rather than guessing a header
   * name and producing an authentication failure that reads like a broken token.
   */
  return null;
}

/**
 * Is this provider reachable for this person at all?
 *
 * The env-only predicates this replaces (`isLinearConfigured` and friends) asked
 * whether the ADMIN had configured a key, and every caller read the answer as
 * "is this connected". For a user with their own connection those are opposite
 * answers, which is how the connect loop came to close on itself.
 */
export async function providerIsReachable(args: {
  provider: GatewayEraProvider;
  userClient?: SupabaseClient;
  userId?: string | null;
  workspaceId?: string | null;
  requiredCapability?: ConnectorCapability;
}): Promise<boolean> {
  try {
    return (await resolveProviderCall(args)) !== null;
  } catch {
    // A tier refusal is not reachability. Answering false is correct here: the
    // caller asked whether it can be used, and it cannot.
    return false;
  }
}

/** Exported for tests, so the header contract is pinned rather than described. */
export const __testing = { linearAuthHeader, directHeaders, NOTION_VERSION, DIRECT, GATEWAY, ENV_KEY };
