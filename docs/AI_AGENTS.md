# Arquitetura de agentes de IA do Norte

## Objetivo

Separar responsabilidades de IA por domínio, mantendo a API, as regras de negócio e as permissões sob controle do backend. A primeira implementação é o agente de evolução profissional, reutilizando o provedor Gemini já existente.

## Princípios

- **Especialização:** cada agente tem uma tarefa delimitada e instruções próprias.
- **Contrato validado:** respostas geradas por IA são validadas antes de chegar às regras de negócio.
- **Fallback determinístico:** se o provedor estiver indisponível ou a resposta for inválida, o módulo de planos usa os templates existentes.
- **Consentimento e limites:** as verificações de consentimento e cota continuam nos serviços de domínio existentes.
- **Sem autonomia irrestrita:** agentes não executam SQL, não alteram diretamente dados e não recebem ferramentas genéricas. O backend decide quando persistir alterações.
- **Provedor compartilhado:** reutilizar `ai.provider.js` evita duplicar timeout, retry, configuração e integração com o Gemini.

## Fluxo do agente de evolução

1. O endpoint autenticado de geração de plano chama `plans.service`.
2. O serviço mantém as verificações de domínio e chama `plans.ai`.
3. `plans.ai` verifica configuração e consentimento, e monta o contexto com `ai.context`.
4. `evolution.agent.js` recebe esse contexto, cria a instrução especializada e solicita a geração ao provedor existente.
5. A resposta é interpretada e validada: exatamente três meses, dois a quatro itens por mês, descrições não vazias e tipos permitidos.
6. O agente normaliza os itens para o contrato que o módulo de planos já utiliza.
7. Se houver falha ou formato inválido, retorna `null`; `plans.service` continua responsável pelo fallback por templates e pela persistência.

## Próximas etapas

1. Adicionar testes unitários e de integração ao agente de evolução.
2. Extrair um contrato comum de entrada/saída e métricas seguras para execuções dos agentes.
3. Implementar agentes de descoberta e preparação profissional reutilizando o mesmo provedor.
4. Introduzir roteamento explícito no Mentor IA apenas depois de validar os agentes especializados.
5. Adicionar oportunidades com fontes verificáveis; nunca inventar vagas, cursos ou links.

## Fora do escopo inicial

- Não trocar o provedor de IA.
- Não introduzir framework de agentes sem necessidade demonstrada.
- Não permitir que a IA execute ações persistentes sem validação e autorização do backend.
- Não remover o comportamento atual quando a chave Gemini estiver ausente.
