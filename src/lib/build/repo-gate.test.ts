// W5b: dispatch repo-gate tests (pure module, resolver mocked, no I/O).

import { describe, it, expect } from "bun:test";
import {
  classifyRepoResolution,
  isRepoNotConnectedError,
  gateDispatch,
  provisionThenRetry,
} from "./repo-gate";

const NOT_CONNECTED =
  "GitHub is not connected. Connect it in Settings → Connected accounts, then bind a repo on Connectors.";

describe("classifyRepoResolution", () => {
  it("reports resolvable with the repo when the resolver resolves", async () => {
    const verdict = await classifyRepoResolution(async () => ({ repo: "acme/notes" }));
    expect(verdict).toEqual({ repoResolvable: true, resolution: "connected", repo: "acme/notes" });
  });

  it("reports not resolvable with the resolver's own message when it throws", async () => {
    const verdict = await classifyRepoResolution(async () => {
      throw new Error(NOT_CONNECTED);
    });
    expect(verdict.repoResolvable).toBe(false);
    expect(verdict.reason).toBe(NOT_CONNECTED);
    expect(verdict.repo).toBeUndefined();
  });

  it("stringifies a non-Error throw into the reason", async () => {
    const verdict = await classifyRepoResolution(async () => {
      throw "no binding";
    });
    expect(verdict).toEqual({ repoResolvable: false, resolution: "unknown", reason: "no binding" });
  });

  // THE DEFECT THIS SPLIT EXISTS FOR (2026-07-30). The workspace-binding branch
  // resolves the bound connection through the service-role client, so a missing
  // SUPABASE_SERVICE_ROLE_KEY made resolution throw an INFRASTRUCTURE error.
  // Everything used to classify as "not resolvable", which every surface
  // rendered as "No repo is connected. Connect one." The founder had a repo
  // connected and bound, and the product sent him to connect one.
  it("only resolveGitHub's own refusal reads as not connected", async () => {
    const verdict = await classifyRepoResolution(async () => {
      throw new Error(NOT_CONNECTED);
    });
    expect(verdict.resolution).toBe("not_connected");
  });

  it("an infrastructure failure reads as unknown, never as not connected", async () => {
    const verdict = await classifyRepoResolution(async () => {
      throw new Error(
        "Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY. Connect Supabase in Lovable Cloud.",
      );
    });
    expect(verdict.resolution).toBe("unknown");
    expect(verdict.repoResolvable).toBe(false);
  });

  it("a network blip reads as unknown, so nobody is told to reconnect a working repo", async () => {
    for (const msg of ["fetch failed", "timeout", "500 Internal Server Error"]) {
      const verdict = await classifyRepoResolution(async () => {
        throw new Error(msg);
      });
      expect(verdict.resolution).toBe("unknown");
    }
  });
});

describe("isRepoNotConnectedError", () => {
  it("matches resolveGitHub's not-connected refusal, case-insensitively", () => {
    expect(isRepoNotConnectedError(NOT_CONNECTED)).toBe(true);
    expect(isRepoNotConnectedError("GITHUB IS NOT CONNECTED.")).toBe(true);
  });

  it("does not match unrelated dispatch errors", () => {
    expect(isRepoNotConnectedError("Spec lookup failed: not found")).toBe(false);
    expect(isRepoNotConnectedError("rate limit exceeded")).toBe(false);
  });
});

describe("gateDispatch", () => {
  it("dispatches when the pre-check says resolvable", async () => {
    const calls: string[] = [];
    await gateDispatch({
      check: async () => ({ repoResolvable: true, resolution: "connected" as const, repo: "acme/notes" }),
      dispatch: () => calls.push("dispatch"),
      openGate: () => calls.push("gate"),
    });
    expect(calls).toEqual(["dispatch"]);
  });

  it("opens the gate with the reason when the pre-check says no", async () => {
    const calls: string[] = [];
    let gateReason: string | null = "unset";
    await gateDispatch({
      check: async () => ({
        repoResolvable: false,
        resolution: "not_connected" as const,
        reason: NOT_CONNECTED,
      }),
      dispatch: () => calls.push("dispatch"),
      openGate: (reason) => {
        calls.push("gate");
        gateReason = reason;
      },
    });
    expect(calls).toEqual(["gate"]);
    expect(gateReason).toBe(NOT_CONNECTED);
  });

  it("opens the gate with a null reason when the verdict carries none", async () => {
    let gateReason: string | null = "unset";
    await gateDispatch({
      check: async () => ({ repoResolvable: false, resolution: "not_connected" as const }),
      dispatch: () => {},
      openGate: (reason) => {
        gateReason = reason;
      },
    });
    expect(gateReason).toBeNull();
  });

  // An "unknown" verdict is the CHECK failing, not a finding about the repo, so
  // it gets the same treatment as the check throwing outright: dispatch, and let
  // the real error surface through the mutation. Opening the connect-a-repo gate
  // here would block a dispatch that would probably have worked.
  it("dispatches on an unknown verdict rather than blocking on a guess", async () => {
    const calls: string[] = [];
    await gateDispatch({
      check: async () => ({
        repoResolvable: false,
        resolution: "unknown" as const,
        reason: "SUPABASE_SERVICE_ROLE_KEY missing",
      }),
      dispatch: () => calls.push("dispatch"),
      openGate: () => calls.push("gate"),
    });
    expect(calls).toEqual(["dispatch"]);
  });

  it("dispatches anyway when the pre-check itself fails (advisory only)", async () => {
    const calls: string[] = [];
    await gateDispatch({
      check: async () => {
        throw new Error("network down");
      },
      dispatch: () => calls.push("dispatch"),
      openGate: () => calls.push("gate"),
    });
    expect(calls).toEqual(["dispatch"]);
  });
});

describe("provisionThenRetry", () => {
  it("provisions first, retries after, and returns the provisioned repo", async () => {
    const order: string[] = [];
    const repo = { owner: "acme", repo: "notes", htmlUrl: "https://github.com/acme/notes" };
    const result = await provisionThenRetry(
      async () => {
        order.push("provision");
        return repo;
      },
      () => {
        order.push("retry");
      },
    );
    expect(order).toEqual(["provision", "retry"]);
    expect(result).toBe(repo);
  });

  it("awaits an async retry before resolving", async () => {
    const order: string[] = [];
    await provisionThenRetry(
      async () => {
        order.push("provision");
        return { ok: true };
      },
      async () => {
        await Promise.resolve();
        order.push("retry");
      },
    );
    expect(order).toEqual(["provision", "retry"]);
  });

  it("never retries when provisioning fails, and the failure propagates", async () => {
    const order: string[] = [];
    await expect(
      provisionThenRetry(
        async () => {
          throw new Error("repo name already taken");
        },
        () => {
          order.push("retry");
        },
      ),
    ).rejects.toThrow("repo name already taken");
    expect(order).toEqual([]);
  });
});
