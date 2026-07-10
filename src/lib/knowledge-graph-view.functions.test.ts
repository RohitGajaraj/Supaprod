import { describe, it, expect } from "bun:test";
import { isMissingColumnError, chunk } from "./knowledge-graph-view.functions";

// These two helpers back getKnowledgeGraph's bitemporal-column probe and its
// batched .in() lineage walk. Both were module-private (no `export`), which is
// why they carried 0% function coverage despite the file being exercised
// indirectly elsewhere — unit-testing them directly needed no Supabase mock at
// all, so they were exported for exactly that.

describe("isMissingColumnError (42703 detector for the pre-migration `valid_to` probe)", () => {
  it("returns false for a null or undefined error (the happy path: query succeeded)", () => {
    expect(isMissingColumnError(null)).toBe(false);
    expect(isMissingColumnError(undefined)).toBe(false);
  });

  it("returns false for an error with neither a matching code nor message", () => {
    expect(isMissingColumnError({})).toBe(false);
    expect(isMissingColumnError({ code: "23505", message: "duplicate key" })).toBe(false);
  });

  it("returns true on the PostgREST 42703 code alone, regardless of message", () => {
    expect(isMissingColumnError({ code: "42703" })).toBe(true);
    expect(isMissingColumnError({ code: "42703", message: "" })).toBe(true);
  });

  it("returns true when the message names the missing valid_to column, case-insensitively", () => {
    expect(isMissingColumnError({ message: "column valid_to does not exist" })).toBe(true);
    expect(isMissingColumnError({ message: "COLUMN VALID_TO DOES NOT EXIST" })).toBe(true);
  });

  it("returns false when the message matches only one of the two required phrases", () => {
    expect(isMissingColumnError({ message: "relation artifact_lineage does not exist" })).toBe(
      false,
    );
    expect(isMissingColumnError({ message: "valid_to is required" })).toBe(false);
  });

  it("does not misfire on an unrelated 'column does not exist' for a different column", () => {
    expect(isMissingColumnError({ message: "column inference does not exist" })).toBe(false);
  });
});

describe("chunk (batches ids for PostgREST .in() so a URL can never run long)", () => {
  it("returns an empty array for an empty input", () => {
    expect(chunk([], 25)).toEqual([]);
  });

  it("splits evenly when the array length is a multiple of the batch size", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("puts the remainder in a final, shorter batch", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single batch when the size exceeds the array length", () => {
    expect(chunk(["a", "b", "c"], 25)).toEqual([["a", "b", "c"]]);
  });

  it("produces one batch per element when size is 1", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });
});
