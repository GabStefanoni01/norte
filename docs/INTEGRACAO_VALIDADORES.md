# 🔧 Guia de Integração - Como Usar Validadores em Cada Módulo

## 📌 Padrão Geral

```javascript
// 1. Importar validadores
const { validar, sanitizar } = require('../../middlewares/validate.middleware');

// 2. Aplicar no router
router.post('/rota', validar({ campo: 'tipo' }), controller);

// 3. Response automático em caso de erro:
// Status 400
{
  "sucesso": false,
  "erro": "Validação falhou",
  "detalhes": ["mensagem de erro"]
}
```

---

## 🔑 Auth Module

### Arquivo: `backend/src/modules/auth/auth.routes.js`

```javascript
const { validar, sanitizar } = require('../../middlewares/validate.middleware');

// POST /auth/login
router.post('/login',
  validar({ 
    email: 'email', 
    senha: 'senha' 
  }),
  controller.login
);

// POST /auth/register
router.post('/register',
  sanitizar(), // Sanitizar nome
  validar({ 
    nome: 'nome',
    email: 'email', 
    senha: 'senha'
  }),
  controller.register
);

// POST /auth/reset-password
router.post('/reset-password',
  validar({ 
    email: 'email'
  }),
  controller.resetPassword
);

// POST /auth/new-password/:token
router.post('/new-password/:token',
  validar({ 
    novaSenha: 'senha'
  }),
  controller.newPassword
);
```

### Alteração no Controller

```javascript
// ANTES
async login(req, res) {
  const { email, senha } = req.body;
  
  // Validação manual
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha obrigatórios' });
  }
  
  // ... resto do código
}

// DEPOIS (com middleware)
async login(req, res) {
  const { email, senha } = req.body; // Já validado pelo middleware
  
  // ... usar diretamente sem checar
  const usuario = await provider.encontrarPorEmail(email);
  // ...
}
```

---

## 👥 Users Module

### Arquivo: `backend/src/modules/users/users.routes.js`

```javascript
const { validar, sanitizar } = require('../../middlewares/validate.middleware');

// POST /users/perfil
router.post('/perfil',
  authGuard,
  sanitizar(),
  validar({
    escolaridade: 'status',
    objetivos: 'conteudo'
  }),
  controller.atualizarPerfil
);

// PUT /users/idade/:userId
router.put('/idade/:userId',
  authGuard,
  validar({
    idade: 'numero'
  }),
  controller.atualizarIdade
);
```

---

## 💬 Community Module

### Arquivo: `backend/src/modules/community/community.routes.js`

```javascript
const { validar, sanitizar } = require('../../middlewares/validate.middleware');

// POST /community/posts
router.post('/posts',
  authGuard,
  sanitizar(), // Sanitizar conteúdo
  validar({
    titulo: 'titulo',
    conteudo: 'conteudo'
  }),
  controller.criarPost
);

// PUT /community/posts/:id
router.put('/posts/:id',
  authGuard,
  sanitizar(),
  validar({
    titulo: 'titulo',
    conteudo: 'conteudo'
  }),
  controller.atualizarPost
);

// POST /community/comments
router.post('/comments',
  authGuard,
  sanitizar(),
  validar({
    postId: 'numero',
    texto: 'conteudo' // min: 3, max: 1000
  }),
  controller.criarComentario
);

// POST /community/reactions
router.post('/reactions',
  authGuard,
  validar({
    postId: 'numero',
    tipo: 'status' // 'like', 'love', etc
  }),
  controller.adicionarReacao
);
```

### Validador Customizado (Comentário)

```javascript
const { validarCustomizado } = require('../../middlewares/validate.middleware');

router.post('/comments',
  authGuard,
  validarCustomizado(async (req) => {
    const { postId } = req.body;
    
    // Verificar se post existe
    const post = await pool.query(
      'SELECT id FROM community_posts WHERE id = $1',
      [postId]
    );
    
    if (post.rows.length === 0) {
      throw new Error('Post não encontrado');
    }
  }),
  controller.criarComentario
);
```

---

## 📋 Plans Module

### Arquivo: `backend/src/modules/plans/plans.routes.js`

```javascript
const { validar, sanitizar } = require('../../middlewares/validate.middleware');

// POST /plans/criar
router.post('/criar',
  authGuard,
  sanitizar(),
  validar({
    titulo: 'titulo',
    descricao: 'conteudo',
    prioridade: 'prioridade'
  }),
  controller.criarPlano
);

// PUT /plans/:id
router.put('/:id',
  authGuard,
  sanitizar(),
  validar({
    status: 'status'
  }),
  controller.atualizarPlano
);
```

---

## 🏆 Achievements Module

### Arquivo: `backend/src/modules/achievements/achievements.routes.js`

```javascript
const { validar } = require('../../middlewares/validate.middleware');

// POST /achievements
router.post('/',
  authGuard,
  validar({
    titulo: 'titulo',
    descricao: 'conteudo',
    categoria: 'status'
  }),
  controller.criar
);
```

---

## 📧 Contact Module

### Arquivo: `backend/src/modules/contact/contact.routes.js`

```javascript
const { validar, sanitizar } = require('../../middlewares/validate.middleware');

// POST /contact/send
router.post('/send',
  sanitizar(),
  validar({
    nome: 'nome',
    email: 'email',
    mensagem: 'conteudo'
  }),
  controller.enviarMensagem
);
```

---

## 💳 Billing Module

### Arquivo: `backend/src/modules/billing/billing.routes.js`

```javascript
const { validar } = require('../../middlewares/validate.middleware');

// POST /billing/checkout
router.post('/checkout',
  authGuard,
  validar({
    planId: 'numero',
    metodoPagamento: 'status'
  }),
  controller.iniciarCheckout
);
```

---

## 🎯 Opportunities Module

### Arquivo: `backend/src/modules/opportunities/opportunities.routes.js`

```javascript
const { validar, sanitizar } = require('../../middlewares/validate.middleware');

// POST /opportunities
router.post('/',
  authGuard,
  sanitizar(),
  validar({
    titulo: 'titulo',
    empresa: 'nome',
    descricao: 'conteudo',
    link: 'url'
  }),
  controller.criar
);

// POST /opportunities/:id/aplicar
router.post('/:id/aplicar',
  authGuard,
  controller.aplicar
);
```

---

## 🛡️ Admin Module

### Arquivo: `backend/src/modules/admin/admin.routes.js`

```javascript
const { validar } = require('../../middlewares/validate.middleware');

// POST /admin/usuarios/:id/ban
router.post('/usuarios/:id/ban',
  authGuard,
  adminGuard,
  validar({
    motivo: 'conteudo'
  }),
  controller.banirUsuario
);

// DELETE /admin/posts/:id
router.delete('/posts/:id',
  authGuard,
  adminGuard,
  controller.deletarPost
);
```

---

## 🎨 Frontend - Integration Examples

### Register Component

```typescript
import { emailValidator, senhaValidator, nomeValidator } from '../../validators/validators';

@Component({...})
export class RegisterComponent {
  form = this.fb.group({
    nome: ['', [Validators.required, nomeValidator()]],
    email: [
      '',
      [Validators.required, emailValidator()],
      [emailUnicoValidator(this.authService)]
    ],
    senha: ['', [Validators.required, senhaValidator()]],
    confirmacao: ['', [Validators.required, senhaConfirmacaoValidator('senha')]],
  });

  getMensagemErro(campo: string): string {
    const errors = this.form.get(campo)?.errors;
    
    const MENSAGENS: { [key: string]: string } = {
      'required': 'Campo obrigatório',
      'email': 'Email inválido',
      'emailLongo': 'Email muito longo',
      'emailEmUso': 'Email já em uso',
      'minimo': `Mínimo ${errors?.['minimo'].min} caracteres`,
      'nomeInvalido': 'Contém caracteres inválidos',
      'maiuscula': 'Deve conter maiúscula',
      'minuscula': 'Deve conter minúscula',
      'numero': 'Deve conter número',
      'especial': 'Deve conter caractere especial',
      'senhasNaoConferem': 'Senhas não conferem',
    };

    for (const [key, mensagem] of Object.entries(MENSAGENS)) {
      if (errors?.[key]) return mensagem;
    }

    return 'Erro de validação';
  }
}
```

### Login Component

```typescript
import { emailValidator } from '../../validators/validators';

@Component({...})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, emailValidator()]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    lembrar: [false],
  });
}
```

### Create Post Component

```typescript
import { tituloValidator, conteudoValidator } from '../../validators/validators';

@Component({...})
export class CreatePostComponent {
  form = this.fb.group({
    titulo: ['', [Validators.required, tituloValidator(5, 250)]],
    conteudo: ['', [Validators.required, conteudoValidator(10, 5000)]],
  });
}
```

---

## 📊 Checklist de Integração

### Backend

- [ ] Auth
  - [ ] login validar email, senha
  - [ ] register validar nome, email, senha
  - [ ] reset-password validar email
  - [ ] new-password validar senha

- [ ] Community
  - [ ] criarPost sanitizar, validar titulo, conteudo
  - [ ] atualizarPost sanitizar, validar titulo, conteudo
  - [ ] criarComentario sanitizar, validar texto
  - [ ] adicionarReacao validar postId, tipo

- [ ] Users
  - [ ] atualizarPerfil validar campos
  - [ ] atualizarIdade validar idade

- [ ] Plans
  - [ ] criar sanitizar, validar campos

- [ ] Contact
  - [ ] enviar sanitizar, validar email, nome, mensagem

- [ ] Admin
  - [ ] deletar validar permissão

### Frontend

- [ ] Login - validadores integrados
- [ ] Register - validadores integrados (✅ done)
- [ ] Create Post - validadores integrados
- [ ] Edit Post - validadores integrados
- [ ] Contact Form - validadores integrados
- [ ] Checkout - validadores integrados

---

## 🚀 Prioridade de Integração

### 1. Alta Prioridade (hoje)
```
1. Auth (login, register)
2. Community (posts, comments)
3. Contact form
```

### 2. Média Prioridade (amanhã)
```
1. Plans
2. Users profile
3. Opportunities
```

### 3. Baixa Prioridade (próxima semana)
```
1. Admin routes
2. Billing
3. Achievements
```

---

## ✅ Validação de Integração

Para validar se tudo está funcionando:

```bash
# Backend
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "senha": "short"}'

# Resultado esperado (400):
{
  "sucesso": false,
  "erro": "Validação falhou",
  "detalhes": [
    "Email inválido",
    "Senha deve ter no mínimo 8 caracteres"
  ]
}

# Frontend
# Abrir console do browser em página com formulário
# Tentar submeter com dados inválidos
# Deve aparecer mensagens de erro em tempo real
```

---

**Tempo estimado de integração completa: 4-6 horas**
**Status: Pronto para começar ✅**
