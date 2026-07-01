# Norte

**Encontre seu norte.**

Plataforma de mentoria para jovens em início de carreira, combinando um plano
de evolução personalizado com um mentor baseado em IA.

## Visão geral

| Camada | Tecnologia | Hospedagem |
|---|---|---|
| Frontend | Angular | Vercel |
| Backend | Node.js (Express) | Vercel Functions |
| Banco de dados | PostgreSQL | - |
| IA | Mentor conversacional com contexto do usuário | - |

## Módulos

1. **Cadastro e Perfil** — identidade inicial do jovem (escolaridade, situação, interesses)
2. **Teste de descoberta pessoal** — IA mapeia perfil comportamental e sugere áreas
3. **Plano de evolução** — roadmap mensal gerado pela IA, com etapas acompanháveis
4. **Mentor IA** — chat especializado em orientação de carreira
5. **Oportunidades** — cursos, vagas, bolsas e eventos filtráveis
6. **Currículo inteligente** — geração de currículo e simulação de entrevista
7. **Dashboard do jovem** — progresso, próximos passos e recomendações
8. **Gamificação** — conquistas e níveis para manter engajamento

Detalhes completos da especificação em [`docs/specification.md`](docs/specification.md).

## Estrutura do repositório

```
backend/   API Node.js (Express + PostgreSQL)
frontend/  Aplicação Angular
docs/      Especificação e documentação de arquitetura
```

## Status

🚧 Em desenvolvimento — ver [issues](../../issues) para o roadmap atual.

## Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT
- **Frontend:** Angular, Tailwind CSS
- **IA:** integração via API de chat com contexto de usuário

## Licença

MIT — ver [LICENSE](LICENSE).
