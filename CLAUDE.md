# talous-admin — Contexto para Claude Code

## Visão geral

Painel administrativo interno do Talous AI para operadores.

Acesso restrito a usuários com `users.is_admin = true` (validado no backend em cada requisição).

Leia [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) e [DEVELOPMENT_GUIDELINES.md](../DEVELOPMENT_GUIDELINES.md) antes de gerar código.

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

A definir. Opções em avaliação:
1. Rotas `/admin` dentro do `talous-frontend` (mesmo projeto Next.js)
2. Aplicação separada (Next.js standalone ou outra stack leve)

Ver decisão em [open_points.md](../docs/Decisions/open_points.md).

---

## Documentação local

- [Painel admin — escopo detalhado](docs/admin-panel.md)
- [Planos e plan_config](../docs/Product/plans.md)
- [Fórmula de score e pesos](../docs/Data/score_formula.md)
- [Modelo DCF e parâmetros](../docs/Data/dcf_model.md)
- [Database schema](../docs/Architecture/database.md)
- [Arquitetura do sistema](../docs/Architecture/system-architecture.md)
