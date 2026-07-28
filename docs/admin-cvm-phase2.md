# Talous Admin — Fase 2 (expansão CVM)

> ## 📌 PLANO — executado só em parte. **Não leia como descrição do painel atual.**
>
> **Escrito em 2026-05-03. Conferido contra o código em 2026-07-27.**
>
> Mantido sem reescrita porque registra o *porquê* das decisões de fase. O que
> está abaixo é **intenção**, não inventário. O inventário do que existe está em
> [`admin-panel.md`](./admin-panel.md).
>
> ### ✅ Executado
>
> - **Estrutura da sidebar** — os 7 grupos foram implementados praticamente como
>   descritos (`components/admin-shell.tsx`).
>   Uma divergência: **Snapshots cadastrais ganhou item próprio** na sidebar (em
>   "Empresas"), ao contrário do que o plano dizia ("sem item na sidebar").
> - **Todas as fases de dataset 2.1 → 2.7 foram entregues**, incluindo as que a
>   tabela abaixo ainda marca `⏳ pendente`: **ICBGC (2.4)**, **FCA (2.5)**,
>   **Participantes (2.6)** e **Alertas Operacionais (2.7)** têm telas hoje. A
>   tabela de status está congelada em maio/2026 — não confie nela.
> - **Operação / Jobs** deixou de ser "futuro": existe `/cvm/jobs`, alimentado por
>   `/admin/ops/jobs` e `/admin/ops/workers` (inclui painel de workers Celery).
>
> ### ❌ **NÃO executado — o "hub de 5 lentes" não existe**
>
> A seção "Hub da empresa — 5 lentes em uma página" descreve uma tela que **nunca
> foi construída**. Verificado em `app/cvm/companies/detail/page.tsx`
> (2026-07-27): o hub continua sendo **`<Tabs>`**, hoje com **6 abas**
> (`Info · Tickers · Historico · Mudancas · Moderar · Verificar`), com **lazy
> load por aba** — o oposto do "tudo renderizado na mesma página com sub-tabs
> como âncoras / scroll-spy". Não há âncora, nem scroll-spy, nem lente.
>
> Parte do conteúdo previsto nas lentes foi reagrupado nas abas **Moderar**
> (sub-abas IPE · ITR/DFP · FRE · FCA) e **Verificar** (sub-abas Recompras ·
> VLMO · Capital · ICBGC), mais a aba **Tickers**, que o plano nem previa. A
> reconciliação CVM × provider vive em `/cvm/itr-dfp/companies/detail`, não no hub.
>
> ### 🟡 Parcial — "Restrição transversal: periodicidade"
>
> A regra de que **toda** tela com dado periódico ofereça seletor de período +
> visualização gráfica **não** foi cumprida de forma transversal. Só duas telas
> têm gráfico Recharts hoje: composição de capital
> (`components/charts/capital-composition-chart.tsx`) e net flow VLMO
> (`components/charts/vlmo-net-flow-chart.tsx`). As demais expõem período como
> filtro/coluna de tabela, sem série temporal nem diff visual.
>
> ### Vocabulário desatualizado
>
> Onde o texto abaixo diz **"CVM × Brapi"**, leia "CVM × provider de mercado". O
> provider **brapi foi removido** do backend (hoje é bolsai para EOD/fundamentos).
> O endpoint `/admin/cvm/itr-dfp/reconciliation/{cd_cvm}/{ref_date}` continua
> existindo e compara os valores CVM contra `CompanyFundamentals` — seja qual for
> o provider que preencheu a tabela. A tela chama isso de "Reconciliação entre
> fontes", sem citar provider.
>
> ### Ainda fora
>
> Google OAuth, `admin_audit_log`, rate limiting e as páginas de Usuários /
> Planos / Score / AI Usage continuam **não implementados**.

Continuação de [admin-cvm-mvp.md](./admin-cvm-mvp.md). Cobre os Sprints 4-10 do backend (38 endpoints / 7 datasets adicionais), com decisões de IA acordadas em 2026-05-03 após consulta ao especialista CVM.

## Estrutura da sidebar

Eixo: tipo de documento. Substitui o menu plano atual.

```
Visão Geral
  ├ Dashboard CVM                  (já existe — agrega sync-status dos 11 datasets)
  └ Alertas Operacionais           (nova — implementar APÓS Sprint 6)

Empresas
  ├ Lista                           (já existe — /cvm/companies)
  └ Setores (mapping)               (já existe — /cvm/sector-mapping)

Documentos & Eventos
  ├ IPE                             (já existe)
  ├ ITR/DFP                         (já existe)
  ├ FRE                             (Sprint 7 backend / Fase 2.3 admin)
  └ FCA                             (Sprint 9 backend / Fase 2.5 admin)

Mercado & Capital
  ├ Recompras Ativas                (Sprint 5 backend / Fase 2.1 admin)
  ├ Insider VLMO                    (Sprint 8 backend / Fase 2.2 admin)
  └ Composição de Capital           (Sprint 4 backend / Fase 2.1 admin)

Governança
  └ ICBGC                           (Sprint 6 backend / Fase 2.4 admin)

Cadastros de Mercado
  ├ Auditores                       (Sprint 10 backend / Fase 2.6 admin)
  ├ Intermediários                  (Sprint 10)
  └ Admins de Carteira              (Sprint 10)

Operação
  └ Jobs / Sync                     (futuro — depende de endpoint de task status)
```

Snapshots e detalhes de snapshot continuam acessíveis via página de empresa, sem item na sidebar.

## Hub da empresa — 5 lentes em uma página

Substitui as 5 tabs atuais (Info / Histórico / Mudanças / IPE / ITR-DFP) por **5 lentes** com sub-tabs **como âncoras / scroll-spy** — todo conteúdo renderizado na mesma página, sub-tab apenas rola até o bloco. A justificativa é que validar exige cruzar informação; esconder em abas força o operador a alternar e perde contexto.

| Lente | Sub-blocos (âncoras) | Endpoints |
|---|---|---|
| **Cadastro** | Info denormalizada · Histórico de snapshots · Mudanças entre snapshots · FCA Anual | `/companies/{cd_cvm}` · `/companies/{cd_cvm}/history` · `/companies/{cd_cvm}/changes` · `/fca/by-company/{cd_cvm}` |
| **Financeiro** | DRE · BPA / BPP · DFC · Reconciliação CVM × Brapi | `/itr-dfp/account-lines/{cd_cvm}` (4 statement_types) · `/itr-dfp/reconciliation/{cd_cvm}/{ref_date}` |
| **Capital & Mercado** | Composição de capital · Programas de recompra · Insider VLMO | `/capital-composition/by-company/{cd_cvm}` · `/buybacks/programs/by-company/{cd_cvm}` · `/vlmo/aggregates/{cd_cvm}` |
| **Governança** | FRE (capital, posição acionária, auditores, remuneração, …) · ICBGC (54 práticas) · Auditor histórico | `/fre/by-company/{cd_cvm}` · `/icbgc/by-company/{cd_cvm}` |
| **Eventos** | Feed IPE da empresa | `/ipe/disclosures/by-company/{cd_cvm}` |

## Restrição transversal — periodicidade

**Toda tela com dado periódico** (trimestral, anual, mensal) deve oferecer:

1. Seletor de período + atalhos próximo/anterior (ou comparação lado-a-lado).
2. Visualização gráfica — série temporal, sparkline ou diff visual contra período anterior.

Datasets afetados: composição de capital (trimestral), ITR/DFP (trimestral/anual), FRE (anual), ICBGC (anual), VLMO (mensal por cargo), FCA (anual). Padronizar com Recharts (mesma lib do talous-frontend).

## Ordem de implementação

| Fase | Datasets | Status | Justificativa |
|---|---|---|---|
| **2.1** | Composição de Capital + Recompras | ✅ entregue 2026-05-03 | shares outstanding e free float são inputs críticos de DCF/valuation; impactam score |
| **2.2** | VLMO Insider Trading | ✅ entregue 2026-05-03 | fecha o triângulo Capital × Recompras × Insider; cruzamentos só fazem sentido com os 3 |
| **2.3** | FRE | ✅ entregue 2026-05-03 | governança densa (21 tabelas); alimenta score de governança |
| **2.4** | ICBGC | ⏳ pendente | 54 práticas — complementa FRE |
| **2.5** | FCA | ⏳ pendente | tickers/segmento Novo Mercado, auditor histórico |
| **2.6** | Participantes | ⏳ pendente | cadastros de mercado (auditores, intermediários, adm. carteira) |
| **2.7** | Alertas Operacionais | ⏳ pendente | só faz sentido com FRE+ICBGC+VLMO já carregados |

## Alertas operacionais (Fase 2.7)

| Severidade | Flag | Cruzamento |
|---|---|---|
| Alta | FRE atrasado >12 meses | `fre/by-company` × hoje |
| Alta | FCA atrasado >12 meses (regulatório até 31/maio) | `fca/by-company` × hoje |
| Alta | Divergência shares outstanding entre `/capital-composition` e valor usado em DCF | `capital-composition/by-company` × valuation |
| Alta | ITR/DFP sem reconciliação CVM × Brapi acima da tolerância | `/itr-dfp/reconciliation` × tolerância configurável |
| Alta | `needs_data_refresh = true` | flag direta do backend |
| Média | Recompra ativa sem update de quantities no trimestre corrente | `/buybacks/active` × `/buybacks/programs/{id}` |
| Média | Trade real VLMO relevante em N dias sem IPE associado | `vlmo` (filter `is_position_snapshot=false`) × `ipe/by-company` |
| Média | Auditor trocado em FCA sem IPE de "troca de auditor" | FCA auditores × IPE categoria |
| Baixa | ICBGC desatualizado (>18 meses) | `icbgc/by-company` × hoje |

Diferenciar sempre VLMO real (`is_position_snapshot=false`) de saldo inicial — saldo inicial não é trade.

## Fora desta fase

- Google OAuth (substitui dev login)
- Auditoria (`admin_audit_log`)
- Endpoint de task status para acompanhar progresso de syncs
- Rate limiting
- Páginas de Usuários, Planos, Score, Jobs (`admin-panel.md` itens 1-3, 5-8 — nada disso é CVM)
