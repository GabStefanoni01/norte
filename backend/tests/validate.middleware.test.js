/**
 * Testes para middleware de validação
 */

const { validar, sanitizar, validarCustomizado } = require('../src/middlewares/validate.middleware');

describe('Middleware de Validação', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('validar()', () => {
    it('deve passar na validação com dados corretos', () => {
      req.body = {
        email: 'user@example.com',
        senha: 'Senha123!',
      };

      const middleware = validar({ email: 'email', senha: 'senha' });
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar com dados inválidos', () => {
      req.body = {
        email: 'invalid-email',
        senha: 'short',
      };

      const middleware = validar({ email: 'email', senha: 'senha' });
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();

      const resposta = res.json.mock.calls[0][0];
      expect(resposta.sucesso).toBe(false);
      expect(resposta.detalhes.length).toBeGreaterThan(0);
    });

    it('deve validar múltiplos campos', () => {
      req.body = {
        email: 'user@example.com',
        nome: 'João Silva',
        titulo: 'Meu Título',
      };

      const middleware = validar({
        email: 'email',
        nome: 'nome',
        titulo: 'titulo',
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('deve retornar erro para validador desconhecido', () => {
      req.body = { campo: 'valor' };

      const middleware = validar({ campo: 'validador_inexistente' });
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve ignorar campos não especificados no esquema', () => {
      req.body = {
        email: 'user@example.com',
        campoExtra: 'valor',
      };

      const middleware = validar({ email: 'email' });
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('sanitizar()', () => {
    it('deve remover caracteres XSS em strings', () => {
      req.body = {
        titulo: 'Título <script>alert("XSS")</script>',
      };

      const middleware = sanitizar();
      middleware(req, res, next);

      expect(req.body.titulo).not.toContain('<script>');
      expect(req.body.titulo).toContain('&lt;script&gt;');
      expect(next).toHaveBeenCalled();
    });

    it('deve converter caracteres especiais HTML', () => {
      req.body = {
        texto: 'Texto com "aspas" e \'apóstrofos\'',
      };

      const middleware = sanitizar();
      middleware(req, res, next);

      expect(req.body.texto).toContain('&quot;');
      expect(req.body.texto).toContain('&#x27;');
    });

    it('deve sanitizar objetos aninhados', () => {
      req.body = {
        usuario: {
          nome: 'João <b>Silva</b>',
        },
      };

      const middleware = sanitizar();
      middleware(req, res, next);

      expect(req.body.usuario.nome).toContain('&lt;b&gt;');
    });

    it('deve preservar números e valores não-string', () => {
      req.body = {
        idade: 30,
        ativo: true,
        score: null,
      };

      const middleware = sanitizar();
      middleware(req, res, next);

      expect(req.body.idade).toBe(30);
      expect(req.body.ativo).toBe(true);
      expect(req.body.score).toBe(null);
    });

    it('deve sanitizar arrays', () => {
      req.body = {
        tags: ['<tag1>', '<tag2>'],
      };

      const middleware = sanitizar();
      middleware(req, res, next);

      expect(req.body.tags[0]).toContain('&lt;tag1&gt;');
    });
  });

  describe('validarCustomizado()', () => {
    it('deve passar se validação customizada não lançar erro', async () => {
      const middleware = validarCustomizado(async (req) => {
        if (!req.body.campo) {
          throw new Error('Campo obrigatório');
        }
      });

      req.body = { campo: 'valor' };

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar se validação customizada lançar erro', async () => {
      const middleware = validarCustomizado(async (req) => {
        throw new Error('Validação falhou');
      });

      req.body = {};

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    it('deve comparar valores em validação customizada', async () => {
      const middleware = validarCustomizado(async (req) => {
        if (req.body.senha !== req.body.confirmacao) {
          throw new Error('Senhas não conferem');
        }
      });

      req.body = {
        senha: 'Senha123!',
        confirmacao: 'Senha123!',
      };

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('deve rejeitar se valores não conferem', async () => {
      const middleware = validarCustomizado(async (req) => {
        if (req.body.senha !== req.body.confirmacao) {
          throw new Error('Senhas não conferem');
        }
      });

      req.body = {
        senha: 'Senha123!',
        confirmacao: 'Diferente123!',
      };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();

      const resposta = res.json.mock.calls[0][0];
      expect(resposta.erro).toContain('não conferem');
    });
  });

  describe('Integração de validação e sanitização', () => {
    it('deve validar após sanitizar - mantendo conteúdo válido', () => {
      req.body = {
        email: 'user@example.com',
        nome: 'João Silva',
      };

      const middlewareSanitizar = sanitizar();
      middlewareSanitizar(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);

      next.mockClear();

      const middlewareValidar = validar({ email: 'email', nome: 'nome' });
      middlewareValidar(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('deve sanitizar e depois validar com XSS removido', () => {
      req.body = {
        email: 'user@example.com',
        titulo: '<script>alert(1)</script>Meu Título',
      };

      const middlewareSanitizar = sanitizar();
      middlewareSanitizar(req, res, next);

      // Após sanitização, o título terá caracteres escapados
      expect(req.body.titulo).toContain('&lt;script&gt;');

      next.mockClear();

      const middlewareValidar = validar({ email: 'email', titulo: 'titulo' });
      middlewareValidar(req, res, next);

      // A validação deve passar porque o conteúdo ainda tem mais de 5 caracteres
      expect(next).toHaveBeenCalled();
    });
  });
});
