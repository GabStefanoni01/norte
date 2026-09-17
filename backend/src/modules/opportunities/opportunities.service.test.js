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
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              titulo: 'Curso de Java',
              interesse: 'Tecnologia',
              estado: null,
              requisitos: ['Java', 'SQL'],
              idade_minima: null,
              idade_maxima: null,
            },
            {
              id: 2,
              titulo: 'Curso de Design',
              interesse: 'Design',
              estado: null,
              requisitos: ['Figma'],
              idade_minima: null,
              idade_maxima: null,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              habilidades: ['Java', 'SQL'],
              interesses: ['Tecnologia'],
              areas_sugeridas: ['Backend'],
              escolaridade: 'Ensino superior em andamento',
              perfil_dominante: 'Tecnologia',
              idade: 20,
              estado: 'SP',
            },
          ],
        });

      const resultado = await opportunitiesService.listar(7);

      expect(resultado[0]).toEqual(expect.objectContaining({
        id: 1,
        matchPercent: 100,
        faltantes: [],
      }));
      expect(resultado[1].id).toBe(2);
      expect(resultado[1].matchPercent).toBeLessThan(resultado[0].matchPercent);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[0][0]).toContain("status = 'publicada'");
      expect(mockQuery.mock.calls[0][0]).toContain('expires_at IS NULL OR expires_at > NOW()');
    });

    it('considera estado e faixa etária no contexto do match', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 10,
            titulo: 'Programa SP',
            interesse: 'Tecnologia',
            estado: 'SP',
            requisitos: [],
            idade_minima: 18,
            idade_maxima: 24,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            habilidades: [],
            interesses: ['Tecnologia'],
            areas_sugeridas: [],
            escolaridade: null,
            perfil_dominante: null,
            idade: 20,
            estado: 'SP',
          }],
        });

      const resultado = await opportunitiesService.listar(7);

      expect(resultado[0].matchPercent).toBe(100);
    });

    it('retorna lacunas de requisitos que não aparecem no perfil', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 11,
            titulo: 'Vaga Java',
            interesse: 'Tecnologia',
            estado: null,
            requisitos: ['Java', 'Docker', 'SQL'],
            idade_minima: null,
            idade_maxima: null,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            habilidades: ['Java', 'SQL'],
            interesses: ['Tecnologia'],
            areas_sugeridas: [],
            escolaridade: null,
            perfil_dominante: null,
            idade: 20,
            estado: 'SP',
          }],
        });

      const resultado = await opportunitiesService.listar(7);

      expect(resultado[0].faltantes).toEqual(['Docker']);
      expect(resultado[0].matchPercent).toBe(77);
    });
  });

  describe('criar', () => {
    it('rejeita faixa etária inválida', async () => {
      await expect(opportunitiesService.criar({
        titulo: 'Programa',
        link: 'https://example.com',
        idade_minima: 25,
        idade_maxima: 18,
      })).rejects.toMatchObject({
        status: 400,
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
