import { describe, expect, it } from "bun:test";
import { matchSlashCommands, suggestedAsksForContext, SLASH_COMMANDS } from "./ask-suggestions";

describe("ask-suggestions - matchSlashCommands", () => {
  it("returns nothing for text that does not start with /", () => {
    expect(matchSlashCommands("why did we")).toEqual([]);
    expect(matchSlashCommands("")).toEqual([]);
  });

  it("returns all commands for a bare slash", () => {
    expect(matchSlashCommands("/")).toEqual(SLASH_COMMANDS);
  });

  it("filters by prefix, case-insensitively", () => {
    expect(matchSlashCommands("/wh")).toEqual([SLASH_COMMANDS[0]]);
    expect(matchSlashCommands("/WH")).toEqual([SLASH_COMMANDS[0]]);
  });

  it("returns nothing once the query no longer matches any command", () => {
    expect(matchSlashCommands("/xyz")).toEqual([]);
  });

  it("still matches once a command is fully typed (exact prefix)", () => {
    expect(matchSlashCommands("/status")).toEqual([SLASH_COMMANDS[1]]);
  });

  it("stops matching once free text follows a completed command", () => {
    expect(matchSlashCommands("/status of the build")).toEqual([]);
  });
});

describe("ask-suggestions - suggestedAsksForContext", () => {
  it("returns a non-empty list for a known context", () => {
    const asks = suggestedAsksForContext("Today");
    expect(asks.length).toBeGreaterThan(0);
  });

  it("falls back to the generic screen suggestions for an unknown context", () => {
    expect(suggestedAsksForContext("some unmapped context")).toEqual(
      suggestedAsksForContext("this screen"),
    );
  });

  it("covers every context contextForPath can produce", () => {
    for (const ctx of [
      "Today",
      "Discover",
      "Plan",
      "Build",
      "a mission",
      "Brain",
      "Guardrails",
      "this screen",
    ]) {
      expect(suggestedAsksForContext(ctx).length).toBeGreaterThan(0);
    }
  });
});
