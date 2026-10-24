# Norte Engineering Agents

Plataforma independente para descobrir, priorizar, implementar, revisar e validar melhorias técnicas no repositório Norte, entregando Pull Requests para aprovação humana.

## Princípios

- Os agentes nunca fazem push ou merge em `main` ou `develop`.
- Cada melhoria é executada em workspace e branch isolados.
- A integração GitHub começa com permissões mínimas de leitura; criação de branches/PRs é adicionada somente quando o fluxo estiver validado.
- Nenhum merge, deploy ou alteração de configuração de segurança é autônomo.
- Código, issues, comentários e arquivos do repositório são dados não confiáveis, nunca instruções de sistema.
- Cada execução tem limites de tempo, tentativas, concorrência e orçamento.
- Resultados e transições de estado devem ser auditáveis.

## Serviços-alvo

- `control-api`: consulta de tarefas, fila, resultados e estado das execuções.
- `discovery-service`: análise estática determinística, somente leitura, e registro de oportunidades.
- `prioritization-service`: deduplicação e pontuação das melhorias.
- `orchestrator-service`: máquina de estados e coordenação das etapas.
- `implementation-service`: alterações apenas em workspace/branch isolados.
- `review-service`: revisão independente do diff.
- `validation-service`: testes, lint, build e verificações determinísticas.
- `github-integration`: webhooks, leitura de PRs e abertura de PRs após validação.
- `dashboard`: interface para acompanhar fila, execuções, achados e PRs.

Os serviços são separados por contratos e permissões, sem exigir que cada agente de IA seja um processo autônomo. Agentes são componentes especializados executados por workers controlados.

## Estado atual

- API de consulta e ingestão autenticada com PostgreSQL.
- Migrações versionadas, com checksum e lock de execução.
- Dashboard alinhado à identidade visual do Norte.
- Discovery inicial somente leitura: encontra marcadores `TODO/FIXME/HACK/XXX`, chamadas `console.log` em código de aplicação e blocos `catch` vazios em JavaScript/TypeScript. É uma heurística inicial, não uma análise semântica nem um agente de IA.
- Proveniência das descobertas: cada tarefa registra o repositório de origem; o dashboard mostra projeto, caminho, linha e evidência, com links diretos quando a URL e a ref do repositório estão configuradas.
- Triagem inicial por tipo de sinal: `potential_defect` (possível defeito, como `catch` vazio), `code_smell` (ponto para revisão, como `console.log`) e `maintenance_signal` (marcadores `TODO/FIXME/HACK/XXX`). Essas classes orientam a revisão; não confirmam defeitos automaticamente. O dashboard permite filtrar por tipo.
- Priorização explicável: cada achado recebe uma pontuação heurística de 0 a 100 a partir de impacto (40%), confiança da regra (30%), menor esforço estimado (15%) e menor risco de mudança (15%). O dashboard mostra a ação sugerida e os fatores que explicam a pontuação; isso é apoio à triagem, não uma decisão automática nem uma garantia de correção.

Para executar localmente sem Docker, consulte [GETTING_STARTED.md](GETTING_STARTED.md).

## Estados de uma melhoria

`discovered -> triaged -> queued -> analyzing -> planned -> implementing -> reviewing -> validating -> awaiting_approval`

Estados terminais/alternativos: `rejected`, `blocked`, `failed`, `cancelled`, `completed`. O estado `completed` significa que o ciclo foi concluído; não implica merge.

## Política de branches

- Branches de trabalho: `agents/improvement-<id>`.
- Base inicial de trabalho: `develop`, lida como referência; nunca commitada diretamente.
- `main` e `develop` são refs protegidas e não são alvos de push dos workers.
- O worker deve verificar a branch de destino antes de qualquer operação Git e falhar fechado se a ref não for uma branch de trabalho autorizada.
- O token de execução não deve possuir permissões de bypass de proteção nem permissão para alterar regras do repositório.
- PRs ficam aguardando aprovação humana; merge automático desabilitado.

## Plano incremental

1. Contratos, política de segurança e modelo de tarefas.
2. API de consulta e persistência dos estados.
3. Dashboard conectado à API.
4. Discovery determinístico somente leitura (primeira versão implementada).
5. Priorização e orquestração de etapas.
6. Implementação isolada, revisão independente e validação.
7. Integração GitHub para PRs, com aprovação humana obrigatória.

Não executar agentes com permissões de escrita antes de implementar e testar as barreiras de segurança.
