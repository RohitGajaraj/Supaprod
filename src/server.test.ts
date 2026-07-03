import { describe, expect, test } from "bun:test";
import { AGENT_DISCOVERY_LINK_HEADER, withAgentDiscoveryLink } from "./server";

describe("withAgentDiscoveryLink", () => {
  test("adds the agent-discovery Link header to a response missing one", () => {
    const response = new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });

    const result = withAgentDiscoveryLink(response);

    expect(result.headers.get("Link")).toBe(AGENT_DISCOVERY_LINK_HEADER);
    expect(result.headers.get("content-type")).toBe("text/html");
    expect(result.status).toBe(200);
  });

  test("does not override an existing Link header", () => {
    const response = new Response("body", {
      status: 200,
      headers: { Link: '</other.txt>; rel="something-else"' },
    });

    const result = withAgentDiscoveryLink(response);

    expect(result.headers.get("Link")).toBe('</other.txt>; rel="something-else"');
  });

  test("preserves status and statusText on error responses", () => {
    const response = new Response("not found", { status: 404, statusText: "Not Found" });

    const result = withAgentDiscoveryLink(response);

    expect(result.status).toBe(404);
    expect(result.headers.get("Link")).toBe(AGENT_DISCOVERY_LINK_HEADER);
  });
});
