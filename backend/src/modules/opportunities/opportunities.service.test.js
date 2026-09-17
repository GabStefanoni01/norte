const mockQuery = jest.fn();

jest.mock('../../database/pool', () => ({
  query: mockQuery,
}));

const opportunitiesService = require('./opportunities.service');

describe('opportunities.service', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('listar', () => {
    it('retorna oportunidades publicadas ordenadas por match', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [
          { id: 1, titulo: 'Curso de Java', interesse: 'Tecnologia', estado: null, requisitos: ['Java', 'SQL'], idade_minima: null, idade_maxima: null },
          { id: 2, titulo: 'Curso de Design', interesse: 'Design', estado: null, requisitos: ['Figma'], idade_minima: null, idade_maxima: null },
        ] })
        .mockResolvedValueOnce({ rows: [{
          habilidades: ['Java', 'SQL'], interesses: ['Tecnologia'], areas_sugeridas: ['Backend'], areas_secundarias: [],
          escolaridade: 'Ensino superior em andamento', perfil_dominante: 'Tecnologia', idade: 20, estado: 'SP',
        }] });

      const resultado = await opportunitiesService.listar(7);
      expect(resultado[0]).toEqual(expect.objectContaining({ id: 1, matchPercent: 100, faltantes: [] }));
      expect(resultado[1].id).toBe(2);
      expect(resultado[1].matchPercent).toBeLessThan(resultado[0].matchPercent);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[0][0]).toContain("status = 'publicada'");
      expect(mockQuery.mock.calls[0][0]).toContain('expires_at IS NULL OR expires_at > NOW()');
    });

    it('considera estado e faixa etária no contexto do match', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 10, titulo: 'Programa SP', interesse: 'Tecnologia', estado: 'SP', requisitos: [], idade_minima: 18, idade_maxima: 24 }] })
        .mockResolvedValueOnce({ rows: [{
          habilidades: [], interesses: ['Tecnologia'], areas_sugeridas: [], areas_secundarias: [], escolaridade: null,
          perfil_dominante: null, idade: 20, estado: 'SP',
        }] });
      const resultado = await opportunitiesService.listar(7);
      expect(resultado[0].matchPercent).toBe(100);
      expect(resultado[0].matchDetalhes).toEqual({
        areaCompativel: true,
        localCompativel: true,
        idadeCompativel: true,
        requisitosAtendidos: 0,
        requisitosTotal: 0,
      });
    });

    it('retorna lacunas de requisitos que não aparecem no perfil', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 11, titulo: 'Vaga Java', interesse: 'Tecnologia', estado: null, requisitos: ['Java', 'Docker', 'SQL'], idade_minima: null, idade_maxima: null }] })
        .mockResolvedValueOnce({ rows: [{
          habilidades: ['Java', 'SQL'], interesses: ['Tecnologia'], areas_sugeridas: [], areas_secundarias: [],
          escolaridade: null, perfil_dominante: null, idade: 20, estado: 'SP',
        }] });
      const resultado = await opportunitiesService.listar(7);
      expect(resultado[0].faltantes).toEqual(['Docker']);
      expect(resultado[0].matchPercent).toBe(77);
      expect(resultado[0].matchDetalhes.requisitosAtendidos).toBe(2);
      expect(resultado[0].matchDetalhes.requisitosTotal).toBe(3);
    });

    it('considera áreas sugeridas e secundárias no match mesmo sem habilidade específica', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{
          id: 12, titulo: 'Estágio em Gestão Hospitalar', categoria: 'Gestão Hospitalar', interesse: 'Administração', estado: null,
          requisitos: [], idade_minima: null, idade_maxima: null,
        }] })
        .mockResolvedValueOnce({ rows: [{
          habilidades: [], interesses: [], areas_sugeridas: ['Saúde'], areas_secundarias: ['Gestão hospitalar'],
          escolaridade: 'Ensino superior em andamento', perfil_dominante: 'Cuidados', idade: 20, estado: 'SP',
        }] });
      const resultado = await opportunitiesService.listar(7);
      expect(resultado[0].matchPercent).toBe(100);
      expect(resultado[0].matchDetalhes.areaCompativel).toBe(true);
    });

    it('identifica incompatibilidade de localização e idade nos detalhes', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{
          id: 13, titulo: 'Programa RJ', interesse: 'Tecnologia', estado: 'RJ', requisitos: ['Java'], idade_minima: 18, idade_maxima: 21,
        }] })
        .mockResolvedValueOnce({ rows: [{
          habilidades: [], interesses: ['Tecnologia'], areas_sugeridas: [], areas_secundarias: [],
          escolaridade: null, perfil_dominante: null, idade: 25, estado: 'SP',
        }] });
      const resultado = await opportunitiesService.listar(7);
      expect(resultado[0].matchDetalhes).toEqual({
        areaCompativel: true,
        localCompativel: false,
        idadeCompativel: false,
        requisitosAtendidos: 0,
        requisitosTotal: 1,
      });
      expect(resultado[0].faltantes).toEqual(['Java']);
    });
  });

  describe('criar', () =>
    it('rejeita faixa etária inválida', async () => {
      await expect(opportunitiesService.criar({ titulo: 'Programa', link: 'https://example.com', idade_minima: 25, idade_maxima: 18 })).rejects.toMatchObject({ status: 400 });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('cria uma oportunidade válida com os valores recebidos', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 12, titulo: 'Curso de Node', tipo: 'curso' }] });
      const resultado = await opportunitiesService.criar({
        titulo: 'Curso de Node', empresa: 'Norte', categoria: 'Tecnologia', tipo: 'curso', descricao: 'Curso introdutório',
        interesse: 'Tecnologia', estado: 'SP', gratuito: true, idade_minima: 16, idade_maxima: 30,
        link: 'https://example.com/curso', requisitos: ['JavaScript'],
      });
      expect(resultado).toEqual({ id: 12, titulo: 'Curso de Node', tipo: 'curso' });
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO opportunities');
    });
  });

  describe('fecharLacuna', () => {
    it('adiciona os requisitos faltantes ao plano existente', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 20, titulo: 'Vaga Backend', interesse: 'Tecnologia', estado: null, requisitos: ['Java', 'Docker'], idade_minima: null, idade_maxima: null, status: 'publicada' }] })
        .mockResolvedValueOnce({ rows: [{ habilidades: ['Java'], interesses: ['Tecnologia'], areas_sugeridas: [], areas_secundarias: [], escolaridade: null, perfil_dominante: null, idade: 20, estado: 'SP' }] })
        .mockResolvedValueOnce({ rows: [{ id: 8, etapas: [{ mes: 1, titulo: 'Base', itens: [{ id: 'base1', descricao: 'Estudar lógica', tipo: 'aprender', status: 'concluido' }] }] }] })
        .mockResolvedValueOnce({ rows: [] });
      const resultado = await opportunitiesService.fecharLacuna(7, 20);
      expect(resultado).toEqual({ message: '1 item(ns) adicionados ao seu plano de evolução.', itensAdicionados: 1 });
      expect(mockQuery.mock.calls[3][0]).toContain('UPDATE plans SET etapas = $1, progresso = $2');
      expect(mockQuery.mock.calls[3][1][1]).toBe(50);
    });

    it('não altera o plano quando o usuário já tem 100% de match', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 21, titulo: 'Curso Java', interesse: 'Tecnologia', estado: null, requisitos: ['Java'], idade_minima: null, idade_maxima: null, status: 'publicada' }] })
        .mockResolvedValueOnce({ rows: [{ habilidades: ['Java'], interesses: ['Tecnologia'], areas_sugeridas: [], areas_secundarias: [], escolaridade: null, perfil_dominante: null, idade: 20, estado: 'SP' }] });
      const resultado = await opportunitiesService.fecharLacuna(7, 21);
      expect(resultado).toEqual({ message: 'Você já tem 100% de match com essa oportunidade!', itensAdicionados: 0 });
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });
});
