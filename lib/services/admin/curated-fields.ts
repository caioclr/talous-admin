import { apiClient } from "@/lib/services/client";
import type {
  CuratedFieldCatalogItem,
  CuratedFieldResponse,
  CuratedFieldUpsertRequest,
} from "./types";

/**
 * Conteudo curado por empresa — as primeiras rotas admin que gravam texto
 * destinado ao app do usuario final.
 *
 * Publicar e passo SEPARADO de salvar, e nao e cerimonia: `published_at` nulo e o
 * default no backend, entao nada chega a tela por existir na tabela. O admin
 * salva, confere o texto renderizado, e so entao publica.
 */

export function getCuratedFieldsCatalog() {
  return apiClient<CuratedFieldCatalogItem[]>("/admin/curated-fields/catalog");
}

export function listCuratedFields(companyId: string) {
  return apiClient<CuratedFieldResponse[]>(`/admin/curated-fields/companies/${companyId}`);
}

export function upsertCuratedField(
  companyId: string,
  fieldKey: string,
  body: CuratedFieldUpsertRequest,
) {
  return apiClient<CuratedFieldResponse>(
    `/admin/curated-fields/companies/${companyId}/${fieldKey}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
}

export function publishCuratedField(companyId: string, fieldKey: string, period?: string | null) {
  const query = period ? `?period=${encodeURIComponent(period)}` : "";
  return apiClient<CuratedFieldResponse>(
    `/admin/curated-fields/companies/${companyId}/${fieldKey}/publish${query}`,
    { method: "POST" },
  );
}

export function unpublishCuratedField(
  companyId: string,
  fieldKey: string,
  period?: string | null,
) {
  const query = period ? `?period=${encodeURIComponent(period)}` : "";
  return apiClient<void>(
    `/admin/curated-fields/companies/${companyId}/${fieldKey}/publish${query}`,
    { method: "DELETE" },
  );
}
