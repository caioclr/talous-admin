import type { Page, Route } from "@playwright/test";

export const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "admin@talous.ai",
  name: "admin",
  plan: "advanced",
};

export const MOCK_ACCESS_TOKEN = "mocked-access-token";

export interface TokenResponseBody {
  access_token: string;
  token_type: string;
  user: typeof MOCK_USER;
}

export function tokenResponse(overrides: Partial<TokenResponseBody> = {}): TokenResponseBody {
  return {
    access_token: MOCK_ACCESS_TOKEN,
    token_type: "bearer",
    user: MOCK_USER,
    ...overrides,
  };
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export interface MockAuthOptions {
  authenticated?: boolean;
  devLogin?: { status?: number; body?: unknown };
}

/**
 * Default API mocks for auth flows. Call once per test before navigation.
 * - authenticated=false (default): /auth/refresh returns 401 so AuthHydrator
 *   transitions to "needs login" state.
 * - authenticated=true: /auth/refresh returns a valid token, simulating an
 *   active session.
 */
export async function mockAuth(page: Page, options: MockAuthOptions = {}) {
  const { authenticated = false, devLogin } = options;

  await page.route("**/api/v1/auth/refresh", async (route) => {
    if (authenticated) {
      await fulfillJson(route, 200, tokenResponse());
    } else {
      await fulfillJson(route, 401, { detail: "Invalid or expired refresh token" });
    }
  });

  await page.route("**/api/v1/auth/dev-login", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const status = devLogin?.status ?? 200;
    const body = devLogin?.body ?? tokenResponse();
    await fulfillJson(route, status, body);
  });

  await page.route("**/api/v1/auth/logout", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
}

/**
 * Stubs all `/admin/*` GETs with a minimal payload so post-login pages can
 * render without unmocked-network noise during auth-flow tests.
 */
export async function mockAdminEndpointsEmpty(page: Page) {
  await page.route("**/api/v1/admin/**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = route.request().url();
    let body: unknown = { items: [], pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 } };

    if (url.includes("/registry/sync-status")) {
      body = {
        last_captured_at: null,
        last_file_hash: null,
        total_snapshots: 0,
        situation_counts: {},
        unmapped_sectors_count: 0,
      };
    } else if (url.includes("/ipe/sync-status")) {
      body = {
        last_captured_at: null,
        total_disclosures: 0,
        pending_notification_count: 0,
        by_signal_classification: {},
        last_30_days_count: 0,
      };
    } else if (url.includes("/sector-mapping/unmapped") || url.includes("/categories")) {
      body = [];
    }

    await fulfillJson(route, 200, body);
  });
}

/** Convenience: assert the body of POST /auth/dev-login received by the mock. */
export function captureDevLoginRequests(page: Page) {
  const requests: Array<{ url: string; body: unknown }> = [];

  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/auth/dev-login")
    ) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(request.postData() ?? "null");
      } catch {
        parsed = request.postData();
      }
      requests.push({ url: request.url(), body: parsed });
    }
  });

  return requests;
}
