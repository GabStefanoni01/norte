const crypto = require('crypto');
const pool = require('../../database/pool');
const env = require('../../config/env');
const { enviarEmail } = require('../mail/mail.service');

const TIPOS = ['empresa', 'escola', 'faculdade', 'etec', 'ong', 'outra'];
const STATUS = ['pendente', 'em_contato', 'aprovada', 'recusada', 'cancelada'];

function erro(mensagem, status = 400) {
  const err = new Error(mensagem);
  err.status = status;
  return err;
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validarTipo(tipo) {
  if (!TIPOS.includes(tipo)) throw erro('Tipo de instituição inválido');
}

async function criarSolicitacao(dados) {
  const nomeInstituicao = String(dados.nomeInstituicao || '').trim();
  const tipo = String(dados.tipo || '').trim().toLowerCase();
  const responsavelNome = String(dados.responsavelNome || '').trim();
  const responsavelEmail = normalizarEmail(dados.responsavelEmail);
  const telefone = String(dados.telefone || '').trim() || null;
  const mensagem = String(dados.mensagem || '').trim() || null;
  const quantidadePessoas = dados.quantidadePessoas == null || dados.quantidadePessoas === ''
    ? null
    : Number(dados.quantidadePessoas);

  if (!nomeInstituicao) throw erro('Nome da instituição é obrigatório');
  if (nomeInstituicao.length > 180) throw erro('Nome da instituição excede o limite permitido');
  validarTipo(tipo);
  if (!responsavelNome) throw erro('Nome do responsável é obrigatório');
  if (responsavelNome.length > 150) throw erro('Nome do responsável excede o limite permitido');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(responsavelEmail)) {
    throw erro('E-mail do responsável inválido');
  }
  if (responsavelEmail.length > 180) throw erro('E-mail do responsável excede o limite permitido');
  if (quantidadePessoas !== null && (!Number.isInteger(quantidadePessoas) || quantidadePessoas <= 0)) {
    throw erro('Quantidade de pessoas deve ser um número inteiro positivo');
  }

  const result = await pool.query(
    `INSERT INTO institution_interest_requests
      (nome_instituicao, tipo, responsavel_nome, responsavel_email, telefone, quantidade_pessoas, mensagem)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nome_instituicao, tipo, responsavel_nome, responsavel_email,
               telefone, quantidade_pessoas, mensagem, status, created_at`,
    [nomeInstituicao, tipo, responsavelNome, responsavelEmail, telefone, quantidadePessoas, mensagem],
  );

  return result.rows[0];
}

async function listarSolicitacoes({ status } = {}) {
  if (status && !STATUS.includes(status)) throw erro('Status de solicitação inválido');

  const params = [];
  let where = '';
  if (status) {
    params.push(status);
    where = 'WHERE status = $1';
  }

  const result = await pool.query(
    `SELECT id, nome_instituicao, tipo, responsavel_nome, responsavel_email,
            telefone, quantidade_pessoas, mensagem, status, observacoes_admin,
            institution_id, created_at, updated_at, resolved_at
       FROM institution_interest_requests
       ${where}
      ORDER BY created_at DESC`,
    params,
  );
  return result.rows;
}

async function obterSolicitacao(id) {
  const result = await pool.query(
    `SELECT id, nome_instituicao, tipo, responsavel_nome, responsavel_email,
            telefone, quantidade_pessoas, mensagem, status, observacoes_admin,
            institution_id, created_at, updated_at, resolved_at
       FROM institution_interest_requests
      WHERE id = $1`,
    [id],
  );

  if (!result.rows[0]) throw erro('Solicitação institucional não encontrada', 404);
  return result.rows[0];
}

async function atualizarStatus(id, { status, observacoesAdmin = null }) {
  if (!STATUS.includes(status)) throw erro('Status de solicitação inválido');

  const atual = await obterSolicitacao(id);
  if (['aprovada', 'recusada', 'cancelada'].includes(atual.status) && atual.status !== status) {
    throw erro('Solicitação já foi encerrada e não pode voltar para outro status');
  }

  const result = await pool.query(
    `UPDATE institution_interest_requests
        SET status = $1,
            observacoes_admin = COALESCE($2, observacoes_admin),
            updated_at = NOW(),
            resolved_at = CASE
              WHEN $1 IN ('aprovada','recusada','cancelada') THEN NOW()
              ELSE NULL
            END
      WHERE id = $3
      RETURNING id, nome_instituicao, tipo, responsavel_nome, responsavel_email,
                status, observacoes_admin, institution_id, updated_at, resolved_at`,
    [status, observacoesAdmin?.trim() || null, id],
  );

  return result.rows[0];
}

function gerarConvite() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
  };
}

async function aprovarSolicitacao(id) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT *
         FROM institution_interest_requests
        WHERE id = $1
        FOR UPDATE`,
      [id],
    );
    const solicitacao = requestResult.rows[0];

    if (!solicitacao) throw erro('Solicitação institucional não encontrada', 404);
    if (solicitacao.status === 'aprovada') throw erro('Solicitação já aprovada', 409);
    if (['recusada', 'cancelada'].includes(solicitacao.status)) {
      throw erro('Solicitação encerrada não pode ser aprovada', 409);
    }

    const existente = await client.query(
      `SELECT id FROM institutions WHERE LOWER(nome) = LOWER($1) LIMIT 1`,
      [solicitacao.nome_instituicao],
    );
    if (existente.rows[0]) throw erro('Já existe uma instituição com esse nome', 409);

    const institutionResult = await client.query(
      `INSERT INTO institutions (nome, tipo, email, descricao)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, tipo, email, descricao, ativa, created_at, updated_at`,
      [solicitacao.nome_instituicao, solicitacao.tipo, solicitacao.responsavel_email, solicitacao.mensagem],
    );
    const institution = institutionResult.rows[0];

    const { token, tokenHash } = gerarConvite();
    const invitationResult = await client.query(
      `INSERT INTO institution_invitations
        (institution_id, email, role, token_hash, expires_at)
       VALUES ($1, $2, 'administrador', $3, NOW() + INTERVAL '7 days')
       RETURNING id, institution_id, email, role, expires_at, created_at`,
      [institution.id, solicitacao.responsavel_email, tokenHash],
    );

    const frontendUrl = env.frontendUrl || 'http://localhost:4200';
    const link = `${frontendUrl.replace(/\/$/, '')}/convites/instituicao?token=${token}`;

    try {
      await enviarEmail({
        para: solicitacao.responsavel_email,
        assunto: 'Seu acesso institucional ao Norte foi aprovado',
        texto:
          `Olá, ${solicitacao.responsavel_nome}.\n\n` +
          `A solicitação da ${solicitacao.nome_instituicao} foi aprovada no Norte. ` +
          `Use o link abaixo para configurar seu acesso como administrador institucional:\n\n${link}\n\n` +
          'O convite é válido por 7 dias.',
      });
    } catch (emailError) {
      await client.query('ROLLBACK');
      throw emailError;
    }

    const updatedRequest = await client.query(
      `UPDATE institution_interest_requests
          SET status = 'aprovada', institution_id = $1, updated_at = NOW(), resolved_at = NOW()
        WHERE id = $2
        RETURNING id, status, institution_id, updated_at, resolved_at`,
      [institution.id, id],
    );

    await client.query('COMMIT');

    return { solicitacao: updatedRequest.rows[0], institution, convite: invitationResult.rows[0] };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { TIPOS, STATUS, criarSolicitacao, listarSolicitacoes, obterSolicitacao, atualizarStatus, aprovarSolicitacao };
