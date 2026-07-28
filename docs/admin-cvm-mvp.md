# Bootstrap do talous-admin — MVP CVM completo

> ## 📌 DOCUMENTO HISTÓRICO — não descreve o painel atual
>
> **Congelado em 2026-04-29. Superado em 2026-07-27.**
>
> Este é o **plano de bootstrap** do repositório, escrito quando o `talous-admin`
> ainda estava vazio. Ele foi executado e a entrega está concluída há muito tempo.
> Mantido **sem reescrita** porque registra o *porquê* das decisões fundadoras
> (stack espelhando o `talous-frontend`, dev login antes de OAuth, shadcn fresh,
> porta 6001, escopo dos 12 endpoints do Sprint 1).
>
> **Por que banner em vez de atualizar a tabela de status:** atualizar
> transformaria um plano de execução num inventário do painel — papel que já é
> de [`admin-panel.md`](./admin-panel.md), que é a **doc viva**. Manter dois
> inventários garante drift. Aqui fica o passado; lá fica o presente.
>
> **O que abaixo já não vale para o código de hoje:**
>
> - "O repositório está hoje vazio" — contexto de abril/2026.
> - Route groups `(auth)` / `(admin)` e segmentos dinâmicos `[cdCvm]` / `[id]`:
>   **nunca ficaram no repo**. A convenção atual é **sem route groups e sem
>   segmentos dinâmicos**; detalhe é `.../detail/page.tsx` + query string
>   (`/cvm/companies/detail?cd_cvm=9512`).
> - O painel foi muito além do MVP: hoje há ~48 rotas cobrindo IPE, ITR/DFP, FRE,
>   FCA, ICBGC, recompras, VLMO, composição de capital, participantes, alertas,
>   jobs/workers e um fluxo genérico de moderação por `(report_type, ref)`.
> - Scripts: `lint` hoje é `eslint .` (não `next lint`) e `test` é `vitest run`.
>   Há também `e2e` / `e2e:real` (Playwright), inexistentes à época.
> - `@tanstack/react-query-devtools` não é dependência do projeto.
> - i18n (next-intl por cookie) não existia e não aparece aqui.
>
> **Para o estado atual, leia [`admin-panel.md`](./admin-panel.md).**

## Status da implementação (2026-04-29)

> Convenção: ✅ implementado · 🟡 parcial · ⏳ pendente · ➕ entregue além do escopo original.

**Resumo**: o MVP do Sprint 1 (12 endpoints CVM Registry) está ✅ entregue na íntegra. Adicionalmente, ➕ foram implementadas as telas dos Sprints 2 (IPE) e 3 (ITR/DFP) que estavam originalmente fora do escopo. Não verificável daqui: CORS no backend e smoke test manual ponta-a-ponta.

| Bloco | Status |
|---|---|
| Bootstrap (Next.js 16.1.5, React 19.2.3, TS 5.6, Tailwind 4, vitest, eslint) | ✅ |
| shadcn/ui (alert-dialog, badge, button, card, dialog, dropdown-menu, input, label, select, separator, skeleton, table, tabs, textarea, tooltip) | ✅ (sem `sheet`/`form`/`sonner` shadcn — usa `sonner` direto) |
| Camada HTTP (`lib/services/client.ts`, refresh + queue, 401 retry) | ✅ |
| Auth (`lib/services/auth.ts`: devLogin, refreshToken, logout) | ✅ |
| Auth store + hydrator (Zustand + AuthHydrator) | ✅ |
| Tipos espelhando schemas backend (`lib/services/admin/types.ts`, 267 linhas) | ✅ |
| Services CVM Registry tipados (`lib/services/admin/cvm-registry.ts`, 12 fns) | ✅ |
| Layout, AdminShell (sidebar com IPE/ITR-DFP), AdminGuard, Providers | ✅ |
| Componentes reutilizáveis (DataTable + teste, PaginationControls, JsonViewer, login-screen, formatters) | ✅ |
| Rota `/login` (route group `(auth)`) | ✅ |
| Telas Sprint 1 — dashboard, companies (lista + detalhe), snapshots (lista + detalhe), sector-mapping | ✅ |
| Services + telas IPE (Sprint 2) | ➕ |
| Services + telas ITR/DFP (Sprint 3) | ➕ |
| CORS backend incluindo `localhost:6001` | ⏳ não verificável aqui |
| Smoke test manual ponta-a-ponta | ⏳ depende do usuário |

---

## Context

O repositório `talous-admin/` está hoje vazio (apenas `.git`, `CLAUDE.md` e `docs/admin-panel.md`) — o painel administrativo do Talous AI ainda não existe.

O **backend já tem 22 endpoints prontos** sob `/api/v1/admin/cvm/*` (verificado em `http://localhost:8001/docs`):
- **Sprint 1 — Cadastro** (12 endpoints): `registry/*`, `companies/*`, `sector-mapping/*` — escopo deste MVP
- **Sprint 2 — IPE** (6 endpoints): `ipe/disclosures*`, `ipe/categories`, `ipe/sync-status`, `ipe/sync` — fora do escopo
- **Sprint 3 — ITR/DFP** (4 endpoints): `itr-dfp/filings`, `itr-dfp/account-lines/{cd_cvm}`, `itr-dfp/reconciliation/{cd_cvm}/{reference_date}`, `itr-dfp/sync` — fora do escopo

Referências de código: [admin/cvm_registry.py](../../talous-backend/app/api/v1/admin/cvm_registry.py) e [api-admin.md](../../talous-backend/docs/Architecture/api-admin.md). A documentação canônica do backend explicita "Frontend consumidor: talous-admin (Next.js)" — então o cliente desses endpoints é exatamente este projeto a ser criado.

**Objetivo desta primeira entrega**: bootstrapar o projeto Next.js + autenticação dev + consumir todos os 12 endpoints CVM existentes, entregando ao operador uma ferramenta funcional para inspecionar dados CVM (lista/detalhe de empresas, snapshots, histórico, mudanças, mapeamento de setores, trigger de sync).

**Decisões alinhadas com o usuário**:
- Stack: Next.js 16.1.x standalone na pasta `talous-admin/` (porta 6001)
- Escopo MVP: 12 endpoints CVM completos (Sprint 1 backend)
- Auth: dev login (email) primeiro — Google OAuth fica para fase posterior
- UI: shadcn/ui inicializado fresh (não copiar do talous-frontend)

---

## Stack e versões

Espelhar o `talous-frontend` ([package.json](../../talous-frontend/package.json)):

| Lib | Versão | Uso |
|---|---|---|
| next | 16.1.x | App Router |
| react / react-dom | 19.x | Framework |
| typescript | 5.6+ | Strict mode |
| tailwindcss | 4.2.x | CSS-first (PostCSS) |
| @radix-ui/* | latest | Primitivos shadcn |
| lucide-react | 0.577+ | Ícones |
| class-variance-authority | 0.7+ | Variantes |
| tailwind-merge / clsx | latest | `cn()` helper |
| @tanstack/react-query | 5.90+ | Server state |
| @tanstack/react-query-devtools | 5.91+ | Dev only |
| zustand | 5.0+ | Auth store |
| react-hook-form + zod + @hookform/resolvers | 7.71+ / 4.3+ / 5.2+ | Form de mapping |
| vitest + @testing-library/react + jsdom + msw | latest | Testes |

Gerenciador: `npm` (mesmo do frontend). Alias `@/* → ./*` no `tsconfig.json`. ESLint via `next lint`.

---

## Estrutura de pastas

```
talous-admin/
├── app/
│   ├── layout.tsx                   # Root: Providers + QueryClient
│   ├── globals.css                  # Tailwind 4 (@import)
│   ├── page.tsx                     # Redirect → /cvm/companies (ou /login)
│   ├── (auth)/
│   │   └── login/page.tsx           # Form dev login (email)
│   └── (admin)/
│       ├── layout.tsx               # AdminShell: sidebar + topbar + auth guard
│       ├── cvm/
│       │   ├── page.tsx             # Dashboard /cvm → SyncStatus + atalhos
│       │   ├── companies/
│       │   │   ├── page.tsx         # Lista paginada
│       │   │   └── [cdCvm]/page.tsx # Detalhe + tabs (info | history | changes)
│       │   ├── snapshots/
│       │   │   ├── page.tsx         # Lista paginada de snapshots
│       │   │   └── [id]/page.tsx    # Detalhe (com raw_data JSONB)
│       │   └── sector-mapping/
│       │       └── page.tsx         # Lista + form upsert + unmapped + delete
├── components/
│   ├── ui/                          # shadcn (button, card, table, input, select, dialog, badge, tabs, separator, sheet, dropdown-menu, tooltip, skeleton, toast)
│   ├── admin-shell.tsx              # Sidebar + topbar + outlet
│   ├── auth-hydrator.tsx            # Refresh on mount (porta de talous-frontend)
│   ├── data-table.tsx               # Tabela genérica paginada (cabeçalho, paginação, empty/loading)
│   ├── pagination.tsx               # Controles ChevronLeft/Right + indicador
│   └── json-viewer.tsx              # Render de raw_data (snapshot detail)
├── lib/
│   ├── services/
│   │   ├── client.ts                # apiClient (fetch + auth + auto-refresh)
│   │   ├── auth.ts                  # devLogin, refreshToken, logout
│   │   └── admin/
│   │       ├── cvm-registry.ts      # 12 endpoints tipados
│   │       └── types.ts             # Tipos espelhando schemas Pydantic
│   ├── stores/
│   │   └── auth-store.ts            # Zustand: user, accessToken
│   ├── query-client.ts              # QueryClient com defaults (staleTime 60s, retry 1)
│   └── utils.ts                     # cn()
├── public/
├── .env.local                       # NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
├── postcss.config.mjs               # @tailwindcss/postcss
├── tsconfig.json                    # paths "@/*": ["./*"], strict
├── next.config.ts
├── components.json                  # config shadcn
├── package.json
└── README.md
```

Convenção de route groups (`(auth)` e `(admin)`) replica o padrão de [talous-frontend/app](../../talous-frontend/app/(app)).

---

## Endpoints e telas (mapeamento 1:1)

Todos os endpoints já existem em [admin/cvm_registry.py](../../talous-backend/app/api/v1/admin/cvm_registry.py). Schemas em [schemas/admin/cvm_registry.py](../../talous-backend/app/api/v1/schemas/admin/cvm_registry.py).

| # | Endpoint backend | Tela admin | Função na UI |
|---|---|---|---|
| 1 | GET `/admin/cvm/registry/sync-status` | `/cvm` (dashboard) | KPIs: última sync, hash, total snapshots, contagens por situação, setores não mapeados |
| 12 | POST `/admin/cvm/registry/sync` | `/cvm` (dashboard) | Botão "Sincronizar agora" (com confirmação) → mostra `task_id` em toast |
| 4 | GET `/admin/cvm/companies` | `/cvm/companies` | Tabela paginada com filtros: situation, category, market_type, sector_slug, is_active, search (nome/CNPJ) |
| 5 | GET `/admin/cvm/companies/{cd_cvm}` | `/cvm/companies/[cdCvm]` (aba "Info") | Detalhe: status CVM, datas, controlador, setor, tickers |
| 6 | GET `/admin/cvm/companies/{cd_cvm}/history` | `/cvm/companies/[cdCvm]` (aba "Histórico") | Timeline de snapshots da empresa |
| 7 | GET `/admin/cvm/companies/{cd_cvm}/changes` | `/cvm/companies/[cdCvm]` (aba "Mudanças") | Lista de eventos de mudança entre snapshots |
| 2 | GET `/admin/cvm/registry/snapshots` | `/cvm/snapshots` | Tabela paginada (filtros: cd_cvm, captured_at_from/to) |
| 3 | GET `/admin/cvm/registry/snapshots/{id}` | `/cvm/snapshots/[id]` | Detalhe completo + visualizador `raw_data` JSONB |
| 8 | GET `/admin/cvm/sector-mapping` | `/cvm/sector-mapping` (lista) | Tabela: cvm_setor → sector_slug interno |
| 9 | POST `/admin/cvm/sector-mapping` | `/cvm/sector-mapping` (drawer/dialog) | Form upsert (RHF + Zod): cvm_setor_atividade, internal_sector_slug, notes |
| 10 | DELETE `/admin/cvm/sector-mapping/{cvm_setor}` | `/cvm/sector-mapping` (action) | Botão deletar com `AlertDialog` de confirmação |
| 11 | GET `/admin/cvm/sector-mapping/unmapped` | `/cvm/sector-mapping` (seção topo) | Card "Setores pendentes" com sample_company_names; clique pré-preenche o form |

---

## Implementação — passos sequenciais

### 1. Bootstrap do projeto ✅

- `npx create-next-app@latest talous-admin` (TS, App Router, Tailwind, ESLint, alias `@/*`, sem src/) — executar dentro do diretório, lidando com `.git` existente.
- Atualizar `package.json` com as versões pinadas (espelhar [talous-frontend/package.json](../../talous-frontend/package.json)).
- Configurar `tsconfig.json` com `paths`, `strict: true`.
- Configurar Tailwind 4: `app/globals.css` com `@import "tailwindcss"` e tokens `:root` / `.dark` (copiar tokens de [globals.css](../../talous-frontend/app/globals.css)).
- Configurar dark mode default via class no `<html>`.
- `.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
  ```

### 2. shadcn/ui setup ✅

- `npx shadcn@latest init` (style: default, base color: slate ou zinc, RSC: yes).
- `npx shadcn@latest add button card table input select dialog alert-dialog badge tabs separator sheet dropdown-menu tooltip skeleton sonner label form`.
- Validar que `components.json` aponta para `components/ui` e usa o alias `@/`.

### 3. Camada de serviços HTTP ✅

**`lib/services/client.ts`** — replicar [talous-frontend/lib/services/client.ts](../../talous-frontend/lib/services/client.ts):
- `apiClient<T>(path, { params, method, body, headers })` baseado em `fetch`.
- Token in-memory (`_accessToken`) + Bearer header.
- `credentials: "include"` para cookie httpOnly do refresh.
- Retry automático em 401 → POST `/auth/refresh` → retry da request original.
- `setAccessToken()` exportado para o store integrar.
- `registerAuthFailureHandler()` para limpar estado e redirect `/login`.

**`lib/services/auth.ts`** — endpoints confirmados no OpenAPI:
- `devLogin(email: string)` → POST `/auth/dev-login` (existe).
- `refreshToken()` → POST `/auth/refresh`.
- `logout()` → POST `/auth/logout`.
- `loginWithGoogle(idToken)` → POST `/auth/google` (futuro).

**`lib/services/admin/cvm-registry.ts`** — funções tipadas para os 12 endpoints. Exemplo:
```ts
export async function listAdminCompanies(params: ListCompaniesParams) {
  return apiClient<AdminPagedResponse<AdminCompanySummary>>("/admin/cvm/companies", { params });
}
```

**`lib/services/admin/types.ts`** — espelhar 1:1 os Pydantic schemas (`AdminCompanySummary`, `AdminCompanyDetail`, `CVMSnapshotSummary`, `CVMSnapshotDetail`, `RegistryChangeEventResponse`, `CVMSectorMappingRequest/Response`, `UnmappedSectorResponse`, `SyncStatusResponse`, `TriggerSyncResponse`, `PaginationMeta`, `AdminPagedResponse<T>`).

### 4. Auth store + hydrator ✅

**`lib/stores/auth-store.ts`** — Zustand com `user`, `accessToken`, `isAuthenticated`, `setAuth`, `clearAuth`. No `setAuth`, chamar `setAccessToken()` do client.

**`components/auth-hydrator.tsx`** — `"use client"`, executa `refreshToken()` na primeira render (ref para evitar duplicatas) e registra o failure handler. Replica [talous-frontend/components/auth-hydrator.tsx](../../talous-frontend/components/auth-hydrator.tsx).

### 5. Layout e navegação ✅

**`app/layout.tsx`** — root com `<html lang="pt-BR" className="dark">`, `<body>`, Providers (QueryClientProvider, sonner Toaster).

**`app/(admin)/layout.tsx`** — guard de autenticação:
- Se não autenticado → redirect `/login`.
- Renderiza `<AdminShell>` com sidebar.

**`components/admin-shell.tsx`**:
- Sidebar fixa (collapsible) com seções: "Dados CVM" (Dashboard, Empresas, Snapshots, Mapeamento de Setores). Estrutura preparada para adicionar futuras seções (Usuários, Planos, Score, Jobs).
- Topbar: nome do admin + dropdown logout.

### 6. Componentes reutilizáveis ✅

**`components/data-table.tsx`** — tabela genérica recebendo `columns`, `data`, `pagination`, `onPageChange`, `loading`, `emptyMessage`. Usa `<Table>` do shadcn + skeleton em loading.

**`components/pagination.tsx`** — botões ChevronLeft/Right + "Página X de Y · N itens".

**`components/json-viewer.tsx`** — render formatado de `raw_data` (`<pre>` com syntax minimal, ou react-json-view se quisermos polish — começar simples).

### 7. Telas (ordem sugerida)

1. ✅ **`/login`** — Form com email; submit chama `devLogin` e redireciona para `/cvm`. (`app/(auth)/login/page.tsx` + `components/login-screen.tsx`)
2. ✅ **`/cvm` (dashboard)** — `useQuery` em `/sync-status`. Cards: última captura, hash (truncado), total snapshots, contagem por situação, alerta de setores não mapeados. Botão "Sincronizar agora" com `AlertDialog` + toast. (`app/(admin)/cvm/page.tsx`, 195 linhas)
3. ✅ **`/cvm/companies`** — `DataTable` com colunas, filtros e search. (`app/(admin)/cvm/companies/page.tsx`, 195 linhas)
4. ✅ **`/cvm/companies/[cdCvm]`** — header + `<Tabs>` Info/Histórico/Mudanças. (`app/(admin)/cvm/companies/[cdCvm]/page.tsx`, 329 linhas)
5. ✅ **`/cvm/snapshots`** — `DataTable` com filtros cd_cvm e captured_at. (`app/(admin)/cvm/snapshots/page.tsx`, 128 linhas)
6. ✅ **`/cvm/snapshots/[id]`** — detalhes agrupados + `<JsonViewer>` para `raw_data`. (`app/(admin)/cvm/snapshots/[id]/page.tsx`, 120 linhas)
7. ✅ **`/cvm/sector-mapping`** — pendentes + tabela de mapeamentos + form RHF/Zod + delete com confirmação. (`app/(admin)/cvm/sector-mapping/page.tsx`, 289 linhas)

➕ **Telas adicionais entregues** (Sprint 2/3, fora do escopo original):
- `/cvm/ipe` (dashboard IPE), `/cvm/ipe/disclosures/[id]`, `/cvm/ipe/companies/[cdCvm]` — services em `lib/services/admin/cvm-ipe.ts` (+ teste)
- `/cvm/itr-dfp` (dashboard ITR/DFP), `/cvm/itr-dfp/companies/[cdCvm]` — services em `lib/services/admin/cvm-itr-dfp.ts` (+ teste)

### 8. Configuração de CORS no backend ⏳ (verificar)

Adicionar `http://localhost:6001` em `cors_origins` do backend ([app/config.py:36](../../talous-backend/app/config.py)) — pode ser via env var `CORS_ORIGINS` ou edit direto no `Settings`. Validar antes de iniciar dev.

### 9. Scripts e dev ✅

- `package.json`:
  ```json
  "scripts": {
    "dev": "next dev --webpack -p 6001",
    "build": "next build --webpack",
    "start": "next start -p 6001",
    "lint": "next lint",
    "test": "vitest"
  }
  ```

### 10. Testes mínimos 🟡

- ✅ Setup: `vitest.config.ts` (jsdom), `vitest.setup.ts`.
- ✅ `components/data-table.test.tsx`.
- ✅ `lib/services/admin/cvm-registry.test.ts`, `cvm-ipe.test.ts`, `cvm-itr-dfp.test.ts`.
- ⏳ Teste do `auth-store` ainda pendente.

---

## Critical files (referenciar/replicar)

**Do talous-frontend (modelo)**:
- [package.json](../../talous-frontend/package.json) — versões
- [lib/services/client.ts](../../talous-frontend/lib/services/client.ts) — apiClient com refresh
- [lib/stores/auth-store.ts](../../talous-frontend/lib/stores/auth-store.ts) — Zustand auth
- [components/auth-hydrator.tsx](../../talous-frontend/components/auth-hydrator.tsx)
- [app/(app)/layout.tsx](../../talous-frontend/app/(app)/layout.tsx) — padrão route group + shell
- [app/(app)/ranking/page.tsx](../../talous-frontend/app/(app)/ranking/page.tsx) — referência tabela paginada
- [lib/query-client.ts](../../talous-frontend/lib/query-client.ts)

**Do talous-backend (consumir/aderir)**:
- [app/api/v1/admin/cvm_registry.py](../../talous-backend/app/api/v1/admin/cvm_registry.py) — 12 endpoints
- [app/api/v1/schemas/admin/cvm_registry.py](../../talous-backend/app/api/v1/schemas/admin/cvm_registry.py) — schemas a espelhar em TS
- [app/api/v1/schemas/admin/common.py](../../talous-backend/app/api/v1/schemas/admin/common.py) — `AdminPagedResponse<T>`
- [app/core/dependencies.py:46](../../talous-backend/app/core/dependencies.py) — `get_current_admin`
- [app/api/v1/auth.py](../../talous-backend/app/api/v1/auth.py) — endpoints de auth (validar nome do dev login)
- [app/config.py](../../talous-backend/app/config.py) — `cors_origins`
- [docs/Architecture/api-admin.md](../../talous-backend/docs/Architecture/api-admin.md) — convenções

**Do talous-admin (existente)**:
- [docs/admin-panel.md](./admin-panel.md)
- [CLAUDE.md](../CLAUDE.md)

---

## Verificação end-to-end

1. **Backend rodando**:
   ```bash
   cd ../talous-backend && uvicorn app.main:app --reload --port 8001
   ```
   Confirmar que `http://localhost:8001/docs` mostra a tag `admin-cvm` com 12 endpoints. Garantir que `localhost:6001` está em CORS.

2. **Banco com dados de teste**:
   ```bash
   python scripts/seed_companies.py
   python scripts/sync_cvm_company_registry.py  # popula cvm_company_registry e atualiza companies
   ```
   Garantir um usuário admin: `UPDATE users SET is_admin = true WHERE email = 'caioclr2@gmail.com';`

3. **Admin rodando**:
   ```bash
   cd talous-admin && npm install && npm run dev
   ```
   Abrir `http://localhost:6001`.

4. **Smoke test manual** (golden path):
   - Login com email do admin → redirect para `/cvm` → ver KPIs e contagem por situação.
   - Clicar "Sincronizar agora" → confirmar → toast com `task_id`.
   - `/cvm/companies` → tabela carrega; aplicar filtro `situation=ATIVO`, `search=Petro` → resultados filtrados; paginar.
   - Clicar Petrobras → `/cvm/companies/9512` → ver Info, Histórico (≥1 snapshot), Mudanças (vazio até 2ª sync, OK).
   - `/cvm/snapshots` → lista carrega; abrir detalhe → ver `raw_data` formatado.
   - `/cvm/sector-mapping` → ver pendentes; clicar "Mapear" → form pré-preenchido → salvar → desaparece da lista pendente, aparece nos mapeamentos. Editar e deletar funcionam com confirmação.

5. **Edge cases**:
   - Acessar `/cvm` sem login → redirect `/login`.
   - Token expirado → auto-refresh transparente.
   - Logout → redirect `/login`, token limpo.
   - Filtros inválidos no backend (page_size > 200) → exibir erro do toast sem crash.
   - Endpoint 403 (usuário não-admin) → mensagem clara e logout.

6. **Build**:
   ```bash
   npm run build && npm run lint
   ```

---

## Fora do escopo desta entrega (próximas iterações)

- ⏳ Google OAuth (substituir dev login)
- ➕ ~~**Sprint 2 — IPE**~~ — implementado nesta mesma fase (services + telas)
- ➕ ~~**Sprint 3 — ITR/DFP**~~ — implementado nesta mesma fase (services + telas)
- ⏳ Páginas de Usuários, Planos, Score, Jobs, AI Usage (admin-panel.md itens 1-3, 5-8)
- ⏳ Endpoint GET `/admin/cvm/tasks/{task_id}` para acompanhar progresso de sync (mencionado em api-admin.md §8.3 — backend ainda não tem)
- ⏳ Audit log (`admin_audit_log` — planejado para sprint futura)
- ⏳ Rate limiting
