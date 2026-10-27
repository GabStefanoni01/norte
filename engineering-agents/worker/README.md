# Worker — modo dry-run

Esta etapa consulta apenas a fila interna de tarefas aprovadas e valida o contrato de aprovação. Ela **não** clona repositórios, executa comandos, altera arquivos, cria branches ou abre pull requests.

## Executar no PowerShell

A partir da pasta `engineering-agents`, configure as variáveis na sessão atual:

```powershell
$env:CONTROL_API_URL = "http://localhost:4310"
$env:AGENTS_INGEST_TOKEN = "SEU_TOKEN_INTERNO"
npm run worker:dry-run
```

O token deve ser o mesmo `AGENTS_INGEST_TOKEN` usado pela API. Não o coloque em commits nem compartilhe o valor.

O relatório JSON lista apenas tarefas com ID seguro, carimbo de aprovação, hash SHA-256 no formato esperado e plano exigindo aprovação humana. A API deve continuar declarando `executionEnabled: false`; qualquer resposta diferente falha fechada.

## Testar sem acessar o banco

Na raiz `engineering-agents`:

```powershell
npm run check
npm test
```

Os testes usam payloads locais de exemplo; não criam tarefas no Neon nem precisam da API em execução.

## Limites deliberados

- Somente leitura da fila; sem execução de código.
- Timeout de 5 segundos para a requisição e no máximo 10 tarefas por consulta.
- Aprovação humana é registrada como um identificador declarado; a identidade do aprovador não é verificada.
- Hash válido não prova, por si só, que o plano recebido corresponde ao snapshot do banco; a API é responsável por registrar o snapshot aprovado.
- Próxima etapa antes de qualquer execução: claim/lease idempotente, workspace isolado, allowlist estrita de comandos, limites de recursos, coleta de diff/logs e revisão humana. Nunca habilitar execução arbitrária ou merge automático.
