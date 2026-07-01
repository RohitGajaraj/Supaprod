// BYO-P5 P5a-poc: one-off runner that exercises the deno-deploy adapter
// (provisionApp -> deploy -> readHealth -> readDeployments) against a real
// Deno Deploy account. Not a permanent tool, not wired into any build step.
// Requires DENO_DEPLOY_TOKEN in the environment. Never logs the token itself.
//
// Run: bun run --env-file="<path to .env with DENO_DEPLOY_TOKEN>" scripts/deno-deploy-poc.ts

import { denoDeployProvider } from "../src/lib/hosting/deno-deploy.server";
import type { AppRuntimeRef } from "../src/lib/hosting/provider";

async function main() {
  if (!denoDeployProvider.available) {
    console.error("DENO_DEPLOY_TOKEN not set, aborting.");
    process.exit(1);
  }

  const ref: AppRuntimeRef = {
    workspaceId: "poc-workspace",
    productId: "poc-product",
    hostedAppId: "poc-test-2",
  };

  console.log("1. provisionApp...");
  const handle = await denoDeployProvider.provisionApp(ref, { dedicatedDb: false });
  console.log("   ok:", handle);

  console.log("2. deploy...");
  const deployResult = await denoDeployProvider.deploy(
    handle,
    {
      files: [
        {
          path: "index.html",
          content:
            "<!DOCTYPE html><html><body><h1>Hello from AppRuntimeProvider (deno-deploy PoC)</h1></body></html>",
        },
      ],
    },
    {},
  );
  console.log("   result:", deployResult);

  console.log("3. readDeployments...");
  const deployments = await denoDeployProvider.readDeployments(handle);
  console.log("   ", deployments);

  console.log("4. readHealth...");
  const health = await denoDeployProvider.readHealth(handle);
  console.log("   ", health);

  console.log("\nDone. If readHealth.healthy is true, the interface's shape works end to end.");
}

main().catch((err) => {
  console.error("PoC failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
