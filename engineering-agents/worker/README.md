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

## Validar o mecanismo de claim/lease sem executar código

Depois de aplicar as migrações e iniciar a API, execute:

```powershell
npm run migrate
npm run worker:claim-dry-run
```

O comando faz uma reserva atômica temporária de uma tarefa aprovada e libera a reserva logo em seguida. Isso valida a coordenação entre workers sem iniciar implementação, executar comandos do repositório ou modificar arquivos. A lease expira em cinco minutos se o processo falhar antes de liberá-la. O token da lease é mantido apenas em memória e não é impresso no relatório.

A rota de claim usa `FOR UPDATE SKIP LOCKED`, ignora reservas ainda válidas e incrementa `worker_attempts`. O endpoint de fila de leitura também oculta tarefas com lease ativa. A lease é apenas uma trava de coordenação; não autoriza execução. A execução continua desativada e ainda será necessário implementar workspace isolado, allowlist de comandos, coleta de diff, testes, auditoria e revisão humana.
