const { createClient } = require('redis');
let client = null;
let conectando = null;

function obterCliente() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('Erro no Redis:', err.message));
    conectando = client.connect().catch((err) => {
      console.error('Não foi possível conectar ao Redis:', err.message);
      client = null;
    });
  }
  return client;
}

async function aguardarConexao() {
  obterCliente();
  if (conectando) await conectando;
  return client;
}

module.exports = { obterCliente, aguardarConexao };
