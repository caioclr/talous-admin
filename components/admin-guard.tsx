"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isReady, pathname, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="panel-surface flex w-full max-w-sm flex-col gap-4 p-6 text-center">
          <div className="h-10 w-10 place-self-center rounded-full border border-border/70 bg-primary/10" />
          <div>
            <p className="text-lg font-semibold text-foreground">Carregando sessão</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Validando credenciais administrativas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
