import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { authorizeAppUserOAuth, callAsAppUser } from "./appUserConnector";

const savedFetch = globalThis.fetch;
const savedKey = process.env.LOVABLE_API_KEY;

beforeEach(() => {
  process.env.LOVABLE_API_KEY = "test-key";
});

afterEach(() => {
  globalThis.fetch = savedFetch;
  if (savedKey === undefined) delete process.env.LOVABLE_API_KEY;
  else process.env.LOVABLE_API_KEY = savedKey;
});

function mockFetchOnce(status: number, body: string) {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(body, { status });
  }) as typeof fetch;
  return {
    url: () => capturedUrl,
    init: () => capturedInit,
  };
}

describe("authorizeAppUserOAuth", () => {
  const PARAMS = {
    gatewayBaseUrl: "https://gw.example.com",
    connectorId: "figma",
    appUserId: "user-1",
    connectorClientId: "client-1",
    returnUrl: "https://app.example.com/return",
  };

  test("throws before calling fetch when LOVABLE_API_KEY is unset", async () => {
    delete process.env.LOVABLE_API_KEY;
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    await expect(authorizeAppUserOAuth(PARAMS)).rejects.toThrow("LOVABLE_API_KEY is not set");
    expect(fetchCalled).toBe(false);
  });

  test("POSTs the mapped body with a bearer auth header and returns the parsed response", async () => {
    const mock = mockFetchOnce(
      200,
      JSON.stringify({ authorization_url: "https://figma.com/oauth", session_id: "sess-1" }),
    );

    const result = await authorizeAppUserOAuth(PARAMS);

    expect(mock.url()).toBe("https://gw.example.com/api/v1/app-users/oauth2/authorize");
    const init = mock.init();
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init?.body as string)).toEqual({
      connector_id: "figma",
      app_user_id: "user-1",
      connector_client_id: "client-1",
      return_url: "https://app.example.com/return",
      credentials_configuration: undefined,
      response_mode: undefined,
      web_message_target_origin: undefined,
    });
    expect(result).toEqual({ authorizationUrl: "https://figma.com/oauth", sessionId: "sess-1" });
  });

  test("defaults sessionId to '' when the gateway omits session_id", async () => {
    mockFetchOnce(200, JSON.stringify({ authorization_url: "https://figma.com/oauth" }));
    const result = await authorizeAppUserOAuth(PARAMS);
    expect(result.sessionId).toBe("");
  });

  test("throws with the status and response body text on a non-ok response", async () => {
    mockFetchOnce(500, "gateway on fire");
    await expect(authorizeAppUserOAuth(PARAMS)).rejects.toThrow(
      "OAuth start failed (500): gateway on fire",
    );
  });

  test("throws when the response is ok but missing authorization_url", async () => {
    mockFetchOnce(200, JSON.stringify({ session_id: "sess-1" }));
    await expect(authorizeAppUserOAuth(PARAMS)).rejects.toThrow(
      "OAuth start response missing authorization_url",
    );
  });

  test("an ok response with an empty body also fails the missing-authorization_url check, not a JSON.parse crash", async () => {
    mockFetchOnce(200, "");
    await expect(authorizeAppUserOAuth(PARAMS)).rejects.toThrow(
      "OAuth start response missing authorization_url",
    );
  });
});

describe("callAsAppUser", () => {
  test("throws before calling fetch when LOVABLE_API_KEY is unset", async () => {
    delete process.env.LOVABLE_API_KEY;
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return new Response("ok");
    }) as typeof fetch;

    await expect(
      callAsAppUser({
        gatewayBaseUrl: "https://gw.example.com",
        connectionId: "conn-1",
        connectorId: "figma",
        path: "/files",
      }),
    ).rejects.toThrow("LOVABLE_API_KEY is not set");
    expect(fetchCalled).toBe(false);
  });

  test("prefixes a path with a leading slash when the caller omits one", async () => {
    const mock = mockFetchOnce(200, "ok");
    await callAsAppUser({
      gatewayBaseUrl: "https://gw.example.com",
      connectionId: "conn-1",
      connectorId: "figma",
      path: "files",
    });
    expect(mock.url()).toBe("https://gw.example.com/figma/files");
  });

  test("keeps a path that already has a leading slash as-is", async () => {
    const mock = mockFetchOnce(200, "ok");
    await callAsAppUser({
      gatewayBaseUrl: "https://gw.example.com",
      connectionId: "conn-1",
      connectorId: "figma",
      path: "/files",
    });
    expect(mock.url()).toBe("https://gw.example.com/figma/files");
  });

  test("sets the bearer auth header and the app-user connection header, preserving caller-supplied headers", async () => {
    const mock = mockFetchOnce(200, "ok");
    await callAsAppUser({
      gatewayBaseUrl: "https://gw.example.com",
      connectionId: "conn-1",
      connectorId: "figma",
      path: "/files",
      init: { headers: { "X-Custom": "1" } },
    });
    const headers = new Headers(mock.init()?.headers);
    expect(headers.get("Authorization")).toBe("Bearer test-key");
    expect(headers.get("X-App-User-Connection-Id")).toBe("conn-1");
    expect(headers.get("X-Custom")).toBe("1");
  });

  test("returns the raw Response unparsed", async () => {
    mockFetchOnce(201, "raw body");
    const res = await callAsAppUser({
      gatewayBaseUrl: "https://gw.example.com",
      connectionId: "conn-1",
      connectorId: "figma",
      path: "/files",
    });
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("raw body");
  });
});
