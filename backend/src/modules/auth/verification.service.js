const pool = require('../../database/pool');
const { gerarCodigo, hashCodigo, codigoConfere } = require('../mail/codigo.js');
const { enviarEmail } = require('../mail/mail.service');

const VALIDADE_MINUTOS = 15;

async function criarCodigo(userId, tipo) {
  const codigo = gerarCodigo();
  const hash = await hashCodigo(codigo);
  const expiraEm = new Date(Date.now() + VALIDADE_MINUTOS * 60 * 1000);

  // Invalida códigos anteriores do mesmo tipo ainda não usados.
  await pool.query(
    `UPDATE verification_codes SET usado = true WHERE user_id = $1 AND tipo = $2 AND usado = false`,
    [userId, tipo]
  );

  await pool.query(
    `INSERT INTO verification_codes (user_id, tipo, codigo_hash, expira_em) VALUES ($1, $2, $3, $4)`,
    [userId, tipo, hash, expiraEm]
  );

  return codigo;
}

async function validarCodigo(userId, tipo, codigoInformado) {
  const result = await pool.query(
    `SELECT * FROM verification_codes
     WHERE user_id = $1 AND tipo = $2 AND usado = false
     ORDER BY created_at DESC LIMIT 1`,
    [userId, tipo]
  );

  const registro = result.rows[0];

  if (!registro) {
    const err = new Error('Nenhum código pendente. Solicite um novo.');
    err.status = 400;
    throw err;
  }

  if (new Date(registro.expira_em) < new Date()) {
    const err = new Error('Código expirado. Solicite um novo.');
    err.status = 400;
    throw err;
  }

  const confere = await codigoConfere(codigoInformado, registro.codigo_hash);
  if (!confere) {
    const err = new Error('Código inválido.');
    err.status = 400;
    throw err;
  }

  await pool.query(`UPDATE verification_codes SET usado = true WHERE id = $1`, [registro.id]);
}

async function enviarCodigoVerificacaoEmail(user) {
  const codigo = await criarCodigo(user.id, 'verificacao_email');

  try {
    await enviarEmail({
      para: user.email,
      assunto: 'Confirme seu e-mail no Norte',
      texto: `Olá, ${user.nome}!\n\nSeu código de confirmação é: ${codigo}\n\nEle expira em ${VALIDADE_MINUTOS} minutos.`,
    });
  } catch (err) {
    // Não deixa uma falha no envio de e-mail impedir a criação da conta —
    // o usuário ainda pode pedir um novo código pelo endpoint de reenvio
    // assim que o SMTP for corrigido.
    console.error(`Não foi possível enviar o código de verificação para ${user.email}.`);
  }
}

async function enviarCodigoRedefinicaoSenha(user) {
  const codigo = await criarCodigo(user.id, 'redefinicao_senha');

  try {
    await enviarEmail({
      para: user.email,
      assunto: 'Redefinição de senha — Norte',
      texto: `Olá, ${user.nome}!\n\nUse o código abaixo para redefinir sua senha: ${codigo}\n\nEle expira em ${VALIDADE_MINUTOS} minutos. Se você não pediu isso, ignore este e-mail.`,
    });
  } catch (err) {
    console.error(`Não foi possível enviar o código de redefinição para ${user.email}.`);
  }
}

module.exports = {
  criarCodigo,
  validarCodigo,
  enviarCodigoVerificacaoEmail,
  enviarCodigoRedefinicaoSenha,
};
