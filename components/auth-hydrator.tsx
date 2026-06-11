"use client";

import { useEffect, useRef } from "react";
import { refreshToken } from "@/lib/services/auth";
import { registerAuthFailureHandler } from "@/lib/services/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export function AuthHydrator() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const finishBoot = useAuthStore((state) => state.finishBoot);
  const booted = useRef(false);

  useEffect(() => {
    registerAuthFailureHandler(clearAuth);

    if (booted.current) {
      return;
    }

    booted.current = true;

    refreshToken()
      .then(({ user, access_token }) => setAuth(user, access_token))
      .catch(() => clearAuth())
      .finally(() => finishBoot());
  }, [clearAuth, finishBoot, setAuth]);

  return null;
}
