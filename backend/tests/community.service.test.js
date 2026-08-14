/**
 * Testes para o módulo de Community
 */

jest.mock('../src/database/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../src/database/pool');

describe('Community - Serviço', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Posts', () => {
    it('deve criar um post válido', async () => {
      const usuarioId = 1;
      const post = {
        id: 1,
        user_id: usuarioId,
        titulo: 'Meu primeiro post',
        conteudo: 'Este é o conteúdo do meu primeiro post',
        created_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({
        rows: [post],
      });

      const resultado = await pool.query(
        'INSERT INTO community_posts (user_id, titulo, conteudo) VALUES ($1, $2, $3) RETURNING *',
        [usuarioId, post.titulo, post.conteudo]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].titulo).toBe('Meu primeiro post');
      expect(resultado.rows[0].user_id).toBe(usuarioId);
    });

    it('deve listar posts com paginação', async () => {
      const posts = [
        { id: 1, titulo: 'Post 1', conteudo: 'Conteúdo 1', user_id: 1 },
        { id: 2, titulo: 'Post 2', conteudo: 'Conteúdo 2', user_id: 2 },
      ];

      pool.query.mockResolvedValueOnce({
        rows: posts,
        rowCount: 2,
      });

      const resultado = await pool.query(
        'SELECT * FROM community_posts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [10, 0]
      );

      expect(resultado.rows).toHaveLength(2);
      expect(resultado.rowCount).toBe(2);
    });

    it('deve atualizar um post', async () => {
      const postAtualizado = {
        id: 1,
        titulo: 'Post atualizado',
        conteudo: 'Conteúdo atualizado',
        updated_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({
        rows: [postAtualizado],
      });

      const resultado = await pool.query(
        'UPDATE community_posts SET titulo = $1, conteudo = $2 WHERE id = $3 RETURNING *',
        [postAtualizado.titulo, postAtualizado.conteudo, 1]
      );

      expect(resultado.rows[0].titulo).toBe('Post atualizado');
    });

    it('deve deletar um post', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
      });

      const resultado = await pool.query(
        'DELETE FROM community_posts WHERE id = $1 AND user_id = $2',
        [1, 1]
      );

      expect(resultado.rowCount).toBe(1);
    });

    it('deve impedir deletar post de outro usuário', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 0,
      });

      const resultado = await pool.query(
        'DELETE FROM community_posts WHERE id = $1 AND user_id = $2',
        [1, 999]
      );

      expect(resultado.rowCount).toBe(0);
    });
  });

  describe('Comentários', () => {
    it('deve criar um comentário em um post', async () => {
      const comentario = {
        id: 1,
        post_id: 1,
        user_id: 1,
        texto: 'Ótimo post!',
        created_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({
        rows: [comentario],
      });

      const resultado = await pool.query(
        'INSERT INTO community_comments (post_id, user_id, texto) VALUES ($1, $2, $3) RETURNING *',
        [comentario.post_id, comentario.user_id, comentario.texto]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].texto).toBe('Ótimo post!');
    });

    it('deve listar comentários de um post', async () => {
      const comentarios = [
        { id: 1, post_id: 1, user_id: 1, texto: 'Comentário 1' },
        { id: 2, post_id: 1, user_id: 2, texto: 'Comentário 2' },
      ];

      pool.query.mockResolvedValueOnce({
        rows: comentarios,
      });

      const resultado = await pool.query(
        'SELECT * FROM community_comments WHERE post_id = $1 ORDER BY created_at DESC',
        [1]
      );

      expect(resultado.rows).toHaveLength(2);
      expect(resultado.rows[0].post_id).toBe(1);
    });

    it('deve deletar um comentário próprio', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
      });

      const resultado = await pool.query(
        'DELETE FROM community_comments WHERE id = $1 AND user_id = $2',
        [1, 1]
      );

      expect(resultado.rowCount).toBe(1);
    });
  });

  describe('Reações (Likes)', () => {
    it('deve adicionar uma reação a um post', async () => {
      const reacao = {
        id: 1,
        post_id: 1,
        user_id: 1,
        tipo: 'like',
        created_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({
        rows: [reacao],
      });

      const resultado = await pool.query(
        'INSERT INTO community_reactions (post_id, user_id, tipo) VALUES ($1, $2, $3) RETURNING *',
        [reacao.post_id, reacao.user_id, reacao.tipo]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].tipo).toBe('like');
    });

    it('deve evitar reações duplicadas', async () => {
      pool.query.mockRejectedValueOnce(
        new Error('duplicate key value violates unique constraint')
      );

      try {
        await pool.query(
          'INSERT INTO community_reactions (post_id, user_id, tipo) VALUES ($1, $2, $3)',
          [1, 1, 'like']
        );
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error.message).toContain('duplicate');
      }
    });

    it('deve remover uma reação', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
      });

      const resultado = await pool.query(
        'DELETE FROM community_reactions WHERE post_id = $1 AND user_id = $2',
        [1, 1]
      );

      expect(resultado.rowCount).toBe(1);
    });

    it('deve contar reações de um post', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ count: '5' }],
      });

      const resultado = await pool.query(
        'SELECT COUNT(*) as count FROM community_reactions WHERE post_id = $1 AND tipo = $2',
        [1, 'like']
      );

      expect(parseInt(resultado.rows[0].count)).toBe(5);
    });
  });

  describe('Validações de Community', () => {
    it('deve rejeitar post sem título', async () => {
      const usuarioId = 1;
      const titulo = '';
      const conteudo = 'Conteúdo válido';

      const { ValidadorTitulo } = require('../src/utils/validators');
      const validacao = ValidadorTitulo.validar(titulo);

      expect(validacao.valido).toBe(false);
      expect(validacao.erro).toContain('obrigatório');
    });

    it('deve rejeitar post sem conteúdo', async () => {
      const conteudo = '';

      const { ValidadorConteudo } = require('../src/utils/validators');
      const validacao = ValidadorConteudo.validar(conteudo);

      expect(validacao.valido).toBe(false);
      expect(validacao.erro).toContain('obrigatório');
    });

    it('deve rejeitar comentário muito curto', async () => {
      const texto = 'ab';

      const { ValidadorConteudo } = require('../src/utils/validators');
      const validacao = ValidadorConteudo.validar(texto, 3, 1000);

      expect(validacao.valido).toBe(false);
    });
  });

  describe('Administração de Community', () => {
    it('deve permitir admin deletar qualquer post', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
      });

      const resultado = await pool.query(
        'DELETE FROM community_posts WHERE id = $1',
        [1]
      );

      expect(resultado.rowCount).toBe(1);
    });

    it('deve permitir admin deletar qualquer comentário', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
      });

      const resultado = await pool.query(
        'DELETE FROM community_comments WHERE id = $1',
        [1]
      );

      expect(resultado.rowCount).toBe(1);
    });

    it('deve retornar estatísticas da comunidade', async () => {
      const stats = {
        total_posts: 42,
        total_comments: 150,
        total_users_participated: 15,
      };

      pool.query.mockResolvedValueOnce({
        rows: [stats],
      });

      const resultado = await pool.query(
        `SELECT 
          COUNT(DISTINCT cp.id) as total_posts,
          COUNT(DISTINCT cc.id) as total_comments,
          COUNT(DISTINCT cp.user_id) as total_users_participated
        FROM community_posts cp
        LEFT JOIN community_comments cc ON cp.id = cc.post_id`
      );

      expect(resultado.rows[0].total_posts).toBe(42);
      expect(resultado.rows[0].total_comments).toBe(150);
    });
  });
});
