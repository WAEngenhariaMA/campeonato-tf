# Campeonato 2026

Sistema de gestão de campeonato de futebol: equipes, representantes, elencos e comissão técnica.

- **Frontend:** Vite + React + TypeScript + Tailwind.
- **API:** Express + JWT.
- **Banco:** Neon PostgreSQL, modelado e migrado com Drizzle ORM.

Consulte [SETUP.md](./SETUP.md) para criar o banco, executar migrations e publicar o frontend/API.

## Desenvolvimento

```bash
cp .env.example .env.local
npm install
npm run db:generate
npm run db:migrate
npm run dev:api
# em outro terminal
npm run dev
```
