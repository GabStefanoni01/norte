# Norte

![CI](https://github.com/GabStefanoni01/norte/actions/workflows/ci.yml/badge.svg)

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
5. **Currículo inteligente** — geração de currículo e simulação de entrevista
6. **Dashboard do jovem** — progresso, próximos passos e recomendações
7. **Gamificação** — conquistas e níveis para manter engajamento

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

### IA (mentor, descoberta, plano de evolução, currículo)

O Norte usa a API do **Google Gemini** para todos os recursos de IA. Gere sua chave
gratuita em https://aistudio.google.com/apikey (não pede cartão de crédito) e cole em
`GEMINI_API_KEY` no `.env`. Sem essa chave, o app continua funcionando normalmente — só
os recursos de IA ficam desativados, caindo em templates/regras padrão.

O modelo usado (`gemini-2.5-flash`) tem camada gratuita com limite de uso diário, o que é
mais do que suficiente para uso pessoal/portfólio.

### Teste de descoberta pessoal

O resultado é calculado por regras (sem depender de nenhuma API externa) — funciona
sempre. Com `GEMINI_API_KEY` configurada, a descrição do resultado é enriquecida com um
texto personalizado gerado pela IA, cruzando o perfil dominante com os interesses/objetivos
da pessoa e com as respostas reflexivas abertas do final do teste. Sem a chave, usa a
descrição padrão — o teste continua funcionando normalmente.

### Perfil do usuário

A página `/perfil` tem três abas: **Perfil profissional** (escolaridade, interesses,
objetivos), **Dados pessoais** (nome, data de nascimento, estado/cidade) e **Segurança**.
Trocar a senha exige confirmar um código de 6 dígitos enviado por e-mail — reaproveita o
mesmo fluxo de "esqueci minha senha", só que disparado a partir da própria conta logada.

### E-mail (verificação de conta e redefinição de senha)

Sem `SMTP_HOST` configurado no `.env`, os códigos de confirmação e redefinição de senha
aparecem no **console do backend** em vez de serem enviados por e-mail de verdade — útil
para testar o fluxo localmente sem configurar um provedor de e-mail. Para envio real,
preencha `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` no `.env`
(qualquer provedor SMTP funciona: Gmail com senha de app, Resend, Mailtrap, etc.).

**Usando Brevo:** `SMTP_FROM` precisa ser um e-mail verificado como *sender* no painel
(Settings → Senders, Domains, IPs → Senders) — **não** o mesmo endereço de `SMTP_USER`
(que é só a credencial de login, a Brevo rejeita o envio se ele for usado como remetente).
Se os e-mails não chegarem, confira o log do backend: a falha de envio é registrada lá
sem impedir a criação da conta (o usuário pode pedir um novo código depois).

## Segurança

- Senhas e códigos de verificação com hash (bcrypt); códigos gerados com `crypto.randomInt` (não `Math.random`)
- Rate limiting em login, cadastro, códigos de verificação/redefinição e em todo endpoint que consome a API de IA
- JWT: role reconferida no banco a cada requisição (não fica "presa" no token); app recusa subir com `JWT_SECRET` ausente ou no valor padrão do exemplo
- `helmet` para headers de segurança, CORS restrito via `FRONTEND_URL` em produção
- Conexão com o banco valida certificado SSL por padrão
- Validação de entrada (e-mail, senha, formato de código) também no backend, não só no frontend

## Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT
- **Frontend:** Angular, Tailwind CSS
- **IA:** integração via API de chat com contexto de usuário

## Licença

MIT — ver [LICENSE](LICENSE).


## Ambiente de homologação (Vercel + Render)

A homologação deve ser isolada da produção: use uma aplicação Vercel separada, uma API Render separada e um banco PostgreSQL próprio para testes. **Nunca reutilize a `DATABASE_URL` de produção.**

### 1. Banco de dados de homologação

Crie um banco ou branch separado no Neon (ou outro PostgreSQL) e copie a connection string com SSL para usar apenas na homologação. Não use dados pessoais/reais da produção.

### 2. API no Render

O arquivo `render.yaml` define o serviço `norte-api-staging), ligado à branch `develop`, com health check em `/ready`, migrations na inicialização e cron desativado.

No Render, crie/sincronize um Blueprint a partir deste repositório e preencha as variáveis solicitadas:
- `DATABASE_URL`: connection string do banco de homologação.
- `FRONTEND_URL`: URL pública da aplicação Vercel de homologação, sem barra final.
- `JWT_SECRET`: gere um segredo novo e exclusivo para homologação, se o painel não o gerar automaticamente.
- Chaves opcionais de IA, e-mail, vagas e pagamentos devem ser de teste ou ficar vazias. Não copie tokens de produção.

O serviço usa o plano gratuito do Render para reduzir custos; ele pode ter suspensão por inatividade e limites de recursos. Confirme as condições atuais no painel antes de criar o recurso.

### 3. Frontend no Vercel

Crie um **projeto Vercel separado** chamado, por exemplo, `norte-staging`, conectado ao repositório e com:
- Root Directory: `frontend`
- Production Branch: `develop`
- Build Command: `npm run build`
- Output Directory: `dist/norte-frontend/browser`
- Environment Variable `NORTE_API_URL`: URL HTTPS da API de homologação do Render (por exemplo, `https://norte-api-staging.onrender.com`, confirme a URL real no painel).

O script `frontend/scripts/configure-environment.js` injeta essa URL no build. O build na Vercel falha se `NORTE_API_URL` não estiver configurada, evitando publicar o frontend apontando para `localhost).

### 4. Validação após o deploy

1. Confirme que `/health` e `/ready` da API retornam sucesso.
2. Abra a URL Vercel e teste cadastro, login, perfil, mentor e oportunidades.
3. Confira nos logs do Render que não há erros de CORS ou conexão com PostgreSQL.
4. Teste e-mails e pagamentos apenas com credenciais de teste.
5. Não conecte domínios de produção nem altere o projeto de produção durante esta configuração.

A configuração no repositório prepara os serviços, mas a criação dos recursos e o preenchimento dos segredos precisam ser concluídos nos painéis Vercel/Render/Neon.
