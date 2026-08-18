# Campeonato 2026

Sistema de gestão de campeonato de futebol com 10 equipes: cadastro de representantes, elencos, comissão técnica, confrontos, súmulas e classificação.

- **Stack:** Vite + React + TypeScript + Tailwind, Firebase (Auth + Firestore + Storage).
- **Hospedagem:** GitHub Pages (build automático via GitHub Actions a cada push em `main`).

Veja [SETUP.md](./SETUP.md) para colocar em produção do zero (projeto Firebase, regras de segurança, primeiro admin, secrets do GitHub).

## Desenvolvimento local

```bash
cp .env.example .env.local   # preencha com as credenciais do seu projeto Firebase
npm install
npm run dev
```

## Status

Fase 1 (fundação) concluída: os 10 times, cadastro público de representantes, login e painel de cada time (jogadores, comissão técnica, senha), e o painel administrativo (times, representantes, duplicidades, configurações). Confrontos, súmula digital, sorteio oficial e classificação automática entram nas próximas fases.
