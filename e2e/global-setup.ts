import { request } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const ROUTES_TO_WARM = ["/login", "/cvm", "/cvm/companies", "/cvm/snapshots", "/cvm/sector-mapping"];

/**
 * Pre-compile dev routes so individual tests don't pay the first-hit cost.
 * Without this, parallel workers race against Next.js's on-demand compiler
 * and time out on `waitForURL`.
 */
export default async function globalSetup() {
  const ctx = await request.newContext({ baseURL: BASE_URL });
  for (const route of ROUTES_TO_WARM) {
    try {
      await ctx.get(route, { timeout: 60_000 });
    } catch {
      // best-effort warmup; tests will surface real failures
    }
  }
  await ctx.dispose();
}
