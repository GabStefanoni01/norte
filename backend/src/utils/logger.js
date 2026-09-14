function registrar(nivel, evento, dados = {}) {
  const entrada = { timestamp: new Date().toISOString(), level: nivel, event: evento, ...dados };
  const mensagem = JSON.stringify(entrada);
  if (nivel === 'error') console.error(mensagem);
  else if (nivel === 'warn') console.warn(mensagem);
  else console.log(mensagem);
}

function erro(evento, err, dados = {}) {
  registrar('error', evento, {
    ...dados,
    error: { name: err?.name, message: err?.message, code: err?.code, stack: err?.stack },
  });
}

module.exports = {
  info: (evento, dados) => registrar('info', evento, dados),
  warn: (evento, dados) => registrar('warn', evento, dados),
  error: erro,
};
