import { describe, expect, test } from "bun:test";
import { githubAuthSourceLabel, readWithLine } from "./github.server";

// P-122 (A-QUEUE.md): "every deployment failure row records the auth source
// and the actor label beside the reason ... 'read with the workspace's
// GitHub connection as supaprod-connector'."
describe("githubAuthSourceLabel", () => {
  test("names each of resolveGitHub's three sources in a person's words", () => {
    expect(githubAuthSourceLabel("binding")).toBe("the workspace's GitHub connection");
    expect(githubAuthSourceLabel("user_connection")).toBe("your own GitHub connection");
    expect(githubAuthSourceLabel("env")).toBe("the deployment's shared GitHub token");
  });
});

describe("readWithLine", () => {
  test("composes the packet's own exact sentence for a binding source", () => {
    expect(readWithLine({ source: "binding", actorLabel: "supaprod-connector" })).toBe(
      "read with the workspace's GitHub connection as supaprod-connector",
    );
  });

  test("carries whatever actor label resolveGitHub actually returned, not a fixed word", () => {
    expect(readWithLine({ source: "user_connection", actorLabel: "jane@example.com" })).toBe(
      "read with your own GitHub connection as jane@example.com",
    );
  });
});
