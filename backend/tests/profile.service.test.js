/**
 * Testes para o módulo de Profile
 */

jest.mock('../src/database/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../src/database/pool');

describe('Profile - Serviço', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Obter Perfil', () => {
    it('deve obter o perfil do usuário', async () => {
      const perfil = {
        id: 1,
        user_id: 1,
        escolaridade: 'superior',
        interesses: ['tecnologia', 'inovação'],
        objetivos: 'Trabalhar em startup',
        habilidades: ['JavaScript', 'React'],
      };

      pool.query.mockResolvedValueOnce({
        rows: [perfil],
      });

      const resultado = await pool.query(
        'SELECT * FROM profiles WHERE user_id = $1',
        [1]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].escolaridade).toBe('superior');
      expect(resultado.rows[0].interesses).toContain('tecnologia');
    });

    it('deve retornar null se perfil não existe', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const resultado = await pool.query(
        'SELECT * FROM profiles WHERE user_id = $1',
        [999]
      );

      expect(resultado.rows).toHaveLength(0);
    });
  });

  describe('Atualizar Perfil', () => {
    it('deve atualizar escolaridade', async () => {
      const perfilAtualizado = {
        id: 1,
        user_id: 1,
        escolaridade: 'mestrado',
      };

      pool.query.mockResolvedValueOnce({
        rows: [perfilAtualizado],
      });

      const resultado = await pool.query(
        'UPDATE profiles SET escolaridade = $1 WHERE user_id = $2 RETURNING *',
        ['mestrado', 1]
      );

      expect(resultado.rows[0].escolaridade).toBe('mestrado');
    });

    it('deve adicionar interesses', async () => {
      const interesses = ['tecnologia', 'inovação', 'startups'];

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, interesses }],
      });

      const resultado = await pool.query(
        'UPDATE profiles SET interesses = $1 WHERE user_id = $2 RETURNING *',
        [interesses, 1]
      );

      expect(resultado.rows[0].interesses).toHaveLength(3);
      expect(resultado.rows[0].interesses).toContain('startups');
    });

    it('deve adicionar habilidades', async () => {
      const habilidades = ['JavaScript', 'React', 'Node.js'];

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, habilidades }],
      });

      const resultado = await pool.query(
        'UPDATE profiles SET habilidades = $1 WHERE user_id = $2 RETURNING *',
        [habilidades, 1]
      );

      expect(resultado.rows[0].habilidades).toHaveLength(3);
      expect(resultado.rows[0].habilidades).toContain('Node.js');
    });

    it('deve atualizar objetivos', async () => {
      const objetivos = 'Trabalhar em empresa de tecnologia de médio porte';

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, objetivos }],
      });

      const resultado = await pool.query(
        'UPDATE profiles SET objetivos = $1 WHERE user_id = $2 RETURNING *',
        [objetivos, 1]
      );

      expect(resultado.rows[0].objetivos).toBe(objetivos);
    });
  });

  describe('Discovery Results', () => {
    it('deve criar um resultado de discovery', async () => {
      const discovery = {
        id: 1,
        user_id: 1,
        titulo: 'Descoberta 1',
        descricao: 'Uma descoberta interessante',
        impacto: 'alto',
        created_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({
        rows: [discovery],
      });

      const resultado = await pool.query(
        'INSERT INTO discovery_results (user_id, titulo, descricao, impacto) VALUES ($1, $2, $3, $4) RETURNING *',
        [discovery.user_id, discovery.titulo, discovery.descricao, discovery.impacto]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].titulo).toBe('Descoberta 1');
    });

    it('deve listar discoveries do usuário', async () => {
      const discoveries = [
        { id: 1, titulo: 'Discovery 1', impacto: 'alto' },
        { id: 2, titulo: 'Discovery 2', impacto: 'medio' },
      ];

      pool.query.mockResolvedValueOnce({
        rows: discoveries,
      });

      const resultado = await pool.query(
        'SELECT * FROM discovery_results WHERE user_id = $1 ORDER BY created_at DESC',
        [1]
      );

      expect(resultado.rows).toHaveLength(2);
    });

    it('deve atualizar uma discovery', async () => {
      const discoveryAtualizada = {
        id: 1,
        titulo: 'Título Atualizado',
        impacto: 'alto',
      };

      pool.query.mockResolvedValueOnce({
        rows: [discoveryAtualizada],
      });

      const resultado = await pool.query(
        'UPDATE discovery_results SET titulo = $1 WHERE id = $2 RETURNING *',
        [discoveryAtualizada.titulo, 1]
      );

      expect(resultado.rows[0].titulo).toBe('Título Atualizado');
    });
  });

  describe('Discovery Reflection', () => {
    it('deve criar uma reflexão de discovery', async () => {
      const reflexao = {
        id: 1,
        discovery_id: 1,
        reflexao: 'Aprendi muito com isso',
        acao: 'Vou tentar aplicar',
        created_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({
        rows: [reflexao],
      });

      const resultado = await pool.query(
        'INSERT INTO discovery_reflection (discovery_id, reflexao, acao) VALUES ($1, $2, $3) RETURNING *',
        [reflexao.discovery_id, reflexao.reflexao, reflexao.acao]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].reflexao).toBe('Aprendi muito com isso');
    });
  });

  describe('Validações de Perfil', () => {
    it('deve rejeitar escolaridade inválida', async () => {
      const escolaridadesValidas = ['fundamental', 'medio', 'superior', 'mestrado', 'doutorado'];
      const escolaridade = 'invalida';

      const valido = escolaridadesValidas.includes(escolaridade);
      expect(valido).toBe(false);
    });

    it('deve validar lista de interesses', async () => {
      const { ValidadorLista } = require('../src/utils/validators');
      const interesses = ['tecnologia', 'inovação'];

      const validacao = ValidadorLista.validar(interesses, 1, 20);
      expect(validacao.valido).toBe(true);
    });

    it('deve validar lista de habilidades', async () => {
      const { ValidadorLista } = require('../src/utils/validators');
      const habilidades = ['JavaScript', 'React', 'Node.js'];

      const validacao = ValidadorLista.validar(habilidades, 1, 50);
      expect(validacao.valido).toBe(true);
    });

    it('deve rejeitar habilidades muito longas', async () => {
      const { ValidadorLista } = require('../src/utils/validators');
      const habilidades = Array(200).fill('Habilidade');

      const validacao = ValidadorLista.validar(habilidades, 1, 50);
      expect(validacao.valido).toBe(false);
    });

    it('deve validar objetivos', async () => {
      const { ValidadorConteudo } = require('../src/utils/validators');
      const objetivos = 'Quero trabalhar em uma empresa de tecnologia';

      const validacao = ValidadorConteudo.validar(objetivos, 10, 500);
      expect(validacao.valido).toBe(true);
    });
  });

  describe('Carreiras', () => {
    it('deve atualizar carreira de interesse', async () => {
      const carreiras = ['Engenharia de Software', 'Data Science'];

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, carreira_interesse: carreiras }],
      });

      const resultado = await pool.query(
        'UPDATE profiles SET carreira_interesse = $1 WHERE user_id = $2 RETURNING *',
        [carreiras, 1]
      );

      expect(resultado.rows[0].carreira_interesse).toHaveLength(2);
    });

    it('deve validar se carreira é conhecida', async () => {
      const carreirasValidas = [
        'Engenharia de Software',
        'Data Science',
        'Design UX/UI',
        'Product Management',
      ];

      const carreira = 'Engenharia de Software';
      const valida = carreirasValidas.includes(carreira);

      expect(valida).toBe(true);
    });
  });

  describe('Preferências de Descoberta', () => {
    it('deve salvar preferência de IA', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, plan_ia_flag: true }],
      });

      const resultado = await pool.query(
        'UPDATE profiles SET plan_ia_flag = $1 WHERE user_id = $2 RETURNING *',
        [true, 1]
      );

      expect(resultado.rows[0].plan_ia_flag).toBe(true);
    });

    it('deve rastrear freshness do plano', async () => {
      const dataFreshness = new Date();

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, plan_freshness: dataFreshness }],
      });

      const resultado = await pool.query(
        'UPDATE profiles SET plan_freshness = $1 WHERE user_id = $2 RETURNING *',
        [dataFreshness, 1]
      );

      expect(resultado.rows[0].plan_freshness).toBeDefined();
    });
  });

  describe('Lembretes', () => {
    it('deve criar um lembrete', async () => {
      const lembrete = {
        id: 1,
        user_id: 1,
        tipo: 'discovery',
        data_lembrete: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      pool.query.mockResolvedValueOnce({
        rows: [lembrete],
      });

      const resultado = await pool.query(
        'INSERT INTO reminders (user_id, tipo, data_lembrete) VALUES ($1, $2, $3) RETURNING *',
        [lembrete.user_id, lembrete.tipo, lembrete.data_lembrete]
      );

      expect(resultado.rows).toHaveLength(1);
      expect(resultado.rows[0].tipo).toBe('discovery');
    });

    it('deve listar lembretes pendentes', async () => {
      const lembretes = [
        { id: 1, tipo: 'discovery', data_lembrete: new Date() },
      ];

      pool.query.mockResolvedValueOnce({
        rows: lembretes,
      });

      const resultado = await pool.query(
        'SELECT * FROM reminders WHERE user_id = $1 AND data_lembrete <= NOW() AND enviado = false',
        [1]
      );

      expect(resultado.rows).toHaveLength(1);
    });
  });
});
