# talous-admin — Contexto para Agentes

## Visão geral

Painel administrativo interno do Talous AI para operadores.

Acesso restrito a usuários com `users.is_admin = true` (validado no backend em cada requisição).

Se este repo estiver dentro do workspace `talous-ai`, leia tambem
[AGENTS.md](../AGENTS.md).

Leia [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) e
[DEVELOPMENT_GUIDELINES.md](../DEVELOPMENT_GUIDELINES.md) antes de gerar codigo.

---

## Escopo das funcionalidades

Inventário completo e atualizado das telas: [`docs/admin-panel.md`](docs/admin-panel.md).

### Implementado hoje (tudo sob `/cvm`, mais `/login`)

- **Dashboard CVM** e **alertas operacionais**
- **Empresas**: lista, hub de detalhe com 6 abas (Info · Tickers · Historico ·
  Mudancas · Moderar · Verificar), snapshots cadastrais
- **Setores**: taxonomia setor/subsetor (CRUD), mapeamento `cvm_setor_atividade`
  → setor interno, reatribuição de empresa
- **Documentos CVM**: IPE, ITR/DFP, FRE, FCA, ICBGC — lista, detalhe e moderação
- **Mercado & capital**: recompras, VLMO (insider), composição de capital
- **Participantes**: auditores, intermediários, administradores de carteira
- **Curadoria de ticker**: `PATCH /admin/cvm/companies/{cd_cvm}/tickers/{ticker}`
  (desabilitar carimba `delisted_at`; reabilitar zera)
- **Moderação genérica** por `(report_type, ref)` via
  `/admin/cvm/validations/{validate,invalidate}`
- **Operação**: `/cvm/jobs` (jobs Celery + painel de workers, somente leitura) e
  sino de notificações do operador na topbar
- **i18n parcial**: next-intl sem routing, locale por cookie `NEXT_LOCALE`;
  só shell, Dashboard CVM e Alertas migrados — o resto é hard-coded em pt-BR

### Planejado — **sem tela hoje** (não descrever como existente)

- Gestão de usuários (plano, consumo de tokens, desativar, exclusão LGPD)
- Gestão de planos / `plan_config`
- Broadcast de notificação `system` para usuários finais
- Pesos de score por setor (`sector_score_weights`) e parâmetros DCF
  (`sector_dcf_params`)
- Seed de empresas por upload de CSV
- Relatório de uso de AI (`ai_usage`, custo em USD)
- Google OAuth (o login é dev login por e-mail), audit log, rate limiting

---

## Regras de acesso

- Todas as rotas exigem `users.is_admin = true` — verificar no backend, não confiar no frontend
- Ações destrutivas exigem confirmação explícita no fluxo
- Admin routes: verificar `is_admin` via JWT claim ou lookup no banco

---

## Stack

O admin e uma aplicacao separada em `talous-admin/`.

- Next.js 16
- React 19
- TypeScript strict
- Tailwind CSS 4
- shadcn/Radix UI
- TanStack Query
- Zustand
- React Hook Form + Zod
- Recharts
- next-intl (sem i18n routing — locale por cookie `NEXT_LOCALE`)
- Vitest + Testing Library
- Playwright

Porta local: `6001`.

Rotas seguem o padrao atual do repo: sem route groups `(...)` e sem segmentos
dinamicos `[...]`; paginas de detalhe usam `/detail/page.tsx` com query string.

---

## Documentação local

- [Painel admin — doc viva: telas, padrões, i18n, aba Tickers](docs/admin-panel.md)
- [Como rodar e verificar](README.md)
- [Contrato canônico da API admin](../talous-backend/docs/Architecture/admin-api-reference.md)
- [Bootstrap do MVP CVM](docs/admin-cvm-mvp.md) — **histórico**, não descreve o painel atual
- [Fase 2 (expansão CVM)](docs/admin-cvm-phase2.md) — **plano parcialmente executado** (o hub de "5 lentes" nunca existiu)
- [Planos e plan_config](../docs/Product/plans.md)
- [Fórmula de score e pesos](../docs/Data/score_formula.md)
- [Modelo DCF e parâmetros](../docs/Data/dcf_model.md)
- [Database schema](../docs/Architecture/database.md)
- [Arquitetura do sistema](../docs/Architecture/system-architecture.md)
