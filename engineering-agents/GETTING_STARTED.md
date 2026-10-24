# Rodar a fundação localmente

## Requisitos

- Docker Engine com Docker Compose v2.
- Node.js 20+ somente se for executar a API fora do Docker.

## Subir API, PostgreSQL e dashboard

A partir deste diretório:

```bash
cp .env.example .env
```

Edite `.env` e substitua os três valores por segredos diferentes. Use senhas/token alfanuméricos longos para evitar problemas de escaping na URL de conexão. Não compartilhe nem faça commit do arquivo `.env`.

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f control-api
```

Abra `http://localhost:8080`. Na interface, informe a URL `http://localhost:4310` e o valor de `AGENTS_API_TOKEN`. A API e o dashboard ficam vinculados a `127.0.0.1` para não expor o serviço à rede local por padrão.

Verificação de saúde:

```bash
curl http://localhost:4310/health
```

## Inserir uma tarefa de teste

O endpoint de ingestão é reservado a serviços internos e usa um segredo diferente do token de leitura da interface. No terminal, carregue as variáveis locais:

```bash
set -a
. ./.env
set +a
curl -X POST http://localhost:4310/internal/tasks \
  -H "Authorization: Bearer $AGENTS_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "manual-check-001",
    "title": "Validar a primeira execução do painel",
    "summary": "Tarefa de teste inserida manualmente para validar persistência e consulta.",
    "category": "maintainability",
    "priority": 10,
    "impact": 1,
    "confidence": 1,
    "effort": 1,
    "risk": 1,
    "evidence": [{"description": "Tarefa de smoke test criada manualmente; não representa um achado real."}]
  }'
```

A tarefa é criada sempre com o estado `discovered`; o endpoint não aceita que o solicitante force um estado de aprovação ou conclusão. O painel deve exibi-la após atualizar. Use IDs únicos; uma repetição retorna conflito em vez de sobrescrever a tarefa.

## Parar

```bash
docker compose down
```

Para remover também os dados persistidos localmente (ação destrutiva):

```bash
docker compose down -v
```

## Limitações desta primeira etapa

- O Discovery Service ainda não foi implementado: não há análise autônoma nem preenchimento automático da fila.
- A API permite ingestão autenticada de oportunidades, mas não implementa ainda as transições completas do workflow.
- A interface consulta e filtra tarefas; não autoriza merge nem executa agentes.
- O token de ingestão é uma credencial compartilhada de desenvolvimento. Antes de produção, trocar por autenticação serviço-a-serviço e segredos gerenciados.
- A configuração de regras de proteção no GitHub não é alterada por este scaffold; deve ser configurada e verificada nas configurações do repositório antes de conceder permissões de escrita a workers.
- Não foi executado teste de build/containers nesta etapa; valide localmente antes de conectar qualquer agente com permissão de escrita.