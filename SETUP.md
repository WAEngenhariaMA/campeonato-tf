# Próximos passos — Neon + Drizzle

Este projeto tem três partes: **Neon** guarda os dados, a **API** protege o banco e controla login/senha, e o **frontend** é o site publicado no GitHub Pages. O navegador não deve receber a `DATABASE_URL`.

## Checklist rápido

1. Criar o projeto no Neon e copiar sua URL pooled.
2. Criar `.env.local` com as credenciais locais.
3. Aplicar as migrations para criar/atualizar as tabelas.
4. Rodar API e frontend localmente e testar login do administrador.
5. Publicar a API e configurar as variáveis de produção.
6. Informar a URL pública da API ao GitHub Pages através de `VITE_API_URL`.

## 1. Criar o banco no Neon

1. Acesse [Neon Console](https://console.neon.tech) e clique em **New project**.
2. Escolha PostgreSQL e uma região próxima do Brasil quando disponível.
3. Em **Connect**, copie a connection string **pooled**.
4. Guarde a URL como segredo. Ela começa com `postgresql://` e será usada somente pela API.

## 2. Configurar localmente

No PowerShell, dentro da pasta do projeto:

```powershell
Copy-Item .env.example .env.local
npm install
```

Abra `.env.local` e preencha assim:

```dotenv
DATABASE_URL=postgresql://... # URL pooled copiada do Neon
JWT_SECRET=cole-uma-chave-aleatoria-longa
ADMIN_LOGIN=organizacao
ADMIN_PASSWORD=uma-senha-forte-inicial
VITE_API_URL=http://localhost:3001/api
```

Para gerar `JWT_SECRET`:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

`ADMIN_LOGIN` e `ADMIN_PASSWORD` são as credenciais iniciais da organização. Não há e-mail no login. Cada equipe também acessa com o login e a senha cadastrados pelo administrador.

No painel **Times**, o administrador pode editar nome e login, bloquear/desbloquear o acesso, definir uma nova senha caso a equipe a esqueça e remover uma equipe. Senhas já cadastradas não são exibidas: o banco armazena somente o hash, portanto a ação correta é sempre **Redefinir senha**.

## 3. Criar ou atualizar as tabelas

Para um banco novo ou para aplicar as mudanças mais recentes:

```powershell
npm run db:migrate
```

O comando aplica, em ordem, tudo que está na pasta `drizzle/`, incluindo a mudança de `email` antigo para `username`. Ao terminar, o banco terá as tabelas `users`, `teams`, `players`, `coaches`, `registered_documents`, `representative_registrations`, `championship_config` e `audit_logs`.

Para futuras mudanças de banco:

```powershell
# 1. altere server/db/schema.ts
npm run db:generate
# 2. confira o SQL gerado na pasta drizzle/
npm run db:migrate
```

Não edite uma migration já aplicada em produção. Crie uma nova migration para cada alteração.

### Após atualizar o sistema

Quando receber uma versão nova do código, execute sempre:

```bash
npm install
npm run db:migrate
npm run build
```

As migrations atuais também criam o histórico de gols, cartões e suspensões usado pelo painel **Resultados**, além do calendário, classificação e chaveamento dinâmicos.

## 4. Testar localmente

Abra dois terminais na pasta do projeto.

No primeiro, inicie a API:

```powershell
npm run dev:api
```

Ela deve mostrar `API em http://localhost:3001`. Na primeira inicialização, cria o usuário administrador a partir de `ADMIN_LOGIN` e `ADMIN_PASSWORD`.

No segundo, inicie o site:

```powershell
npm run dev
```

Abra a URL exibida pelo Vite, acesse **Organização** e entre com o login/senha definidos no `.env.local`. Crie uma equipe em **Times** e confirme que ela consegue entrar na área de equipes com o login/senha informados no cadastro.

Validação final local:

```powershell
npm run build
npm run lint
```

## 5. Publicar a API

Publique o repositório em um serviço que execute Node.js, como Railway, Render ou Fly.io. A API precisa usar o comando:

```bash
npm run start:api
```

Cadastre estas variáveis no serviço de API:

```dotenv
DATABASE_URL=postgresql://...             # segredo: URL pooled do Neon
JWT_SECRET=...                            # segredo: a mesma chave ou outra chave forte
ADMIN_LOGIN=organizacao
ADMIN_PASSWORD=...                        # segredo: usado só para criar o primeiro admin
WEB_ORIGIN=https://SEU-USUARIO.github.io
PORT=3001
```

Depois de publicado, teste no navegador:

```text
https://SUA-API.exemplo.com/api/health
```

O resultado esperado é `{ "ok": true }`.

> Após o administrador ser criado, remova `ADMIN_PASSWORD` da configuração de produção se desejar. A senha fica guardada somente como hash no PostgreSQL.

## 6. Publicar o frontend no GitHub Pages

No GitHub do repositório:

1. Vá em **Settings → Secrets and variables → Actions**.
2. Crie o secret `VITE_API_URL`.
3. Use a URL pública da API, terminando com `/api`. Exemplo: `https://SUA-API.exemplo.com/api`.
4. Faça push na branch `main`.

O workflow já faz o build e publica o site no GitHub Pages. A variável `WEB_ORIGIN` da API deve ser exatamente a origem do Pages, sem `/campeonato-tf` no final: `https://SEU-USUARIO.github.io`.

## Segurança essencial

- Nunca coloque `DATABASE_URL`, `JWT_SECRET` ou `ADMIN_PASSWORD` em `VITE_*`, código do frontend ou GitHub Pages.
- Use o banco/branch **development** do Neon para testes; reserve a branch de produção para o site publicado.
- Antes de mudanças de schema relevantes, faça backup/export no Neon.
- O conector MCP do Neon no ChatGPT é opcional e deve apontar para desenvolvimento, não para o banco de produção ou dados reais.

## Conector Neon no ChatGPT (opcional)

1. No ChatGPT, abra **Settings → Connectors → Advanced Settings** e ative **Developer mode**.
2. Adicione uma conexão MCP com `https://mcp.neon.tech/mcp`.
3. Escolha OAuth e autorize a conta Neon.
4. Habilite o conector na conversa antes de pedir consultas ou alterações de schema.

Assim você pode pedir ao ChatGPT para listar projetos, inspecionar tabelas e orientar migrations no banco de desenvolvimento.
