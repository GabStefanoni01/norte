const { gerarConsultasDoPerfil, mapearJob } = require('./opportunities.collector');

describe('opportunities collector', () => {
  test('gera consultas a partir de diferentes áreas profissionais', () => {
    const consultas = gerarConsultasDoPerfil([
      {
        interesses: ['Enfermagem'],
        areas_sugeridas: ['Saúde'],
        areas_secundarias: ['Gestão hospitalar'],
        perfil_dominante: 'Cuidados',
      },
      {
        interesses: ['Administração'],
        areas_sugeridas: ['Recursos Humanos'],
        areas_secundarias: ['Finanças'],
        perfil_dominante: 'Gestão',
      },
    ]);

    expect(consultas).toEqual(expect.arrayContaining([
      'estágio',
      'aprendiz',
      'assistente',
      'trainee',
      'Enfermagem',
      'Saúde',
      'Gestão hospitalar',
      'Administração',
      'Recursos Humanos',
      'Finanças',
    ]));
    expect(consultas.some((consulta) => consulta.toLowerCase().includes('software engineer'))).toBe(false);
  });

  test('remove consultas duplicadas ignorando acentos e caixa', () => {
    const consultas = gerarConsultasDoPerfil([
      {
        interesses: ['Administração', 'administracao'],
        areas_sugeridas: ['ADMINISTRAÇÃO'],
      },
    ]);

    expect(consultas.filter((consulta) => consulta.toLowerCase() === 'administração')).toHaveLength(1);
  });

  test('normaliza uma vaga externa para o modelo do Norte', () => {
    const oportunidade = mapearJob({
      id: '8164933',
      job_title: 'Backend Developer',
      company: 'Empresa Exemplo',
      job_function: 'Engineering',
      description: 'Desenvolvimento de APIs e serviços.',
      state_code: 'SP',
      country_code: 'BR',
      url: 'https://exemplo.com/vaga/8164933',
      source_url: 'https://exemplo.com/vaga/8164933',
      date_posted: '2026-09-15T12:00:00Z',
      last_seen_at: '2026-09-16 12:00:00',
      remote: true,
      hybrid: false,
      work_arrangement: 'remote',
      seniority: 'entry_level',
      technology_slugs: ['java', 'spring-boot'],
      keyword_slugs: ['api', 'backend'],
      employment_statuses: ['full_time'],
      salary_string: 'R$ 4.000',
      expires_at: null,
      sources: [{ provider: 'greenhouse', url: 'https://exemplo.com/vaga/8164933' }],
    });

    expect(oportunidade).toMatchObject({
      externalId: '8164933',
      titulo: 'Backend Developer',
      empresa: 'Empresa Exemplo',
      categoria: 'Engineering',
      tipo: 'vaga',
      estado: 'SP',
      link: 'https://exemplo.com/vaga/8164933',
      requisitos: ['java', 'spring-boot', 'api', 'backend'],
    });
    expect(oportunidade.dadosOrigem.remote).toBe(true);
    expect(oportunidade.dadosOrigem.seniority).toBe('entry_level');
  });

  test('ignora vaga sem identificador ou link', () => {
    expect(mapearJob({ id: '1', job_title: 'Backend Developer' })).toBeNull();
    expect(mapearJob({ id: '1', job_title: 'Backend Developer', url: '' })).toBeNull();
  });
});
