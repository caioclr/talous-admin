import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

/**
 * next-intl SEM i18n routing: o locale vem de um **cookie** (`NEXT_LOCALE`),
 * não de prefixo na URL — as rotas planas do admin são preservadas. Default
 * `pt-BR`. Locales suportados: pt-BR, en, es. Mesmo padrão do talous-frontend.
 */
export const LOCALES = ["pt-BR", "en", "es"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "pt-BR";
export const LOCALE_COOKIE = "NEXT_LOCALE";

function isSupported(value: string | undefined): value is AppLocale {
  return value != null && (LOCALES as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  const locale: AppLocale = isSupported(cookieValue) ? cookieValue : DEFAULT_LOCALE;

  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
