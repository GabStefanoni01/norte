# GitHub Actions e integração contínua

A pasta `.github/workflows/` contém automações que executam verificações em mudanças no repositório. O objetivo inicial é detectar falhas de lint, testes e build antes do merge.

## Workflows

### CI — `ci.yml`

Executa verificações separadas para backend e frontend em Pull Requests e pushes nas branches de desenvolvimento configuradas no workflow.

- Backend: instala dependências com `npm ci`, executa ESLint e testes Jest.
- Frontend: instala dependências com `npm ci`, executa build de produção e testes headless.
- Usa cache npm para reduzir o tempo de instalação.
- Define permissões mínimas de leitura para o token do workflow.

### Auditoria de dependências — `dependency-audit.yml`

Executa `npm audit` nos diretórios backend e frontend em pushes, Pull Requests e execução manual. A auditoria ajuda a identificar vulnerabilidades conhecidas nas dependências; os resultados precisam ser analisados e atualizados com cuidado para evitar mudanças incompatíveis.

## Execução manual

No GitHub, abra **Actions**, selecione o workflow e utilize **Run workflow** quando essa opção estiver disponível.

## Diagnóstico de falhas

1. Abra a execução que falhou na aba Actions.
2. Identifique o job e o primeiro comando que retornou erro.
3. Reproduza o comando localmente no diretório correto.
4. Corrija o problema e envie um novo commit à branch.
5. Verifique se a nova execução passou.

## Limitações

A CI valida código e dependências; ela não confirma sozinha que a aplicação implantada está saudável, que os segredos de produção estão corretos ou que todos os fluxos de negócio funcionam em produção. Deploy automático não está habilitado por estes workflows.
