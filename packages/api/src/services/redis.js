const { createClient } = require('redis');

let client = null;

async function initRedis() {
  client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  client.on('error', (err) => console.error('[Redis] Error:', err.message));
  await client.connect();
  return client;
}

function getClient() { return client; }

async function set(key, value, ttlSeconds) {
  if (!client) return;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds) await client.setEx(key, ttlSeconds, str);
  else await client.set(key, str);
}

async function get(key) {
  if (!client) return null;
  const val = await client.get(key);
  if (!val) return null;
  try { return JSON.parse(val); } catch { return val; }
}

async function del(key) {
  if (!client) return;
  await client.del(key);
}

module.exports = { initRedis, getClient, set, get, del };
