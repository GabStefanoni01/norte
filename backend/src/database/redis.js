const crypto = require('crypto');
const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL;
const localLocks = new Set();

let client = null;
let connecting = null;

async function getClient() {
  if (!redisUrl) return null;

  if (client?.isReady) return client;

  if (!client) {
    client = createClient({ url: redisUrl });

    client.on('error', (err) => {
      console.error('[redis] erro:', err.message);
    });
  }

  if (!connecting) {
    connecting = client.connect()
      .catch((err) => {
        console.error('[redis] não foi possível conectar:', err.message);
        client = null;
        throw err;
      })
      .finally(() => {
        connecting = null;
      });
  }

  await connecting;
  return client?.isReady ? client : null;
}

async function acquireLock(key, ttlSeconds) {
  const token = crypto.randomUUID();

  try {
    const redis = await getClient();

    if (redis) {
      const acquired = await redis.set(key, token, {
        NX: true,
        EX: ttlSeconds,
      });

      return acquired ? token : null;
    }
  } catch (err) {
    console.warn('[redis] usando lock local após falha no Redis:', err.message);
  }

  if (localLocks.has(key)) return null;
  localLocks.add(key);
  return token;
}

async function releaseLock(key, token) {
  try {
    const redis = await getClient();

    if (redis) {
      const script = `
        if redis.call('get', KEYS[1]) == ARGV[1] then
          return redis.call('del', KEYS[1])
        end
        return 0
      `;

      await redis.eval(script, {
        keys: [key],
        arguments: [token],
      });
      return;
    }
  } catch (err) {
    console.warn('[redis] falha ao liberar lock Redis:', err.message);
  }

  localLocks.delete(key);
}

module.exports = {
  acquireLock,
  releaseLock,
};
