# Painel Admin — Talous AI

> **Doc viva.** Descreve o painel `talous-admin` **como ele existe em 2026-08-01**.
> Fonte de verdade para o comportamento é o código deste repositório; para
> contratos de endpoint é
> [`talous-backend/docs/Architecture/admin-api-reference.md`](../../talous-backend/docs/Architecture/admin-api-reference.md).
> Se este doc divergir de um dos dois, o doc está errado — corrija na mesma PR.

---

## 1. O que o painel é hoje

Painel interno de **inspeção, moderação e operação dos dados CVM**. Ele não
calcula nada: todo número exibido vem pronto do backend. Nenhuma tela do painel
altera regra de negócio; as únicas escritas são curadoria (validar documento,
mapear setor, habilitar/desabilitar ticker) e disparo de sync.

**Todas as telas implementadas hoje vivem sob `/cvm`** (mais `/login`). O escopo
"clássico" de um admin SaaS — usuários, planos, score/DCF, uso de AI, broadcast
de notificação — **ainda não existe** neste repositório. Ver §11.

---

## 2. Acesso e autenticação

- Login em `/login` via **dev login por e-mail** (`POST /auth/dev-login`). Google
  OAuth continua pendente.
- `app/page.tsx` redireciona `/` → `/cvm`.
- `app/cvm/layout.tsx` = `<AdminGuard>` + `<AdminShell>`. O guard
  (`components/admin-guard.tsx`) espera a hidratação da sessão e, se não
  autenticado, manda para `/login?next=<rota>`.
- Autorização real é **do backend**: toda rota `/admin/*` exige
  `users.is_admin = true`. O guard do cliente é conveniência de UX, não
  segurança.
- `lib/services/client.ts` guarda o access token em memória, envia
  `credentials: "include"` (cookie httpOnly do refresh) e faz retry automático em
  401 via `POST /auth/refresh`, com fila para não disparar refresh concorrente.

> Armadilha conhecida de ambiente: `admin@talous.ai` **não** tem `is_admin` no DEV.
> Logar com um e-mail que de fato seja admin, senão tudo responde 403.

---

## 3. Stack e convenções de rota

| Item | Valor |
|---|---|
| Framework | Next.js 16.1.5 (App Router, `--webpack`), React 19.2.3 |
| Linguagem | TypeScript 5.6 strict, alias `@/*` |
| Estilo | Tailwind CSS 4, shadcn/Radix, dark mode fixo (`<html className="dark">`) |
| Server state | TanStack Query 5 |
| Client state | Zustand (só auth) |
| Forms | React Hook Form + Zod |
| Gráficos | Recharts |
| Idioma | **pt-BR congelado**, sem camada de i18n (ver §9 e ADR-002) |
| Testes | Vitest + Testing Library; Playwright (`mock` e `real`) |
| Porta | **6001** (dev, build e start) |

**Convenção de rotas do repo — preservar:**

- **sem route groups** `(...)` e **sem segmentos dinâmicos** `[...]`;
- páginas de detalhe são `.../detail/page.tsx` e recebem o identificador por
  **query string** (ex.: `/cvm/companies/detail?cd_cvm=9512`);
- telas de moderação são `.../validate/page.tsx`, também por query string.

O `next.config.ts` faz rewrite de `/api/v1/:path*` para `BACKEND_API_ORIGIN`,
para o admin poder rodar atrás do mesmo host do backend em DEV/prod.

---

## 4. Mapa de telas

Menu lateral (`components/admin-shell.tsx`), 7 grupos:

```
Visao Geral        Dashboard CVM · Alertas
Empresas           Lista · Snapshots cadastrais · Setores
Documentos & Eventos  IPE · ITR/DFP · FRE · FCA
Mercado & Capital  Recompras · VLMO · Composicao de capital
Governanca         ICBGC
Cadastros de Mercado  Auditores · Intermediarios · Adm de carteira
Operacao           Jobs / Sync
```

Rótulos que são sigla pura da CVM (IPE, FRE, FCA, ICBGC, VLMO) ganham tooltip de
glossário via `components/cvm-acronym.tsx` + `lib/cvm-glossary.ts`.

### Inventário completo de rotas

| Rota | O que faz | Service |
|---|---|---|
| `/login` | Dev login por e-mail | `lib/services/auth.ts` |
| `/cvm` | **Dashboard CVM** — KPIs (total filings, alertas ativos, empresas, última EOD), documentos por tipo com validados/pendentes e freshness, alertas recentes, status do pipeline | `cvm-dashboard`, `cvm-alerts`, `ops-jobs` |
| `/cvm/alerts` | Alertas operacionais paginados, filtro por severidade/tipo/`cd_cvm`, link para a origem de cada alerta | `cvm-alerts` |
| `/cvm/companies` | Lista de empresas CVM (busca única + toggle "Somente B3") | `cvm-registry` |
| `/cvm/companies/detail?cd_cvm=` | **Hub da empresa** — 6 abas: Info · Tickers · Historico · Mudancas · Moderar · Verificar (ver §7 e §8) | vários |
| `/cvm/snapshots` | Snapshots do cadastro CVM (lista paginada) | `cvm-registry` |
| `/cvm/snapshots/detail?id=` | Snapshot completo + `raw_data` JSONB | `cvm-registry` |
| `/cvm/snapshots/validate?id=` | Moderação do snapshot cadastral | `cvm-registry` |
| `/cvm/sector-mapping` | Taxonomia setor/subsetor (CRUD), mapeamento `cvm_setor_atividade` → setor interno, setores não mapeados e reatribuição de empresa | `sectors`, `cvm-registry` |
| `/cvm/ipe` | Dashboard IPE: sync-status, categorias recentes, classificação por sinal, feed filtrável | `cvm-ipe` |
| `/cvm/ipe/companies/detail?cd_cvm=` | Histórico IPE da empresa (paginado) | `cvm-ipe` |
| `/cvm/ipe/disclosures/detail?id=` | Detalhe do disclosure + release processado | `cvm-ipe` |
| `/cvm/ipe/validate?id=` | Moderação do disclosure | `cvm-ipe` |
| `/cvm/itr-dfp` | Dashboard ITR/DFP: sync-status + filings paginados | `cvm-itr-dfp` |
| `/cvm/itr-dfp/companies/detail?cd_cvm=` | Explorer contábil: árvore de contas por `statement_type` + reconciliação entre fontes | `cvm-itr-dfp` |
| `/cvm/itr-dfp/validate?cd_cvm=&doc_type=&grupo_dfr=&reference_date=&version=` | Moderação do demonstrativo (chave composta) | `cvm-itr-dfp` |
| `/cvm/fre` | Dashboard FRE (formulário de referência) | `cvm-fre` |
| `/cvm/fre/filings/detail?id_documento=` | Detalhe do filing FRE (capital, posição acionária, política de dividendos, …) | `cvm-fre` |
| `/cvm/fre/validate?id_documento=` | Moderação do filing FRE | `cvm-fre` |
| `/cvm/fca` | Dashboard FCA (formulário cadastral) | `cvm-fca` |
| `/cvm/fca/companies/detail?cd_cvm=` | Histórico de documentos FCA da empresa | `cvm-fca` |
| `/cvm/fca/documentos/detail?id_documento=` | Detalhe do documento FCA (geral, DRI, auditores, tickers/segmento) | `cvm-fca` |
| `/cvm/fca/validate?id_documento=` | Moderação do documento FCA | `cvm-fca` |
| `/cvm/icbgc` | Dashboard ICBGC (informe de governança) | `cvm-icbgc` |
| `/cvm/icbgc/companies/detail?cd_cvm=` | Histórico de informes da empresa | `cvm-icbgc` |
| `/cvm/icbgc/reports/detail?id_documento=` | Detalhe do informe + práticas de governança | `cvm-icbgc` |
| `/cvm/icbgc/validate?id_documento=` | Moderação do informe | `cvm-icbgc` |
| `/cvm/buybacks` | Programas de recompra: KPIs + lista filtrável | `cvm-buybacks` |
| `/cvm/buybacks/programs/detail?id_programa=` | Programa: quantidades por tipo/classe, intermediários | `cvm-buybacks` |
| `/cvm/buybacks/validate?id_programa=` | Moderação do programa | `cvm-buybacks` |
| `/cvm/vlmo` | Dashboard VLMO (insider) | `cvm-vlmo` |
| `/cvm/vlmo/companies/detail?cd_cvm=` | Net flow mensal por cargo (gráfico) + movimentações | `cvm-vlmo` |
| `/cvm/vlmo/filings` | Fila de validação de filings VLMO | `cvm-vlmo` |
| `/cvm/vlmo/validate?id=` | Moderação do filing VLMO | `cvm-vlmo` |
| `/cvm/capital-composition` | Composição de capital: KPIs + snapshots | `cvm-capital-composition` |
| `/cvm/capital-composition/snapshots/detail?id=` | Snapshot de composição (quantidades, identificação, gráfico) | `cvm-capital-composition` |
| `/cvm/capital-composition/validate?id=` | Moderação do snapshot | `cvm-capital-composition` |
| `/cvm/participantes/auditores` (+ `detail?cd_cvm=&tipo=`, `validate?id=&tipo=&situacao=`) | Cadastro de auditores independentes | `cvm-participantes` |
| `/cvm/participantes/intermediarios` (+ `detail?cnpj=`, `validate?id=&tipo_participante=&situacao=`) | Cadastro de intermediários | `cvm-participantes` |
| `/cvm/participantes/adm-carteira` (+ `validate?id=&categoria_registro=&situacao=`) | Administradores de carteira | `cvm-participantes` |
| `/cvm/jobs` | **Jobs / Sync** — estado e histórico dos jobs Celery + painel de workers (§10) | `ops-jobs` |

> Nem todo endpoint admin consumido está sob `/admin/cvm`: a taxonomia de setores
> usa `/admin/sectors*`, o painel de operação usa `/admin/ops/jobs` e
> `/admin/ops/workers`, e o sino usa `/admin/notifications*`.

---

## 5. Padrões compartilhados de UI

Estes padrões foram introduzidos depois do desenho original e **devem ser
propagados** para as telas que ainda não os adotaram. Ao mexer numa tela antiga,
migre-a em vez de replicar o padrão velho.

### 5.1 `FilterBar` + `PageBreadcrumb` + skeletons (piloto)

- **`components/filter-bar.tsx`** — barra de filtros compacta colada acima da
  lista, com slot de busca em destaque. **Substitui** o padrão antigo
  `<Card><CardHeader>Filtros</CardHeader>…</Card>`, que destacava visualmente o
  filtro da tabela. Uso: envolver `<FilterBar>` + `<DataTable>` num wrapper
  `flex flex-col gap-2` para lerem como uma unidade só.
- **`components/page-breadcrumb.tsx`** — cabeçalho de página de detalhe: seta
  "Voltar" + trilha de breadcrumbs + título/subtítulo + slot de ações à direita.
  Consolida o cabeçalho que antes era recopiado em cada tela de validação.
- **Loading skeletons** — enquanto a query carrega, renderizar `Skeleton` com a
  forma do conteúdo final (`components/ui/skeleton.tsx`,
  `components/detail-skeleton.tsx`, e o skeleton embutido do `DataTable`), nunca
  um texto "Carregando…" solto.

**Cobertura real hoje (não é o repo inteiro):**

| Padrão | Telas que já usam |
|---|---|
| `FilterBar` | `/cvm/ipe`, `/cvm/itr-dfp`, `/cvm/buybacks` |
| `PageBreadcrumb` | `/cvm/companies/detail`, `/cvm/ipe/companies/detail`, `/cvm/ipe/disclosures/detail`, `/cvm/itr-dfp/companies/detail`, `/cvm/buybacks/programs/detail` |
| Skeletons | dashboard, todas as telas `validate/*` e os detalhes de IPE/ITR-DFP/Recompra |

O piloto foi **IPE, ITR/DFP e Recompra**. As demais listas ainda usam o card de
filtros antigo — migrar é trabalho pendente, não decisão de design.

### 5.2 Paginação com seletor de itens-por-página

`components/pagination.tsx` exporta `PaginationControls` e
`DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]`. **O seletor de itens-por-página
é o padrão** para lista paginada: passar `pageSizeOptions` **e**
`onPageSizeChange` (os dois; só então o seletor renderiza) e refletir o valor no
`page_size` da query.

Já adotado em: alerts, buybacks, capital-composition, companies, fca, fre, icbgc,
ipe (+ ipe/companies/detail), itr-dfp, participantes (×3), snapshots, vlmo (+
vlmo/filings).

Listas `by-company` dentro do hub da empresa são exceção deliberada — ver §8.

### 5.3 Tabelas

`components/data-table.tsx` (tabela genérica: colunas, loading, empty, paginação)
e `components/dynamic-table.tsx` (colunas derivadas do payload, para blocos
CVM heterogêneos). `components/json-viewer.tsx` para `raw_data` JSONB.

---

## 6. Fluxo de moderação / validação

API genérica por `(report_type, ref)`:
`POST /admin/cvm/validations/validate` e `/invalidate`.

`components/validation/` encapsula tudo:

- `ValidationBadge` — selo pendente/válido na lista;
- `ValidationStatusFilter` — filtro de status;
- `ValidationActionPanel` (+ `ValidationSeal`) — bloco "marcar válido / reverter"
  com quem/quando;
- `useReportValidation` — mutations + toast + invalidação de cache.

`ReportType` cobre 11 valores: `fre`, `fca`, `icbgc`, `capital`, `buyback`,
`vlmo`, `ipe`, `registry`, `participante_auditor`,
`participante_intermediario`, `participante_adm_carteira`.

**Detalhe não óbvio:** o endpoint de **detalhe** de FRE/FCA/ICBGC pode devolver
`validation: null` (a validação só é materializada na **lista**). Por isso o
`ValidationActionPanel` trata `null` como *pendente* e mantém um override local
alimentado **só** pela resposta do POST — sem isso o selo nunca refletiria a ação
do operador. Não "simplifique" removendo esse override.

---

## 7. Aba **Tickers** — curadoria de delisting

Aba do hub da empresa (`/cvm/companies/detail?cd_cvm=…`), implementada em
`components/cvm/company-ticker-controls.tsx`.

**O que faz.** Lista **todo o histórico de tickers** da empresa (deslistados
inclusive) com badge **Ativo** / **Desabilitado** (e badge `Primario` no
primário). A aba abre já mostrando o **estado real** de cada ticker — quem está
desabilitado e desde quando (`Desabilitado em …`), sem depender de nenhum clique.
Cada linha tem um botão que chama:

```
PATCH /admin/cvm/companies/{cd_cvm}/tickers/{ticker}
body: { "is_active": boolean }
```

O backend carimba `delisted_at = now()` ao desativar e **zera** ao reativar. O
histórico keyed por `company_ticker_id` é preservado — nada é apagado. A resposta
(`TickerToggleResponse`) devolve `{ ticker, is_active, is_primary, delisted_at }`.

**Confirmação assimétrica, de propósito.** Desabilitar abre um `AlertDialog` de
confirmação; **reabilitar é direto**. Desabilitar é a ação consequente (some do
app público); reabilitar apenas restaura o estado default.

**Por que isso existe.** No app público, o Rastreador esconde ticker sem cotação
recente **automaticamente**: `company_service` filtra
`CompanyTicker.is_active = true` **e** existência de `company_market_data` nos
últimos 10 dias. Essa heurística cobre o caso comum, mas não cobre curadoria —
ticker que ainda negocia e não deveria aparecer, ou ticker que voltou. A aba dá
ao operador o controle manual sobre o mesmo flag `is_active` que o filtro do
Rastreador respeita.

**Contrato que sustenta a aba.** `GET /admin/cvm/companies/{cd_cvm}` devolve
`tickers` como **objetos com estado**, não como lista de símbolos:

```json
"tickers": [
  { "ticker": "PETR3", "is_active": true,  "is_primary": true,  "delisted_at": null },
  { "ticker": "PETR4", "is_active": false, "is_primary": false, "delisted_at": "2026-07-30T12:00:00Z" }
]
```

Ordem: primário primeiro, depois ativos por ticker asc, depois inativos por
ticker asc. A lista continua sendo o histórico completo — a diferença é que agora
dá para **distinguir** ativo de deslistado. No admin isso é o tipo
`AdminTicker`; a lista do detalhe é `AdminDetailTicker[]`
(`lib/services/admin/types.ts`).

> `AdminCompanySummary.tickers` (coluna da **lista** em `/cvm/companies`) é outra
> coisa: continua `string[]` e **só ativos**. Não confundir os dois.

**Tolerância à ordem de deploy.** `AdminDetailTicker` é `string | AdminTicker` e
todo consumidor do detalhe passa por `lib/tickers.ts` (`tickerSymbols` para
rótulos/contagens, `normalizeDetailTickers` para o estado por linha). Contra um
backend anterior a esse contrato — que responde `string[]` — a tela não quebra:
volta ao comportamento antigo (todo ticker como Ativo, porque o payload não
permite distinguir) e o subtítulo do breadcrumb continua listando símbolos em vez
de `[object Object]`. Quando a janela de transição fechar, a união pode ser
estreitada para `AdminTicker`; a normalização em runtime é que não deve sair.

**O override local do PATCH continua existindo** (mesmo padrão do
`ValidationActionPanel`): `invalidateQueries(["cvm","company",cdCvm])` dispara um
refetch, e enquanto ele não volta o react-query serve o dado anterior — a badge
ficaria no estado errado nesse intervalo. O override é alimentado **só** pela
resposta do PATCH e dá o feedback imediato; o refetch depois confirma com o
servidor.

---

## 8. Hub da empresa — 6 abas

`/cvm/companies/detail?cd_cvm=` tem 6 abas de topo, **com lazy load** (só a query
da aba ativa dispara):

| Aba | Conteúdo |
|---|---|
| **Info** | Estado atual denormalizado (situação, datas, controlador, setor) |
| **Tickers** | §7 |
| **Historico** | Snapshots cadastrais da empresa |
| **Mudancas** | Eventos de mudança entre snapshots |
| **Moderar** | Sub-abas IPE · ITR/DFP · FRE · FCA |
| **Verificar** | Sub-abas Recompras · VLMO · Capital · ICBGC |

As sub-abas de Moderar/Verificar também são lazy.

**Detalhe de contrato que pega desprevenido:** os endpoints `*/by-company/*`
devolvem um envelope **sem meta de paginação** (`{ cd_cvm, company_name, <lista> }`)
— FRE, FCA, ICBGC, recompras, VLMO e composição de capital. **A única exceção é
IPE**, que devolve `AdminPagedResponse`. Alguns aceitam `page`/`page_size` como
query param mesmo sem paginar a resposta; por isso a página usa a janela fixa
`BY_COMPANY_PAGE_SIZE = 50` em vez de controles de paginação.

> O plano de "5 lentes com âncoras / scroll-spy" descrito em
> [`admin-cvm-phase2.md`](./admin-cvm-phase2.md) **não foi implementado**. O hub
> é por abas. Ver o banner daquele doc.

---

## 9. Idioma: pt-BR congelado, por decisão

**O painel não é internacionalizado.** Não há `next-intl`, catálogo de mensagens,
provider, cookie de locale nem seletor de idioma. A copy vive nos componentes,
em português, e é assim de propósito.

A decisão está registrada em [ADR-002 — O painel administrativo não é
internacionalizado](../../docs/Decisions/ADR-002-admin-sem-i18n.md), e o escopo do
princípio de i18n da constituição foi emendado (versão 1.1.0) para dizer
explicitamente que ele vale para o **app do usuário final**. Isto aqui não é
exceção silenciosa a um princípio — é uma fronteira escrita nele.

### Por que, em três números

Até 2026-08-01 existia uma camada de i18n **parcial**: `next-intl` sem routing,
locale por cookie `NEXT_LOCALE`, catálogos `pt-BR`/`en`/`es` e um seletor na
topbar. O levantamento de 2026-07-31 mediu o que ela entregava:

| Medição | Valor |
|---|---|
| Arquivos `.tsx` que consumiam i18n | **3 de 91** (shell, Dashboard CVM, Alertas) |
| Valores de `en.json` e `es.json` idênticos ao pt-BR | **90 de 90** |
| Copy hard-coded, fora da camada | **1.721 strings em 70 arquivos** |

Trocar o idioma mudava **apenas o atributo `lang` do `<html>`**. O seletor
oferecia três idiomas e não entregava nenhum.

Completar a internacionalização custaria as 1.721 strings mais um pré-requisito
estrutural que é o número que de fato decide: **288 definições de coluna de
tabela, 280 com rótulo literal, em 39 arrays em escopo de módulo**.
`useTranslations` é um hook — não existe fora do componente. São **39 refactors
de arquivo antes da primeira tradução**.

E o operador de moderação lê `assunto`, `categoria`, `situacao`: **dados da CVM
em português**, que nenhuma camada de i18n no cliente alcança. Traduzir o cromo
em volta de conteúdo em português produz uma tela pior que a tela toda em
português.

### Consequências que valem para quem escreve código aqui

- **Copy nova entra como literal no componente.** Não há catálogo para onde
  mandá-la, e criar um só para uma tela reintroduz a inconsistência.
- **A regra diverge do `talous-frontend`**, onde a copy vai para o catálogo. Quem
  trabalha nos dois repos precisa lembrar disso — está escrito aqui e no
  `CLAUDE.md`, não na cabeça de ninguém.
- **A grafia sem acento existente foi preservada.** O painel tem 116 strings
  escritas sem acento ("Sincronizacao", "Situacao", "Governanca") convivendo com
  strings acentuadas. As suítes casam texto literal e funcionam como *lock* de
  copy: normalizar acento é trabalho próprio, com atualização coordenada de
  asserção, nunca de carona em outra mudança.
- **As rotas voltaram a ser estáticas.** A leitura de cookie no layout raiz era o
  que forçava renderização dinâmica; sem ela, as 50 rotas do build passaram de
  `ƒ (Dynamic)` para `○ (Static)`.

### O problema de idioma que o painel realmente tem — e este doc não resolve

Dos 35 `detail=` dos endpoints admin do backend, **32 estão em inglês**
("Company not found", "Filing not found") e chegam crus ao operador via
`toast.error(error.message)` em ~20 pontos do painel. O painel já é bilíngue
**contra** o operador, hoje, e nenhuma camada de i18n no cliente resolveria isso.
É follow-up de `talous-backend`.

---

## 10. Operação: Jobs, workers e notificações

### `/cvm/jobs` — painel de workers Celery

Além do estado/histórico dos jobs instrumentados (`GET /admin/ops/jobs`), a tela
tem um card **"Workers Celery"** alimentado por `GET /admin/ops/workers`
(`getOpsWorkers`), com **refetch a cada 30s**: contagem de workers online,
**profundidade da fila**, e por worker heartbeat (online/offline), tarefas
**ativas**, **reservadas** e concorrência.

Tiles de resumo: **Rodando**, **Em falha**, **Atrasados (stale)**. `status`,
`duration` e o sinal `stale` são **calculados no backend** — o painel não deriva
nenhum deles. A tela é **somente leitura**: não dispara nem faz retry de job.

### Sino de notificações do operador

`components/notification-bell.tsx`, à direita da topbar do shell. Consome `/admin/notifications` (feed + `unread_count`) com **polling de
60s**, badge de não lidas (`99+` como teto), marcar uma como lida
(`POST /admin/notifications/{id}/read`) e marcar todas
(`POST /admin/notifications/read-all`).

---

## 11. O que ainda **não** existe no painel

Estas funcionalidades aparecem em documentos antigos como escopo do admin. Nenhuma
tem tela hoje:

- Gestão de usuários (plano, consumo, desativar, exclusão LGPD)
- Gestão de planos / `plan_config`
- Broadcast de notificação do tipo `system` para usuários finais (o sino de §10 é
  o feed **do operador**, não um broadcast)
- Configuração de pesos de score por setor e parâmetros DCF setoriais
- Seed de empresas via upload de CSV
- Relatório de uso de AI (`ai_usage`, custo em USD)
- Google OAuth (o login segue dev login por e-mail)
- Audit log (`admin_audit_log`) e rate limiting

---

## 12. Como rodar e verificar

Ver [`../README.md`](../README.md). Resumo:

```bash
npm run dev          # http://localhost:6001
npm run lint
npm run test         # vitest
npm run build
npm run e2e -- e2e/<spec>.spec.ts   # Playwright, projeto mock
npx tsc --noEmit     # quando a task tocar tipos, rotas ou services
```

---

## 13. Referências

- [`admin-cvm-mvp.md`](./admin-cvm-mvp.md) — **histórico**: plano de bootstrap (abr/2026)
- [`admin-cvm-phase2.md`](./admin-cvm-phase2.md) — **plano parcialmente executado** (mai/2026)
- [`talous-backend/docs/Architecture/admin-api-reference.md`](../../talous-backend/docs/Architecture/admin-api-reference.md) — contrato canônico da API admin
- [`../CLAUDE.md`](../CLAUDE.md) — contexto local para agentes
- [`../../AGENTS.md`](../../AGENTS.md) — regras do workspace
