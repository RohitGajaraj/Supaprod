import { describe, it, expect } from "bun:test";
import { isMissingDatabaseObject } from "./absence";

describe("isMissingDatabaseObject", () => {
  it("says yes to the codes that mean the migration has not landed yet", () => {
    for (const code of ["42P01", "42883", "42703", "PGRST202", "PGRST204", "PGRST205"]) {
      expect(isMissingDatabaseObject({ code, message: "whatever" })).toBe(true);
    }
  });

  it("says NO to a revoked grant, which is the incident this check exists to stop hiding", () => {
    // retention-tick reported a purge that never happened as ok every day,
    // because "any error" was read as "not migrated yet".
    expect(
      isMissingDatabaseObject({
        code: "42501",
        message: "permission denied for function purge_old_telemetry",
      }),
    ).toBe(false);
  });

  it("says no to a failure with no code, because unknown is not absence", () => {
    expect(isMissingDatabaseObject({ message: "fetch failed" })).toBe(false);
    expect(isMissingDatabaseObject({})).toBe(false);
  });

  it("falls back to the message when the client dropped the code", () => {
    expect(isMissingDatabaseObject({ message: 'relation "telemetry" does not exist' })).toBe(true);
    expect(
      isMissingDatabaseObject({
        message: "Could not find the function public.purge_old_telemetry in the schema cache",
      }),
    ).toBe(true);
  });

  it("treats a null or absent error as no error at all", () => {
    expect(isMissingDatabaseObject(null)).toBe(false);
    expect(isMissingDatabaseObject(undefined)).toBe(false);
  });
});
