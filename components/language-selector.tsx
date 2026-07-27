"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Cookie lido por `i18n/request.ts` (sem prefixo de locale na URL). */
const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR = 60 * 60 * 24 * 365;

const OPTIONS: { code: string; label: string }[] = [
  { code: "pt-BR", label: "Português (BR)" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

/**
 * Grava o cookie de locale. Fica fora do componente de proposito: a escrita em
 * `document.cookie` e um efeito colateral no DOM global e o React Compiler
 * (regra `react-hooks/immutability`) proibe mutar bindings externos dentro do
 * corpo do componente/hook.
 */
function writeLocaleCookie(code: string) {
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function selectLocale(code: string) {
    if (code === locale) return;
    // Grava o cookie e revalida (o servidor relê o cookie em i18n/request.ts).
    writeLocaleCookie(code);
    startTransition(() => router.refresh());
  }

  const current = OPTIONS.find((o) => o.code === locale) ?? OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={pending}
          data-testid="language-selector"
          aria-label="Idioma"
          title="Idioma"
        >
          <Languages className="size-3.5" />
          {current.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Idioma</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.code}
            data-testid={`language-option-${o.code}`}
            onClick={() => selectLocale(o.code)}
            className="flex items-center justify-between gap-3"
          >
            {o.label}
            {o.code === locale && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
