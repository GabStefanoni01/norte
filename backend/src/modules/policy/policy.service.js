const crypto = require('crypto');
const pool = require('../../database/pool');
const { VERSAO_ATUAL_TERMOS } = require('./policy.data');
const { hashCodigo, codigoConfere } = require('../mail/codigo');
const { enviarEmail } = require('../mail/mail.service');

const VALIDADE_TOKEN_DIAS = 30;

async function usuarioTemConsentimentoValido(userId) {
  const result = await pool.query('SELECT aceite_termos_versao FROM users WHERE id = $1', [userId]);
  const versao = result.rows[0]?.aceite_termos_versao;
  return versao != null && versao >= VERSAO_ATUAL_TERMOS;
}

async function registrarAceite(userId) {
  await pool.query(
    `UPDATE users SET aceite_termos_versao = $1, aceite_termos_em = NOW(), aceite_termos_recusado_em = NULL WHERE id = $2`,
    [VERSAO_ATUAL_TERMOS, userId]
  );
}

async function registrarRecusa(userId) {
  await pool.query(
    `UPDATE users SET aceite_termos_recusado_em = NOW(), aceite_termos_versao = NULL WHERE id = $1`,
    [userId]
  );
}

async function gerarTokenAceite(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = await hashCodigo(token);
  const expiraEm = new Date(Date.now() + VALIDADE_TOKEN_DIAS * 24 * 60 * 60 * 1000);

  await pool.query(
    `UPDATE verification_codes SET usado = true WHERE user_id = $1 AND tipo = 'aceite_termos' AND usado = false`,
    [userId]
  );
  await pool.query(
    `INSERT INTO verification_codes (user_id, tipo, codigo_hash, expira_em) VALUES ($1, 'aceite_termos', $2, $3)`,
    [userId, hash, expiraEm]
  );

  return token;
}

async function validarTokenAceite(userId, token) {
  const result = await pool.query(
    `SELECT * FROM verification_codes WHERE user_id = $1 AND tipo = 'aceite_termos' AND usado = false ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  const registro = result.rows[0];

  if (!registro || new Date(registro.expira_em) < new Date()) {
    const err = new Error('Link inválido ou expirado. Solicite um novo.');
    err.status = 400;
    throw err;
  }

  const confere = await codigoConfere(token, registro.codigo_hash);
  if (!confere) {
    const err = new Error('Link inválido.');
    err.status = 400;
    throw err;
  }

  await pool.query('UPDATE verification_codes SET usado = true WHERE id = $1', [registro.id]);
}

async function processarResposta({ email, token, aceito }) {
  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  const usuario = result.rows[0];

  if (!usuario) {
    const err = new Error('Usuário não encontrado.');
    err.status = 404;
    throw err;
  }

  await validarTokenAceite(usuario.id, token);

  if (aceito) {
    await registrarAceite(usuario.id);
    return { message: 'Aceite registrado. Obrigado!' };
  }

  await registrarRecusa(usuario.id);
  return {
    message:
      'Recusa registrada. Você continua podendo usar o Norte normalmente, mas as funcionalidades que ' +
      'compartilham dados com nosso provedor de IA (mentor, sugestões personalizadas) ficam desativadas.',
  };
}

async function enviarSolicitacoesRetroativas() {
  const result = await pool.query(
    `SELECT id, nome, email FROM users WHERE aceite_termos_versao IS NULL AND aceite_termos_recusado_em IS NULL`
  );

  let enviados = 0;

  for (const usuario of result.rows) {
    const token = await gerarTokenAceite(usuario.id);
    const link = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/aceite-termos?email=${encodeURIComponent(usuario.email)}&token=${token}`;

    await enviarEmail({
      para: usuario.email,
      assunto: 'Atualizamos nossos Termos de Uso — Norte',
      texto:
        `Olá, ${usuario.nome}!\n\n` +
        'Criamos uma Política de Privacidade e Termos de Uso formais no Norte. Pra continuar usando as ' +
        'funcionalidades que envolvem IA (mentor, sugestões personalizadas), precisamos do seu aceite.\n\n' +
        `Revise e responda por aqui: ${link}\n\n` +
        'Se você recusar, continua podendo usar o resto da plataforma normalmente — só essas ' +
        'funcionalidades específicas ficam desativadas.\n\n— Equipe Norte',
    });

    enviados += 1;
  }

  return { totalUsuarios: result.rows.length, enviados };
}

module.exports = {
  usuarioTemConsentimentoValido,
  registrarAceite,
  registrarRecusa,
  gerarTokenAceite,
  processarResposta,
  enviarSolicitacoesRetroativas,
};
