import type { ApiError, TokenResponse } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;
let isRefreshing = false;
const refreshQueue: Array<(token: string | null) => void> = [];

export function getApiBaseUrl() {
  return BASE_URL;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function registerAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

function handleAuthFailure() {
  accessToken = null;
  onAuthFailure?.();
}

async function attemptRefresh() {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as TokenResponse;
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

interface FetchOptions extends RequestInit {
  params?: object;
  isRetry?: boolean;
}

export async function apiClient<T>(
  path: string,
  options: FetchOptions = {},
) {
  const { params, isRetry, ...fetchOptions } = options;
  let url = `${BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean")
      ) {
        searchParams.set(key, String(value));
      }
    }

    const queryString = searchParams.toString();

    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers = new Headers(fetchOptions.headers);
  const hasBody = fetchOptions.body !== undefined;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (response.status === 401 && !isRetry) {
    let newToken: string | null;

    if (isRefreshing) {
      newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
    } else {
      isRefreshing = true;
      newToken = await attemptRefresh();
      isRefreshing = false;
      refreshQueue.splice(0).forEach((resolve) => resolve(newToken));
    }

    if (!newToken) {
      handleAuthFailure();
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    accessToken = newToken;

    return apiClient<T>(path, { ...options, isRetry: true });
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const data = (await response.json()) as ApiError;
      message = data.detail ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
