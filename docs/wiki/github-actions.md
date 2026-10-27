# GitHub Actions e integração contínua

A automação em `.github/workflows/` cobre testes, build, testes E2E e verificações de segurança. Os workflows se complementam: CI valida comportamento e compilação; auditoria verifica dependências; CodeQL procura padrões de código potencialmente vulneráveis.

## CI — `ci.yml`

O workflow é acionado em Pull Requests para `develop` e `main`, em pushes para as branches configuradas e manualmente.

Jobs identificados no workflow atual:

- **Backend — testes:** inicia PostgreSQL 16 como serviço, configura variáveis de teste, instala dependências, executa migrações, roda Jest e verifica a sintaxe dos arquivos JavaScript.
- **Frontend — build de produção:** instala dependências e compila a aplicação Angular em configuração de produção.
- **E2E — fluxo principal:** prepara o banco de teste, instala Chromium, sobe backend e frontend, aguarda os endpoints e executa os testes Playwright. Em caso de falha, imprime logs para facilitar o diagnóstico.

O workflow utiliza permissões de leitura para o conteúdo do repositório e configurações de concorrência para cancelar execuções antigas da mesma referência.

## Auditoria de dependências — `dependency-audit.yml`

Executa `npm audit --audit-level=high` para backend e frontend em pushes, Pull Requests, agenda semanal e execução manual. A auditoria detecta vulnerabilidades conhecidas nas dependências, mas os resultados devem ser avaliados antes de atualizar pacotes.

## CodeQL — `codeql.yml`

Executa análise estática de segurança sobre JavaScript e TypeScript usando o CodeQL com o conjunto de consultas `security-extended`.

**Quando executa:**
- Push para `main` ou `develop`.
- Pull Request direcionado a `main` ou `develop`.
- Agenda semanal.
- Execução manual pela aba **Actions**.

**Permissões:** o workflow mantém `contents: read` globalmente e concede ao job de análise apenas as permissões necessárias para publicar resultados de segurança (`security-events: write`) e ler metadados das execuções (`actions: read`).

**Como consultar os resultados:**
1. Abra a aba **Security** do repositório e procure **Code scanning**, se o recurso estiver habilitado e disponível.
2. Também é possível abrir **Actions → CodeQL Security Analysis** para ver o resultado da execução.
3. Abra cada alerta, leia a localização e a explicação do fluxo potencialmente vulnerável e avalie a correção.
4. Faça a correção e envie um novo commit para disparar a análise novamente.

O CodeQL identifica padrões de código que podem indicar vulnerabilidades; ele não garante ausência total de falhas e pode exigir análise manual. A publicação de alertas depende das configurações e da disponibilidade do code scanning no repositório.

## Execução manual

No GitHub, abra **Actions**, selecione o workflow e utilize **Run workflow**, quando disponível.

## Diagnóstico de falhas

1. Abra a execução que falhou na aba Actions.
2. Identifique o job e o primeiro comando que retornou erro.
3. Reproduza o comando localmente no diretório correto, quando aplicável.
4. Para falhas de banco, confira as migrações e variáveis de teste.
5. Para falhas E2E, confira os logs do backend/frontend e se os seletores do teste continuam compatíveis com a interface.
6. Para CodeQL, confira se as permissões de análise estão corretas e leia os logs da etapa de inicialização/análise.
7. Corrija o problema e envie um novo commit à branch.

## Limitações

A CI valida código, testes e dependências; não confirma sozinha que a aplicação implantada está saudável, que os segredos de produção estão corretos ou que todos os fluxos funcionam em produção. CodeQL e auditoria de dependências ampliam a detecção de riscos, mas não substituem revisão de código, atualização responsável de dependências ou testes de segurança. Deploy automático não é configurado por estes workflows.
