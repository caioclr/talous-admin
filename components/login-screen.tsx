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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <CardTitle>Login de desenvolvimento</CardTitle>
              <CardDescription>
                Autenticacao inicial do painel admin antes da fase de Google OAuth.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@talous.ai"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Usa o endpoint `POST /auth/dev-login` do backend.
                </p>
              )}
            </div>

            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Entrando..." : "Entrar no admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
