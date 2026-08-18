# Colocando no ar

Stack: **Vite + React + TypeScript + Tailwind** (site estático) + **Firebase** (Auth + Firestore + Storage), hospedado no **GitHub Pages** via GitHub Actions.

## 1. Criar o projeto Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Adicionar projeto** (plano gratuito **Spark** é suficiente).
2. **Build → Authentication → Sign-in method** → ative **E-mail/senha**.
3. **Build → Firestore Database** → criar banco (modo produção, região `southamerica-east1` para ficar perto do Brasil).
4. **Build → Storage** → criar bucket (mesma região).
5. **Configurações do projeto → Geral → Seus apps → Web (`</>`)** → registre um app e copie o objeto `firebaseConfig`.

## 2. Configurar o app localmente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com os valores do `firebaseConfig` copiado acima. Esse arquivo é ignorado pelo git — nunca commitar.

```bash
npm install
npm run dev
```

## 3. Publicar as regras de segurança

As regras do Firestore/Storage (`firestore.rules`, `storage.rules`) SÃO a camada de segurança do sistema, já que não existe backend próprio. Publique-as com a [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # selecione o projeto criado no passo 1
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 4. Criar o primeiro administrador

Não existe autoelevação a admin dentro do app (de propósito — evita brecha de segurança). O primeiro admin é criado manualmente, uma única vez:

1. **Authentication → Users → Add user** → informe um e-mail e senha reais (é esse e-mail que você vai usar para logar em `/admin/login`).
2. Copie o **UID** gerado para esse usuário.
3. **Firestore Database → Iniciar coleção** → coleção `admins`, documento com **ID = o UID copiado**, sem precisar de campos (documento vazio já basta — a regra só verifica se ele existe).

Pronto — logue em `/admin/login` com esse e-mail/senha. A partir daí, o próprio painel cria os 10 times (nome, login, senha) em **Times → Novo Time**.

## 5. Hospedar no GitHub Pages

1. No repositório do GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret**, adicione os 6 secrets abaixo (mesmos valores do `.env.local`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Dê `git push` na branch `main` — o workflow `.github/workflows/deploy.yml` builda e publica automaticamente. O site fica em `https://<seu-usuário>.github.io/campeonato-tf/`.

> A `apiKey` do Firebase Web não é secreta por natureza (ela viaja pública em qualquer app Firebase) — quem protege os dados são as regras do passo 3, não o segredo do GitHub. Usar Secrets aqui é só organização, não é a barreira de segurança real.

## 6. Autorizar o domínio do GitHub Pages no Firebase Auth

**Authentication → Settings → Authorized domains** → adicione `<seu-usuário>.github.io` (senão o login trava em produção mesmo funcionando em `localhost`).

## Limitação conhecida (documentada, não escondida)

**Admin não consegue redefinir a senha de um time sozinho** sem um backend (o SDK cliente do Firebase só troca a senha de quem está logado no momento, não a de outra conta). Para a fase atual: se um time esquecer a senha, o próprio admin recria o login em **Times → Novo Time** com um login diferente, ou — quando entrarmos na próxima fase — isso vira uma Cloud Function (`adminResetTeamPassword`), que exige habilitar o plano pago Blaze (tem cota gratuita generosa, mas pede cartão cadastrado). Ver `src/data/teams.ts` / `src/lib/secondaryAuth.ts`.
