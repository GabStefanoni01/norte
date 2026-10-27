# Qualidade, testes e segurança

## Testes

O backend utiliza Jest e Supertest. O frontend utiliza Jasmine e Karma.

### Backend

```bash
cd backend
npm test -- --runInBand
npm test -- --coverage --runInBand
npm run lint
```

Os testes devem cobrir, conforme o tipo de alteração:

- cenários válidos e inválidos de entrada;
- regras de negócio;
- autenticação e autorização;
- erros de dependências externas;
- respostas HTTP e contratos da API;
- regressões corrigidas.

### Frontend

```bash
cd frontend
npm test
npm run build
```

Para componentes e serviços, priorize comportamentos observáveis, estados de carregamento, erros e formulários inválidos.

## Segurança

### Segredos e configuração

- Mantenha credenciais em variáveis de ambiente ou no gerenciador de segredos da plataforma.
- Não faça commit de `.env`, tokens, senhas, chaves de API ou dumps com dados reais.
- Se um segredo for exposto, revogue-o e gere outro; apagar o valor do commit mais recente não invalida a credencial vazada.
- Use `.env.example` apenas com valores fictícios.

### Autenticação e dados

- Armazene senhas somente com hash seguro, nunca em texto puro.
- Valide e normalize dados no backend.
- Verifique autorização no servidor para cada recurso protegido; esconder um botão no frontend não é controle de acesso.
- Não registre senhas, tokens, conteúdo privado de conversas ou dados pessoais desnecessários nos logs.

### HTTP e abuso

O backend inclui bibliotecas para cabeçalhos de segurança, CORS e limitação de requisições. Confirme as configurações reais em `backend/src/app.js` e nos middlewares antes de alterar políticas de produção.

- Restrinja CORS às origens esperadas em produção.
- Ajuste limites de requisição de acordo com o risco e o uso legítimo.
- Use HTTPS em ambientes públicos.
- Defina timeouts para chamadas externas e trate falhas sem expor detalhes internos ao cliente.

### IA e provedores externos

- Mantenha chaves dos provedores no backend.
- Trate conteúdo do usuário e respostas do modelo como dados não confiáveis.
- Não use respostas de IA como autorização para operações privilegiadas.
- Implemente tratamento de timeout, falhas transitórias e limites de uso.
- Informe limitações relevantes ao usuário e evite promessas de resultados profissionais.

### Banco de dados

- Use consultas parametrizadas.
- Faça backups conforme a criticidade dos dados e teste a restauração.
- Use credenciais com privilégios mínimos.
- Planeje migrações reversíveis ou documente o procedimento de recuperação.

## Checklist para Pull Requests

- [ ] A mudança tem objetivo e escopo claros.
- [ ] Testes relevantes foram adicionados ou atualizados.
- [ ] Lint e build foram executados.
- [ ] Nenhum segredo ou dado real foi incluído.
- [ ] Validação e autorização acontecem no backend quando necessário.
- [ ] Documentação e variáveis de ambiente foram atualizadas.
- [ ] Impactos em migrações e compatibilidade foram avaliados.
