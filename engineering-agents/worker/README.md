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

## Planejar um workspace isolado (somente leitura)

Antes de criar qualquer worktree, valide o plano localmente. O comando abaixo **não executa Git nem cria pastas/branches**; ele só imprime os argumentos que uma etapa futura poderá usar:

```powershell
$env:AGENTS_WORKSPACE_TASK_ID = "disc-efc1fec8b7661f32b9625919"
$env:AGENTS_WORKSPACE_BASE_REF = "feat/engineering-agents-platform"
$env:AGENTS_REPOSITORY_PATH = "C:\Users\Asus\Documents\norte"
$env:AGENTS_WORKSPACE_ROOT = "C:\Users\Asus\Documents\norte-agent-workspaces"
npm run worker:workspace-plan
```

O diretório de workspaces deve ficar fora da raiz do repositório e não pode conter a raiz do repositório. O planejador valida o ID da tarefa, a ref base e a branch gerada `agents/improvement-<taskId>`, usando a política de branch já existente. A saída inclui a lista de argumentos Git sem usar shell. Nenhuma pasta, branch ou arquivo é criado nesta etapa.

Este planejador ainda não confirma, por conta própria, a aprovação diretamente no banco e não deve ser tratado como executor. A próxima etapa, depois de testes locais, será ligar a criação de worktree à tarefa aprovada via API e só então implementar limites de edição, comandos de teste permitidos, diff e revisão humana. Execução de código permanece desativada.

## Criar um workspace para uma tarefa aprovada (sem executar código)

Esta etapa cria um Git worktree local apenas depois de reservar uma tarefa específica na API. A tarefa precisa estar na fila aprovada e ter metadados de aprovação válidos. O comando verifica que a ref base corresponde à ref registrada na tarefa. Se a tarefa não tiver uma ref registrada, ele falha por padrão.

Configure as variáveis na sessão PowerShell, a partir de `engineering-agents`:

```powershell
$env:AGENTS_WORKSPACE_TASK_ID = "ID_DA_TAREFA_APROVADA"
$env:AGENTS_WORKSPACE_BASE_REF = "ref-registrada-na-tarefa"
$env:AGENTS_REPOSITORY_PATH = "C:\Users\Asus\Documents\norte"
$env:AGENTS_WORKSPACE_ROOT = "C:\Users\Asus\Documents\norte-agent-workspaces"
npm run worker:workspace-create
```

Se a tarefa ainda não tiver uma ref fixada, não habilite a exceção sem confirmar manualmente que a ref base é a correta. Depois da verificação humana, a exceção explícita é:

```powershell
$env:AGENTS_WORKSPACE_ALLOW_UNPINNED_BASE_REF = "true"
```

O comando usa argumentos Git sem shell, valida o diretório raiz do repositório, confirma que a ref existe e cria somente a branch da tarefa. Ele não executa scripts do projeto, não edita arquivos-fonte, não cria PR e não faz merge. A lease é liberada ao final; se a liberação falhar, a mensagem informará que a lease expirará automaticamente. Se o workspace já existir e corresponder à branch esperada, a operação é idempotente.

Antes de usar pela primeira vez, execute `npm run check` e `npm test`. A execução de código permanece desativada.
