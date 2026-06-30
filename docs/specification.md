# Especificação do produto

## 1. Visão geral do sistema

A plataforma é dividida em três camadas:

### Frontend (Angular)
Responsável por: interface do usuário, telas, experiência do jovem, dashboards
e comunicação com o backend. Hospedagem: Vercel.

### Backend (Node.js)
Responsável por: regras do sistema, usuários, autenticação, dados, integração
com IA, segurança e exposição de APIs. Hospedagem: Vercel (serverless
functions) ou arquitetura compatível.

### Inteligência Artificial
A IA atua como "mentor": não apenas responde perguntas, mas mantém contexto do
usuário (idade, escolaridade, interesses, histórico) para orientar decisões.

## 2. Módulos do sistema

| # | Módulo | Resumo |
|---|---|---|
| 1 | Cadastro e Perfil | Coleta dados iniciais (nome, idade, cidade, escolaridade, situação atual, interesses) |
| 2 | Teste de descoberta pessoal | Perguntas analisadas pela IA para sugerir áreas de atuação |
| 3 | Plano de evolução | Roadmap mensal com etapas e progresso (concluído / em andamento / pendente) |
| 4 | Mentor IA | Chat especializado em orientação de carreira |
| 5 | Oportunidades | Cursos gratuitos, vagas, programas, eventos e bolsas, com filtros |
| 6 | Currículo inteligente | Geração de currículo a partir de projetos/cursos + simulação de entrevista |
| 7 | Dashboard do jovem | Progresso, próximo passo e recomendação diária da IA |
| 8 | Gamificação | Conquistas e níveis (Explorador, Aprendiz, Criador, Profissional) |

## 3. Modelo de dados (PostgreSQL)

```
users            (id, nome, email, senha, idade, cidade)
profiles         (id, user_id, escolaridade, interesses, objetivos, habilidades)
goals            (id, user_id, titulo, descricao, status, data)
plans            (id, user_id, etapas, progresso)
ai_conversations (id, user_id, mensagem, resposta, data)
opportunities    (id, titulo, empresa, categoria, link)
```

## 4. Backend — estrutura de pastas

```
backend/
  src/
    modules/
      auth/
      users/
      profile/
      ai/
      plans/
      opportunities/
    database/
    routes/
    controllers/
    services/
```

### Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Autenticação do usuário |
| POST | `/auth/register` | Cadastro de novo usuário |
| POST | `/profile` | Criação/atualização de perfil |
| POST | `/ai/chat` | Envio de mensagem ao mentor IA |
| GET | `/plans/:userId` | Consulta do plano de evolução |
| GET | `/opportunities` | Listagem de oportunidades (com filtros) |

## 5. Frontend — estrutura de pastas

```
frontend/
  src/
    app/
      pages/
        login/
        dashboard/
        profile/
        chat/
        plans/
        opportunities/
      components/
        navbar/
        card/
        button/
      services/
        api.service.ts
        auth.service.ts
        ai.service.ts
```

## 6. Segurança

- Autenticação via JWT
- Senhas com hash (bcrypt)
- Proteção de rotas (guards no Angular, middleware no Express)
- Validação de dados de entrada em todas as rotas
