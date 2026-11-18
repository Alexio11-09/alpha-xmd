const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_gY59rQvTzN1B@ep-white-sound-a25t7t1j-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

// Ensure the sessions table exists with the correct primary key constraint for upserts
async function initTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
      session_id VARCHAR(255) NOT NULL,
      key_id VARCHAR(255) NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (session_id, key_id)
    );
  `);

  // Extra table for session-specific runtime settings (prefixes, toggles, etc.)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_settings (
      session_id VARCHAR(255) PRIMARY KEY,
      settings TEXT NOT NULL
    );
  `);
}

initTable().catch((err) => console.log("Database Init Error:", err.message));

// Custom JSON replacer to safely handle Buffers and TypedArrays in Baileys
const replacer = (key, value) => {
  if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
    return Buffer.from(value.data);
  }
  return value;
};

const reviver = (key, value) => {
  if (value && typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
    return Buffer.from(value.data);
  }
  return value;
};

async function usePostgresAuthState(sessionId) {
  const writeData = async (data, category) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const key of Object.keys(data)) {
        const value = JSON.stringify(data[key], (k, v) => Buffer.isBuffer(v) ? { type: 'Buffer', data: Array.from(v) } : v);
        const keyId = `${category}-${key}`;
        await client.query(
          `INSERT INTO whatsapp_sessions (session_id, key_id, value) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (session_id, key_id) 
           DO UPDATE SET value = EXCLUDED.value`,
          [sessionId, keyId, value]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`PostgresAuth Write Error [${category}]:`, e.message);
    } finally {
      client.release();
    }
  };

  const readData = async (category, key) => {
    try {
      const keyId = `${category}-${key}`;
      const res = await pool.query(
        `SELECT value FROM whatsapp_sessions WHERE session_id = $1 AND key_id = $2`,
        [sessionId, keyId]
      );
      if (res.rows.length === 0) return null;
      return JSON.parse(res.rows[0].value, reviver);
    } catch (e) {
      console.error(`PostgresAuth Read Error [${category}-${key}]:`, e.message);
      return null;
    }
  };

  const removeData = async (category, key) => {
    try {
      const keyId = `${category}-${key}`;
      await pool.query(
        `DELETE FROM whatsapp_sessions WHERE session_id = $1 AND key_id = $2`,
        [sessionId, keyId]
      );
    } catch (e) {
      console.error(`PostgresAuth Remove Error [${category}-${key}]:`, e.message);
    }
  };

  // Load initial credentials
  let creds = await readData('creds', 'creds');
  if (!creds) {
    const { initAuthCreds } = require('@whiskeysockets/baileys');
    creds = initAuthCreds();
    await writeData({ creds: creds }, 'creds');
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          for (const id of ids) {
            let value = await readData(type, id);
            if (type === 'app-state-sync-key' && value) {
              value = require('@whiskeysockets/baileys').proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              if (value) {
                tasks.push(writeData({ [id]: value }, category));
              } else {
                tasks.push(removeData(category, id));
              }
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      await writeData({ creds: creds }, 'creds');
    }
  };
}

async function getAllSavedSessions() {
  try {
    const res = await pool.query(`SELECT DISTINCT session_id FROM whatsapp_sessions`);
    return res.rows.map(r => r.session_id);
  } catch (e) {
    return [];
  }
}

async function deleteSession(sessionId) {
  try {
    await pool.query(`DELETE FROM whatsapp_sessions WHERE session_id = $1`, [sessionId]);
    await pool.query(`DELETE FROM whatsapp_settings WHERE session_id = $1`, [sessionId]);
  } catch (e) {}
}

async function getSessionSettings(sessionId) {
  try {
    const res = await pool.query(`SELECT settings FROM whatsapp_settings WHERE session_id = $1`, [sessionId]);
    if (res.rows.length === 0) return null;
    return JSON.parse(res.rows[0].settings);
  } catch (e) {
    return null;
  }
}

async function saveSessionSettings(sessionId, settings) {
  try {
    const json = JSON.stringify(settings);
    await pool.query(
      `INSERT INTO whatsapp_settings (session_id, settings) VALUES ($1, $2)
       ON CONFLICT (session_id) DO UPDATE SET settings = EXCLUDED.settings`,
      [sessionId, json]
    );
  } catch (e) {}
}

async function cleanupOldSignalKeys() {
  try {
    // Prunes stale pre-keys older than normal rotation to keep the database lightweight
    const res = await pool.query(`
      DELETE FROM whatsapp_sessions 
      WHERE key_id LIKE 'pre-key-%' 
      AND session_id IN (
        SELECT session_id FROM whatsapp_sessions GROUP BY session_id HAVING count(*) > 150
      )
    `);
    return res.rowCount || 0;
  } catch (e) {
    return 0;
  }
}

module.exports = {
  usePostgresAuthState,
  getAllSavedSessions,
  deleteSession,
  getSessionSettings,
  saveSessionSettings,
  cleanupOldSignalKeys
};
