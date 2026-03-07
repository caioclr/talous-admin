# Painel Admin — Talous AI

## Escopo

O painel administrativo é uma interface restrita para operadores internos do Talous AI.

Acesso controlado via `users.is_admin = true` (validado no backend).

---

## Funcionalidades V1

### 1. Gestão de Usuários

- Listar usuários cadastrados
- Visualizar plano atual e consumo de talous-tokens
- Alterar plano manualmente
- Desativar/reativar conta
- Executar exclusão de conta (LGPD — `AccountDeletionService`)

### 2. Gestão de Planos

- Visualizar configurações de cada plano (`plan_config` table)
- Alterar limites de talous-tokens por plano sem redeploy
- Alterar janela de edição de teses (`thesis_edit_window_days`)

### 3. Broadcast de Notificações do Sistema

- Enviar notificação do tipo `system` para todos os usuários ou grupo específico
- Campos: título, corpo, link (opcional)

### 4. Configuração de Pesos de Score por Setor

- Listar setores e seus pesos atuais (`sector_score_weights` table)
- Editar pesos dos 7 componentes de score por setor
- Os pesos devem somar 100 pontos
- Alterações disparam recalculo no próximo ciclo EOD

### 5. Parâmetros DCF por Setor

- Listar e editar `sector_dcf_params` (beta setorial, crescimento terminal)
- Alterações aplicadas no próximo ciclo EOD

### 6. Monitoramento de Jobs

- Status dos jobs Celery: Intraday, EOD, Release Processing, Selic Updater
- Última execução e resultado (sucesso/erro)
- Histórico de execuções recentes

### 7. Seed de Empresas

- Upload/edição de `seeds/companies.csv`
- Trigger manual de `scripts/seed_companies.py`
- Visualizar empresas com `needs_data_refresh = true`

### 8. Uso de AI

- Listagem de chamadas de AI (`ai_usage` table)
- Consumo total por usuário e por engine
- Custo total em USD por período

---

## Regras de Acesso

- Todas as rotas admin exigem `users.is_admin = true`
- Backend valida `is_admin` em cada requisição (não confiar no frontend)
- Ações destrutivas (exclusão LGPD, alteração de planos) devem exigir confirmação explícita

---

## Stack

A definir. Opções:
- Reutilizar o mesmo projeto `talous-frontend` com rotas protegidas em `/admin`
- Painel separado (Next.js ou outra stack leve)

Decisão: ver `docs/Decisions/open_points.md`

---

## Referências

- [Autenticação e is_admin](../../docs/Architecture/system-architecture.md)
- [Planos e talous-tokens](../../docs/Product/plans.md)
- [Score formula e pesos](../../docs/Data/score_formula.md)
- [DCF e parâmetros setoriais](../../docs/Data/dcf_model.md)
- [Database schema](../../docs/Architecture/database.md)
