# Configuração do ambiente local

## Pré-requisitos

- Node.js compatível com a versão usada pelo projeto e npm.
- Git.
- Docker Desktop ou Docker Engine com Compose, para executar o PostgreSQL localmente.
- Um editor de código.
- Chaves de provedores externos apenas se for testar as integrações correspondentes.

Confira a versão recomendada de Node.js nos arquivos de configuração do projeto e na configuração de CI antes de atualizar o ambiente.

## 1. Clonar o repositório

```bash
git clone https://github.com/GabStefanoni01/norte.git
cd norte
```

Para trabalhar em uma branch específica, troque para a branch desejada depois do clone.

## 2. Subir o PostgreSQL

Na raiz do projeto:

```bash
docker compose up -d postgres
docker compose ps
```

O Compose atual publica a porta `5432` e cria o banco `norte` com usuário e senha de desenvolvimento. Essas credenciais são somente para uso local.

As migrações disponíveis em `backend/src/database/migrations` são montadas no diretório de inicialização do PostgreSQL. Esse mecanismo é executado na inicialização de um volume novo; para bancos já existentes, siga o procedimento de migração do projeto.

## 3. Configurar o backend

```bash
cd backend
npm ci
```

Copie `.env.example` para `.env` e ajuste os valores para o seu ambiente. No macOS/Linux:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Revise principalmente `DATABASE_URL`, `JWT_SECRET` e as variáveis de integrações que deseja testar. Nunca publique o arquivo `.env`.

Execute as migrações quando aplicável e inicie o servidor:

```bash
npm run migrate
npm run dev
```

O script de desenvolvimento utiliza Nodemon. A porta padrão documentada no exemplo de ambiente é `3000`.

## 4. Configurar o frontend

Em outro terminal:

```bash
cd frontend
npm ci
npm start
```

O Angular CLI informa no terminal o endereço local utilizado. Configure a URL da API de acordo com os arquivos de ambiente do frontend.

## 5. Verificações

Backend:

```bash
cd backend
npm test -- --runInBand
npm run lint
```

Frontend:

```bash
cd frontend
npm run build
npm test
```

## Problemas comuns

### Erro de conexão com PostgreSQL

- Confirme se o container está em execução com `docker compose ps`.
- Verifique host, porta, banco, usuário e senha em `DATABASE_URL`.
- Consulte os logs com `docker compose logs postgres`.

### Erro de CORS

Configure a origem do frontend na variável `FRONTEND_URL` do backend. Em produção, evite liberar origens indiscriminadamente.

### Integração externa indisponível

Confira se a variável necessária está definida no ambiente do backend, se a credencial é válida e se o provedor está acessível. Nunca coloque chaves privadas no código do frontend.

### Dependências inconsistentes

Use `npm ci` para instalar as versões registradas no lockfile. Evite remover ou regenerar lockfiles sem necessidade.
