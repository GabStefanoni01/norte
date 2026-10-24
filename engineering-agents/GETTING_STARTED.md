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
- `CONTROL_API_URL=http://localhost:4310`.
- `DISCOVERY_REPOSITORY_NAME=Norte` e `DISCOVERY_REPOSITORY_URL=https://github.com/GabStefanoni01/norte` para registrar a origem de cada achado.
- `DISCOVERY_REPOSITORY_REF` opcional: defina a branch exata analisada (por exemplo, `feat/engineering-agents-platform`) para habilitar links diretos ao arquivo e à linha no GitHub.

Não versione nem compartilhe o arquivo `.env`. Se usar Docker Compose com PostgreSQL local, defina também `POSTGRES_PASSWORD`; o Compose configura a API para usar o banco local, independentemente de `DATABASE_URL`.

## Aplicar migrações

Execute na raiz da pasta `engineering-agents`:

```powershell
npm run migrate
```

O comando carrega o `.env`, encontra os arquivos SQL em `services/control-api/migrations`, aplica as migrações pendentes em transações e registra o nome e o checksum em `engineering_agents_schema_migrations`. Um advisory lock do PostgreSQL evita duas execuções concorrentes. Migrações já registradas são ignoradas; se o conteúdo de uma migração aplicada for alterado, o script falha e pede uma nova migração.

Se a tabela `engineering_improvements` já foi criada manualmente no Neon, a primeira execução do script executará o SQL atual, que foi escrito para ser repetível, e registrará a migração. Em execuções seguintes ela será ignorada.

## Rodar API sem Docker

Em um terminal PowerShell, execute:

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

Abra exatamente `http://localhost:8080`, informe `http://localhost:4310` e o valor de `AGENTS_API_TOKEN`.

## Executar a primeira descoberta (somente leitura)

Com a API ligada, abra um **terceiro terminal** e execute na raiz da pasta `engineering-agents`:

```powershell
npm run check
npm test
npm run discover
```

O Discovery Service percorre arquivos de código selecionados do clone local do Norte, ignorando diretórios gerados, dependências, a pasta `engineering-agents` e arquivos `.env`. Cada tarefa registra o nome do repositório e, quando configurados, a URL e a ref de origem; o dashboard exibe esses metadados junto com caminho, linha e evidência. Links diretos para arquivo exigem `DISCOVERY_REPOSITORY_URL` e `DISCOVERY_REPOSITORY_REF` corretos. Ele procura apenas sinais determinísticos iniciais: marcadores `TODO/FIXME/HACK/XXX`, chamadas `console.log` em código de aplicação e blocos `catch` vazios em JavaScript/TypeScript. Os resultados são enviados à API com o token interno de ingestão e aparecem no dashboard como tarefas `discovered`.

O scanner é **somente leitura**: não edita arquivos, não instala dependências no projeto-alvo, não executa código encontrado e não usa um modelo de IA. Cada achado usa um ID estável para evitar duplicação em execuções seguintes. A pontuação (0–100) é heurística e combina impacto (40%), confiança da regra (30%), menor esforço (15%) e menor risco de mudança (15%). O dashboard mostra a ação sugerida e a justificativa da pontuação; confirme o contexto antes de alterar o código. O envio tem limite de 100 achados por execução e 5.000 arquivos examinados. Esses padrões são heurísticas, não prova de defeito; revise os achados antes de agir.

Por padrão, a raiz analisada é o clone local do repositório Norte onde esta pasta está. Para apontar para outro checkout, defina `DISCOVERY_REPO_PATH` no `.env` com o caminho absoluto.

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

- A descoberta é baseada em padrões estáticos simples; não há agente de IA, análise semântica profunda ou execução periódica.
- A API aceita ingestão autenticada e consulta tarefas, mas ainda não implementa todas as transições do workflow.
- O dashboard monitora e filtra tarefas; não executa agentes nem autoriza merge.
- Antes de permitir escrita a workers, configure e verifique as proteções de branches no GitHub. Nenhum agente deve escrever diretamente em `main` ou `develop`.
