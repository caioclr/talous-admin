# talous-admin

Painel administrativo interno do **Talous AI**. Next.js 16 (App Router) + React 19
+ TypeScript strict + Tailwind 4 + shadcn/Radix.

Hoje o painel cobre **operação e moderação dos dados CVM** (empresas, snapshots
cadastrais, IPE, ITR/DFP, FRE, FCA, ICBGC, recompras, VLMO, composição de
capital, participantes de mercado, alertas e jobs). O escopo de usuários,
planos, score/DCF e uso de AI ainda não tem tela.

- **Escopo e mapa de telas:** [`docs/admin-panel.md`](docs/admin-panel.md)
- **Contexto para agentes:** [`CLAUDE.md`](CLAUDE.md)
- **Contrato da API admin (canônico):**
  [`../talous-backend/docs/Architecture/admin-api-reference.md`](../talous-backend/docs/Architecture/admin-api-reference.md)

---

## Requisitos

- Node 22 e npm (é a versão usada no [`Dockerfile`](Dockerfile))
- Backend `talous-backend` rodando (default `http://localhost:8001`)
- Um usuário com `users.is_admin = true` no banco — todo endpoint `/admin/*`
  valida isso no backend

## Configuração

Crie um `.env.local` na raiz do repo:

```bash
# Base da API consumida pelo browser. Em dev, apontar direto para o backend;
# atrás de proxy (deploy), usar o caminho relativo "/api/v1".
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1

# Origem do backend usada pelo rewrite de /api/v1/* em next.config.ts.
BACKEND_API_ORIGIN=http://localhost:8001
```

## Rodar

```bash
npm install
npm run dev      # http://localhost:6001
```

A **porta é 6001** em `dev`, `build` e `start` — não 3000. O backend precisa ter
`http://localhost:6001` nos `cors_origins`.

Login em `/login` por **dev login** (só o e-mail). `/` redireciona para `/cvm`.

## Verificação

```bash
npm run lint     # eslint .
npm run test     # vitest run
npm run build    # next build --webpack
npx tsc --noEmit # quando a task tocar tipos, rotas ou services
```

### E2E (Playwright)

```bash
npm run e2e                          # suíte mock inteira
npm run e2e -- e2e/<spec>.spec.ts    # só a spec da task
npm run e2e:ui                       # modo UI
npm run e2e:real                     # bate no backend real (e2e-real/)
npm run e2e:report                   # abre o último relatório HTML
```

Dois projetos: **`mock`** (`e2e/`, MSW + fixtures, determinista, é o default de
`npm run e2e`) e **`real`** (`e2e-real/`, backend de verdade, timeout maior).

> ⚠ O Playwright usa `reuseExistingServer` fora de CI: se já houver um `next dev`
> na 6001, ele reaproveita esse processo. Um dev server órfão e desatualizado faz
> os testes rodarem contra código velho. Na dúvida, mate a 6001 antes.

## Convenções do repo

- **Sem route groups** `(...)` e **sem segmentos dinâmicos** `[...]`. Páginas de
  detalhe são `.../detail/page.tsx` recebendo o id por query string
  (`/cvm/companies/detail?cd_cvm=9512`); telas de moderação são
  `.../validate/page.tsx`.
- Chamadas de API só via `lib/services/admin/*` (tipos em
  `lib/services/admin/types.ts`). Não inventar endpoint: conferir no contrato do
  backend.
- Listas paginadas usam `PaginationControls` com seletor de itens-por-página.
- O painel é **pt-BR, sem camada de i18n** — decisão registrada em
  [ADR-002](../docs/Decisions/ADR-002-admin-sem-i18n.md); copy nova entra como
  literal no componente. Ver §9 de
  [`docs/admin-panel.md`](docs/admin-panel.md).
