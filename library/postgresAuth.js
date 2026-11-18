const { Pool } = require("pg");
const { initAuthCreds, BufferJSON, proto } = require("@whiskeysockets/baileys");

const RAW_DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_aTFMg7Gewy3f@ep-twilight-pine-bcgiya8u-pooler.c-16.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Ensure lowercase protocol and clean sslmode for pg driver compatibility
const DB_URL = RAW_DB_URL.replace(/^Postgresql:\/\//i, "postgresql://").replace("&channel_binding=require", "");

const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
      session_id VARCHAR(64) NOT NULL,
      key_id VARCHAR(255) NOT NULL,
      data TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (session_id, key_id)
    );
  `);
  tableReady = true;
}

async function usePostgresAuthState(sessionId) {
  await ensureTable();

  const writeData = async (keyId, data) => {
    const serialized = JSON.stringify(data, BufferJSON.replacer);
    await pool.query(
      `INSERT INTO whatsapp_sessions (session_id, key_id, data, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (session_id, key_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [sessionId, keyId, serialized]
    );
  };

  const readData = async (keyId) => {
    const res = await pool.query(
      `SELECT data FROM whatsapp_sessions WHERE session_id = $1 AND key_id = $2`,
      [sessionId, keyId]
    );
    if (!res.rows.length) return null;
    return JSON.parse(res.rows[0].data, BufferJSON.reviver);
  };

  const removeData = async (keyId) => {
    await pool.query(
      `DELETE FROM whatsapp_sessions WHERE session_id = $1 AND key_id = $2`,
      [sessionId, keyId]
    );
  };

  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(key, value) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData("creds", creds)
  };
}

async function getAllSavedSessions() {
  await ensureTable();
  const res = await pool.query(
    `SELECT DISTINCT session_id FROM whatsapp_sessions WHERE key_id = 'creds'`
  );
  return res.rows.map((r) => r.session_id);
}

async function deleteSession(sessionId) {
  await ensureTable();
  await pool.query(`DELETE FROM whatsapp_sessions WHERE session_id = $1`, [sessionId]);
}

async function getSessionSettings(sessionId) {
  await ensureTable();
  const res = await pool.query(
    `SELECT data FROM whatsapp_sessions WHERE session_id = $1 AND key_id = 'settings'`,
    [sessionId]
  );
  if (!res.rows.length) return null;
  try {
    return JSON.parse(res.rows[0].data);
  } catch {
    return null;
  }
}

async function saveSessionSettings(sessionId, settings) {
  await ensureTable();
  await pool.query(
    `INSERT INTO whatsapp_sessions (session_id, key_id, data, updated_at)
     VALUES ($1, 'settings', $2, NOW())
     ON CONFLICT (session_id, key_id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [sessionId, JSON.stringify(settings)]
  );
}

async function cleanupOldSignalKeys() {
  await ensureTable();
  const res = await pool.query(`
    DELETE FROM whatsapp_sessions
    WHERE (key_id LIKE 'pre-key-%' OR key_id LIKE 'sender-key-%' OR key_id LIKE 'session-%')
      AND updated_at < NOW() - INTERVAL '3 days'
  `);
  return res.rowCount || 0;
}

module.exports = {
  usePostgresAuthState,
  getAllSavedSessions,
  deleteSession,
  getSessionSettings,
  saveSessionSettings,
  cleanupOldSignalKeys,
  pool
};
