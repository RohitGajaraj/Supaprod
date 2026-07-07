/**
 * BD-1, resolve the active `BuildDriver`. Mirrors `resolveDelegateProvider`'s
 * shape (delegate/openhands.server.ts): a `preferred` id wins when its adapter
 * is wired AND available, else the `BUILD_DRIVER` env var, else the 'native'
 * floor, so engine choice is config, and a misconfigured/unavailable external
 * engine degrades to the in-house loop instead of failing the dispatch.
 *
 * Sync on purpose (like the delegate resolver): an adapter whose `available()`
 * returns a Promise is treated as not-immediately-available here; both wired
 * adapters today report synchronously.
 */
import { normalizeBuildDriverId, type BuildDriver } from "./driver";
import { nativeBuildDriver } from "./native.server";
import { openHandsBuildDriver } from "./openhands.server";

/** Adapters with a live implementation today (each still gated by its own `available()`). */
const WIRED_BUILD_DRIVERS: readonly BuildDriver[] = [nativeBuildDriver, openHandsBuildDriver];

export function resolveBuildDriver(preferred?: string | null): BuildDriver {
  const id =
    normalizeBuildDriverId(preferred) ??
    normalizeBuildDriverId(process.env.BUILD_DRIVER) ??
    "native";
  const match = WIRED_BUILD_DRIVERS.find((drv) => drv.id === id && drv.available() === true);
  return match ?? nativeBuildDriver;
}
