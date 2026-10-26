# Worker — modo dry-run

Esta primeira etapa consulta apenas a fila interna de tarefas aprovadas. Ela **não** clona repositórios, executa comandos, altera arquivos, cria branches ou abre pull requests.

## Executar no PowerShell

A partir da pasta `engineering-agents`, configure as variáveis na sessão atual:

```powershell
$env:CONTROL_API_URL = "http://localhost:4310"
$env:AGENTS_INGEST_TOKEN = "SEU_TOKEN_INTERNO"
node .\worker\src\worker.js
```

O token deve ser o mesmo `AGENTS_INGEST_TOKEN` usado pela API. Não o coloque em commits nem compartilhe o valor.

O relatório JSON lista apenas tarefas com carimbo de aprovação, hash SHA-256 no formato esperado e plano exigindo aprovação humana. A API ainda declara `executionEnabled: false`; se esse contrato mudar inesperadamente, o worker falha fechado.

## Limites deliberados

- Somente leitura da fila; sem execução de código.
- Timeout de 5 segundos para a requisição.
- No máximo 10 tarefas por consulta.
- A aprovação é registrada como um identificador declarado; este worker não verifica a identidade do aprovador.
- Próxima etapa, antes de qualquer execução: implementar claim/lease idempotente, workspace isolado, allowlist de comandos, limites de recursos, coleta de diff/logs e revisão humana. Nunca habilitar execução arbitrária ou merge automático.
