import { getRequestConfig } from "next-intl/server";

import messages from "../messages/pt-BR.json";

/**
 * Locale unico: **pt-BR**. O painel admin nao e internacionalizado (ADR-002).
 * Nao ha mais leitura de cookie nem catalogos `en`/`es`; a maquinaria inteira
 * sai em seguida (Spec 003, T012).
 */
export const DEFAULT_LOCALE = "pt-BR";

export default getRequestConfig(async () => ({
  locale: DEFAULT_LOCALE,
  messages,
}));
