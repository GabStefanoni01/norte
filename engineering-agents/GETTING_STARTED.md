# Norte Engineering Agents — primeiros passos

## Requisitos

- Node.js 20.6 ou superior e npm.
- Uma instância PostgreSQL. O fluxo local pode usar Neon sem Docker.
- Docker Compose é opcional e serve para executar também o PostgreSQL local.

## Configurar o ambiente local (Windows / PowerShell)

A partir da pasta `engineering-agents`, crie seu arquivo de ambiente:

```powershell
Copy-Item .env.example .env
```

Edite `.env` e configure:
- `DATABASE_URL`: connection string do Neon (ou outro PostgreSQL), sem compartilhar esse valor.
- `PGSSLMODE=require` para uma conexão TLS com o Neon.
- `AGENTS_API_TOKEN` e `AGENTS_INGEST_TOKEN`: segredos diferentes, com pelo menos 32 caracteres.
- `DASHBOARD_ORIGIN=http://localhost:8080`.

Não versione nem compartilhe o arquivo `.env`. Se usar Docker Compose com PostgreSQL local, defina também `POSTGRES_PASSWORD`; o Compose configura a API para usar o banco local, independentemente de `DATABASE_URL`.

## Aplicar migrações

Execute na raiz da pasta `engineering-agents`:

```powershell
npm run migrate
```

O comando carrega o `.env`, encontra os arquivos SQL em `services/control-api/migrations`, aplica as migrações pendentes em transações e registra o nome e o checksum em `engineering_agents_schema_migrations`. Um advisory lock do PostgreSQL evita duas execuções concorrentes. Migrações já registradas são ignoradas; se o conteúdo de uma migração aplicada for alterado, o script falha e pede uma nova migração.

Se a tabela `engineering_improvements` já foi criada manualmente no Neon, a primeira execução do script executará o SQL atual, que foi escrito para ser repetível, e registrará a migração. Em execuções seguintes ela será ignorada.

## Rodar API sem Docker

Em um terminal PowerShell, entre na pasta da API e execute:

```powershell
Set-Location .\services\control-api
npm install
npm run dev
```

O script `dev` carrega o arquivo `engineering-agents/.env` automaticamente. A API fica em `http://localhost:4310`. Para uma checagem básica:

```powershell
Invoke-RestMethod http://localhost:4310/health
```

## Rodar o dashboard sem Docker

Abra um **segundo terminal** e execute a partir da pasta `engineering-agents`:

```powershell
Set-Location .\dashboard
py -m http.server 8080 --bind 127.0.0.1
```

Abra exatamente `http://localhost:8080`, informe `http://localhost:4310` e o valor de `AGENTS_API_TOKEN`. O endereço deve ser `localhost`, porque precisa corresponder ao `DASHBOARD_ORIGIN` configurado.

## Inserir uma tarefa manual de teste

O endpoint de ingestão é reservado a serviços internos e usa um segredo diferente do token de leitura. Exemplo com PowerShell, a partir da pasta `engineering-agents` (substitua o token pelo valor do seu `.env`):

```powershell
$token = "SEU_AGENTS_INGEST_TOKEN"
$body = @{
  id = "manual-check-001"
  title = "Validar a primeira execução do painel"
  summary = "Tarefa de teste inserida manualmente para validar persistência e consulta."
  category = "maintainability"
  priority = 10
  impact = 1
  confidence = 1
  effort = 1
  risk = 1
  evidence = @(@{ description = "Smoke test manual; não representa um achado real." })
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri "http://localhost:4310/internal/tasks" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
```

A tarefa é criada com o estado `discovered`; o endpoint não permite forçar aprovação ou conclusão. Use IDs únicos: uma repetição retorna conflito em vez de sobrescrever a tarefa.

## Alternativa: Docker Compose

Docker é opcional. Para executar API, dashboard e PostgreSQL local, configure `POSTGRES_PASSWORD`, `AGENTS_API_TOKEN` e `AGENTS_INGEST_TOKEN` no `.env` e rode a partir da pasta `engineering-agents`:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f control-api
```

Acesse `http://localhost:8080`. Para parar:

```powershell
docker compose down
```

**Atenção:** `docker compose down -v` apaga também o volume local do PostgreSQL.

## Limitações desta etapa

- O Discovery Service ainda não foi implementado; não há análise autônoma nem preenchimento automático da fila.
- A API aceita ingestão autenticada e consulta tarefas, mas ainda não implementa todas as transições do workflow.
- O dashboard monitora e filtra tarefas; não executa agentes nem autoriza merge.
- Antes de permitir escrita a workers, configure e verifique as proteções de branches no GitHub. Nenhum agente deve escrever diretamente em `main` ou `develop`.
- Valide os testes localmente antes de conectar agentes com permissões de escrita.
