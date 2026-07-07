import { describe, it, expect } from "bun:test";
import {
  assembleHealth,
  evaluateCronPulse,
  CRON_STALE_AFTER_MS,
} from "./app-health";

const NOW = "2026-06-20T00:00:00.000Z";

describe("assembleHealth", () => {
  it("returns status ok + HTTP 200 when every dependency is ok", () => {
    const { body, httpStatus } = assembleHealth({ database: "ok", crons: "ok" }, NOW);
    expect(httpStatus).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks).toEqual({ worker: "ok", database: "ok", crons: "ok" });
  });

  it("returns status degraded + HTTP 503 when the database is down", () => {
    const { body, httpStatus } = assembleHealth({ database: "error", crons: "ok" }, NOW);
    expect(httpStatus).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("error");
  });

  it("returns status degraded + HTTP 503 when crons are stale (SW-6 floor)", () => {
    const { body, httpStatus } = assembleHealth({ database: "ok", crons: "error" }, NOW);
    expect(httpStatus).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.crons).toBe("error");
  });

  it("always reports the worker as ok (reaching this code means it is serving)", () => {
    expect(assembleHealth({ database: "ok", crons: "ok" }, NOW).body.checks.worker).toBe("ok");
    expect(assembleHealth({ database: "error", crons: "error" }, NOW).body.checks.worker).toBe(
      "ok",
    );
  });

  it("echoes the injected timestamp and a stable service id, and leaks nothing else", () => {
    const { body } = assembleHealth({ database: "error", crons: "error" }, NOW);
    expect(body.time).toBe(NOW);
    expect(body.service).toBe("cadence");
    // No message/detail/error fields that could leak internals on the public
    // endpoint. `release` is deliberate (SW-6 build stamp; already public via
    // the x-deployment-id response header).
    expect(Object.keys(body).sort()).toEqual(["checks", "release", "service", "status", "time"]);
  });

  it("carries the build stamp through when provided, null otherwise", () => {
    expect(assembleHealth({ database: "ok", crons: "ok" }, NOW).body.release).toBeNull();
    expect(assembleHealth({ database: "ok", crons: "ok" }, NOW, "deadbeef").body.release).toBe(
      "deadbeef",
    );
  });

  it("is pure: same inputs give the same output", () => {
    expect(assembleHealth({ database: "ok", crons: "ok" }, NOW)).toEqual(
      assembleHealth({ database: "ok", crons: "ok" }, NOW),
    );
  });
});

describe("evaluateCronPulse", () => {
  const nowMs = Date.parse(NOW);

  it("is ok when the pulse job ran within the staleness window", () => {
    const twoMinAgo = new Date(nowMs - 2 * 60_000).toISOString();
    expect(evaluateCronPulse(twoMinAgo, nowMs)).toBe("ok");
  });

  it("is ok exactly at the threshold boundary", () => {
    const atBoundary = new Date(nowMs - CRON_STALE_AFTER_MS).toISOString();
    expect(evaluateCronPulse(atBoundary, nowMs)).toBe("ok");
  });

  it("is error when the pulse job is older than the threshold", () => {
    const stale = new Date(nowMs - CRON_STALE_AFTER_MS - 1_000).toISOString();
    expect(evaluateCronPulse(stale, nowMs)).toBe("error");
  });

  it("is error when no run exists at all (crons never registered)", () => {
    expect(evaluateCronPulse(null, nowMs)).toBe("error");
  });

  it("is error on an unparseable timestamp", () => {
    expect(evaluateCronPulse("not-a-date", nowMs)).toBe("error");
  });

  it("honors a custom staleness threshold", () => {
    const threeMinAgo = new Date(nowMs - 3 * 60_000).toISOString();
    expect(evaluateCronPulse(threeMinAgo, nowMs, 2 * 60_000)).toBe("error");
    expect(evaluateCronPulse(threeMinAgo, nowMs, 5 * 60_000)).toBe("ok");
  });
});
