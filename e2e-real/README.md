# Suite E2E contra backend real

Testes que batem em uma instância real de `talous-backend` (FastAPI + Postgres + Redis), executados sob demanda via:

```bash
npm run e2e:real
```

Pré-requisitos:
- Backend rodando em `http://localhost:8001` com `is_production=false` (rota `/auth/dev-login` ativa).
- Postgres com seeds aplicadas (`scripts/seed_companies.py`, `scripts/sync_cvm_company_registry.py`).
- Usuário admin ativo (`UPDATE users SET is_admin = true WHERE email = '...'`).

Use a env `E2E_REAL_BASE_URL` para apontar para outra instância (ex: ambiente de stage):

```bash
E2E_REAL_BASE_URL=https://admin.stage.talous.ai npm run e2e:real
```

Os arquivos `*.spec.ts` desta pasta seguem as mesmas convenções dos testes mock — mas **não** registram `page.route()` para `/api/v1/*`. Em vez disso, usam o login real (`devLogin`) com um e-mail conhecido.
