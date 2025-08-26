const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const client = createClient({ url: REDIS_URL });

let isReady = false;
client.on("error", (err) => console.error("Redis error:", err));
client.on("ready", () => {
  isReady = true;
  console.log("Redis connected");
});

async function ensure() {
  if (!isReady) {
    try { await client.connect(); isReady = true; }
    catch (e) { console.warn("Redis connect failed, no cache:", e.message); }
  }
}
async function getJSON(key) {
  try { await ensure(); if (!isReady) return null;
    const raw = await client.get(key); return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
async function setJSON(key, value, ttlSeconds = 60) {
  try { await ensure(); if (!isReady) return;
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {}
}
async function flushAll() { try { await ensure(); if (isReady) await client.flushAll(); } catch {} }
async function disconnect() { try { if (isReady) await client.quit(); } catch {} }

module.exports = { client, getJSON, setJSON, flushAll, disconnect, ensure };
