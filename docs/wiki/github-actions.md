# GitHub Actions e integração contínua

A automação existente em `.github/workflows/ci.yml` é mais abrangente do que uma validação simples: executa testes do backend com PostgreSQL, build de produção do frontend e um fluxo E2E com Playwright.

## CI — `ci.yml`

O workflow é acionado em Pull Requests para `develop` e `main`, em pushes para as branches configuradas e manualmente.

Jobs identificados no workflow atual:

- **Backend — testes:** inicia PostgreSQL 16 como serviço, configura variáveis de teste, instala dependências, executa migrações, roda Jest e verifica a sintaxe dos arquivos JavaScript.
- **Frontend — build de produção:** instala dependências e compila a aplicação Angular em configuração de produção.
- **E2E — fluxo principal:** prepara o banco de teste, instala Chromium, sobe backend e frontend, aguarda os endpoints e executa os testes Playwright. Em caso de falha, imprime logs para facilitar o diagnóstico.

O workflow utiliza permissões de leitura para o conteúdo do repositório e configurações de concorrência para cancelar execuções antigas da mesma referência.

## Auditoria de dependências — `dependency-audit.yml`

O workflow adicional de auditoria executa `npm audit --audit-level=high` para backend e frontend em pushes, Pull Requests, agenda semanal e execução manual. A auditoria detecta vulnerabilidades conhecidas nas dependências, mas seus resultados devem ser avaliados antes de atualizar pacotes.

## Execução manual

No GitHub, abra **Actions**, selecione o workflow e utilize **Run workflow**, quando disponível.

## Diagnóstico de falhas

1. Abra a execução que falhou na aba Actions.
2. Identifique o job e o primeiro comando que retornou erro.
3. Reproduza o comando localmente no diretório correto.
4. Para falhas de banco, confira as migrações e variáveis de teste.
5. Para falhas E2E, confira os logs do backend/frontend e se os seletores do teste continuam compatíveis com a interface.
6. Corrija o problema e envie um novo commit à branch.

## Limitações

A CI valida código, testes e dependências; não confirma sozinha que a aplicação implantada está saudável, que os segredos de produção estão corretos ou que todos os fluxos funcionam em produção. Deploy automático não é configurado por estes workflows.
