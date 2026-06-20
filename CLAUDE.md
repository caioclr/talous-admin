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

### Gestão de Usuários
- Listar usuários, visualizar plano e consumo de tokens
- Alterar plano manualmente
- Desativar/reativar conta
- Executar exclusão LGPD (`AccountDeletionService`)

### Gestão de Planos
- Editar configurações de `plan_config` (talous-tokens, janela de edição de teses)
- Sem necessidade de redeploy para alterar limites

### Notificações do Sistema
- Enviar broadcast do tipo `system` para todos os usuários ou grupo específico

### Configuração de Score e DCF
- Editar pesos de score por setor (`sector_score_weights`)
- Editar parâmetros DCF por setor (`sector_dcf_params`)
- Mudanças aplicadas no próximo ciclo EOD

### Monitoramento de Jobs
- Status e histórico de execução dos jobs Celery (Intraday, EOD, Release, Selic)

### Seed de Empresas
- Upload de `seeds/companies.csv` e trigger do script de seed
- Visualizar empresas com `needs_data_refresh = true`

### Uso de AI
- Relatório de consumo de AI por usuário, engine e período
- Custo total em USD

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
- Vitest + Testing Library
- Playwright

Porta local: `6001`.

Rotas seguem o padrao atual do repo: sem route groups `(...)` e sem segmentos
dinamicos `[...]`; paginas de detalhe usam `/detail/page.tsx` com query string.

---

## Documentação local

- [Painel admin — escopo detalhado](docs/admin-panel.md)
- [Planos e plan_config](../docs/Product/plans.md)
- [Fórmula de score e pesos](../docs/Data/score_formula.md)
- [Modelo DCF e parâmetros](../docs/Data/dcf_model.md)
- [Database schema](../docs/Architecture/database.md)
- [Arquitetura do sistema](../docs/Architecture/system-architecture.md)
