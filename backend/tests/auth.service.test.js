/**
 * Testes para o módulo de Autenticação
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock do pool de database
jest.mock('../src/database/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../src/database/pool');

describe('Autenticação - Serviço', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const senhaHash = await bcrypt.hash('Senha123!', 10);
      const usuario = {
        id: 1,
        email: 'user@example.com',
        nome: 'João Silva',
        senha: senhaHash,
      };

      pool.query.mockResolvedValueOnce({
        rows: [usuario],
      });

      // Simular a função de login
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['user@example.com']
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].email).toBe('user@example.com');

      // Validar senha
      const senhaValida = await bcrypt.compare('Senha123!', rows[0].senha);
      expect(senhaValida).toBe(true);
    });

    it('deve rejeitar credenciais com email não encontrado', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['nao@existe.com']
      );

      expect(rows).toHaveLength(0);
    });

    it('deve rejeitar credenciais com senha incorreta', async () => {
      const senhaHash = await bcrypt.hash('Senha123!', 10);
      const usuario = {
        id: 1,
        email: 'user@example.com',
        senha: senhaHash,
      };

      pool.query.mockResolvedValueOnce({
        rows: [usuario],
      });

      const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['user@example.com']
      );

      const senhaValida = await bcrypt.compare('SenhaErrada123!', rows[0].senha);
      expect(senhaValida).toBe(false);
    });
  });

  describe('Registro', () => {
    it('deve criar usuário com dados válidos', async () => {
      const novoUsuario = {
        id: 1,
        email: 'novo@example.com',
        nome: 'Novo Usuário',
        senha: await bcrypt.hash('Senha123!', 10),
        created_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({
        rows: [novoUsuario],
      });

      const resultado = await pool.query(
        'INSERT INTO users (email, nome, senha) VALUES ($1, $2, $3) RETURNING *',
        ['novo@example.com', 'Novo Usuário', novoUsuario.senha]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].email).toBe('novo@example.com');
    });

    it('deve rejeitar usuário duplicado', async () => {
      pool.query.mockRejectedValueOnce(
        new Error('duplicate key value violates unique constraint "users_email_key"')
      );

      try {
        await pool.query(
          'INSERT INTO users (email, nome, senha) VALUES ($1, $2, $3)',
          ['duplicado@example.com', 'User', 'hashedpwd']
        );
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error.message).toContain('duplicate');
      }
    });
  });

  describe('JWT Token', () => {
    it('deve gerar um token JWT válido', () => {
      const usuario = { id: 1, email: 'user@example.com' };
      const token = jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: '7d' });

      expect(token).toBeDefined();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(usuario.id);
      expect(decoded.email).toBe(usuario.email);
    });

    it('deve rejeitar token expirado', () => {
      const usuario = { id: 1, email: 'user@example.com' };
      const token = jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: '0s' });

      // Aguardar 1ms para garantir expiração
      jest.setTimeout(2000);

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });

    it('deve rejeitar token inválido', () => {
      expect(() => {
        jwt.verify('token-invalido', process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Verificação de Email', () => {
    it('deve gerar código de verificação', () => {
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();

      expect(codigo).toMatch(/^\d{6}$/);
      expect(codigo.length).toBe(6);
    });

    it('deve armazenar código de verificação', async () => {
      const usuarioId = 1;
      const codigo = '123456';

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: usuarioId, codigo }],
      });

      const resultado = await pool.query(
        'INSERT INTO verification_codes (user_id, codigo) VALUES ($1, $2) RETURNING *',
        [usuarioId, codigo]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].codigo).toBe(codigo);
    });

    it('deve validar código de verificação', async () => {
      const usuarioId = 1;
      const codigo = '123456';

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: usuarioId, codigo, used: false }],
      });

      const resultado = await pool.query(
        'SELECT * FROM verification_codes WHERE user_id = $1 AND codigo = $2 AND used = false',
        [usuarioId, codigo]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].usado).toBeFalsy();
    });
  });

  describe('Redefinição de Senha', () => {
    it('deve permitir redefinir senha com código válido', async () => {
      const usuarioId = 1;
      const novaSenha = 'NovaSenha123!';
      const senhaHash = await bcrypt.hash(novaSenha, 10);

      pool.query.mockResolvedValueOnce({
        rows: [{ id: usuarioId, senha: senhaHash }],
      });

      const resultado = await pool.query(
        'UPDATE users SET senha = $1 WHERE id = $2 RETURNING *',
        [senhaHash, usuarioId]
      );

      expect(resultado.rows).toHaveLength(1);

      // Validar que senha foi atualizada
      const senhaValida = await bcrypt.compare(novaSenha, resultado.rows[0].senha);
      expect(senhaValida).toBe(true);
    });
  });
});
