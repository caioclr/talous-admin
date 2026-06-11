import { getApiBaseUrl } from "@/lib/services/client";
import type { TokenResponse } from "@/lib/types";

const BASE_URL = getApiBaseUrl();

async function authRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(data?.detail ?? `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export function devLogin(email: string) {
  return authRequest<TokenResponse>("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function refreshToken() {
  return authRequest<TokenResponse>("/auth/refresh", {
    method: "POST",
  });
}

export function logout() {
  return authRequest<void>("/auth/logout", {
    method: "POST",
  });
}
