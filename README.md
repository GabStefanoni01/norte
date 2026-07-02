# Norte

**Encontre seu norte.**

Plataforma de mentoria para jovens em início de carreira, combinando um plano
de evolução personalizado com um mentor baseado em IA.

## Visão geral

| Camada | Tecnologia | Hospedagem |
|---|---|---|
| Frontend | Angular | Vercel |
| Backend | Node.js (Express) | Vercel Functions |
| Banco de dados | PostgreSQL | - |
| IA | Mentor conversacional com contexto do usuário | - |

## Módulos

1. **Cadastro e Perfil** — identidade inicial do jovem (escolaridade, situação, interesses)
2. **Teste de descoberta pessoal** — IA mapeia perfil comportamental e sugere áreas
3. **Plano de evolução** — roadmap mensal gerado pela IA, com etapas acompanháveis
4. **Mentor IA** — chat especializado em orientação de carreira
5. **Oportunidades** — cursos, vagas, bolsas e eventos filtráveis
6. **Currículo inteligente** — geração de currículo e simulação de entrevista
7. **Dashboard do jovem** — progresso, próximos passos e recomendações
8. **Gamificação** — conquistas e níveis para manter engajamento

Detalhes completos da especificação em [`docs/specification.md`](docs/specification.md).

## Estrutura do repositório

```
backend/   API Node.js (Express + PostgreSQL)
frontend/  Aplicação Angular
docs/      Especificação e documentação de arquitetura
```

## Status

🚧 Em desenvolvimento — ver [issues](../../issues) para o roadmap atual.

## Como rodar localmente

### Banco de dados

Duas opções — escolha uma e ajuste `DATABASE_URL` no `.env` do backend de acordo:

**Opção A — Nuvem com Neon (recomendado, não usa recursos da sua máquina):**

1. Crie uma conta gratuita em https://neon.tech e um novo projeto
2. Copie a *connection string* do painel (formato `postgres://usuario:senha@ep-xxxx.neon.tech/norte?sslmode=require`)
3. Cole em `DATABASE_URL` no `.env` do backend
4. Rode as migrations: `cd backend && npm run migrate`

**Opção B — Local com Docker:**

```
docker compose up -d
```

Isso sobe um PostgreSQL em `localhost:5432` (usuário `norte`, senha `norte`, banco `norte`)
e já executa a migration inicial automaticamente. Sem Docker, instale o PostgreSQL
localmente e ajuste `DATABASE_URL` no `.env` do backend.

### Backend

```
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```
cd frontend
npm install
npm start
```

A aplicação Angular espera a API rodando em `http://localhost:3000` (ver `api.service.ts`).

### Criando o primeiro administrador

Por segurança, não existe autopromoção a admin pelo próprio site. Depois de criar sua conta
normalmente pelo cadastro, promova-a rodando esta query diretamente no banco (via SQL editor
do Neon, ou `psql`):

```sql
UPDATE users SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
```

A partir daí, fazer login com esse e-mail concede acesso à área administrativa (`/admin`).

### E-mail (verificação de conta e redefinição de senha)

Sem `SMTP_HOST` configurado no `.env`, os códigos de confirmação e redefinição de senha
aparecem no **console do backend** em vez de serem enviados por e-mail de verdade — útil
para testar o fluxo localmente sem configurar um provedor de e-mail. Para envio real,
preencha `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` no `.env`
(qualquer provedor SMTP funciona: Gmail com senha de app, Resend, Mailtrap, etc.).

## Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT
- **Frontend:** Angular, Tailwind CSS
- **IA:** integração via API de chat com contexto de usuário

## Licença

MIT — ver [LICENSE](LICENSE).
