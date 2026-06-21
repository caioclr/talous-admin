"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { devLogin } from "@/lib/services/auth";
import { useAuthStore } from "@/lib/stores/auth-store";

const loginSchema = z.object({
  email: z.email("Informe um e-mail valido."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/cvm";
  const setAuth = useAuthStore((state) => state.setAuth);
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@talous.ai",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginValues) => devLogin(values.email),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      toast.success("Sessao administrativa iniciada.");
      router.replace(nextPath);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isReady, nextPath, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded border border-primary/20 bg-accent-dim text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Login de desenvolvimento
            </h1>
            <p className="font-mono text-[10px] text-muted-foreground">POST /auth/dev-login</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-border bg-card p-5">
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
          >
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@talous.ai"
                className="h-8 bg-background text-xs"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="font-mono text-[10px] text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : (
                <p className="font-mono text-[10px] text-muted-foreground">
                  Usa o endpoint `POST /auth/dev-login` do backend.
                </p>
              )}
            </div>

            <Button type="submit" disabled={loginMutation.isPending} className="w-full">
              {loginMutation.isPending ? "Entrando..." : "Entrar no admin"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground/60">
          Autenticacao inicial do painel admin antes da fase de Google OAuth.
        </p>
      </div>
    </div>
  );
}
