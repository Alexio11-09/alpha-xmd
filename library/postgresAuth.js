const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize database tables automatically on startup
async function initTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        session_id VARCHAR(255) NOT NULL,
        key_id VARCHAR(255) NOT NULL,
        key_data TEXT NOT NULL,
        PRIMARY KEY (session_id, key_id)
      );
      CREATE TABLE IF NOT EXISTS whatsapp_settings (
        session_id VARCHAR(255) PRIMARY KEY,
        settings JSONB NOT NULL
      );
    `);
  } finally {
    client.release();
  }
}

initTables().catch(err => console.error('Database Initialization Error:', err.message));

async function usePostgresAuthState(sessionId) {
  const writeData = async (data, id) => {
    const query = `
      INSERT INTO whatsapp_sessions (session_id, key_id, key_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id, key_id)
      DO UPDATE SET key_data = EXCLUDED.key_data;
    `;
    await pool.query(query, [sessionId, id, JSON.stringify(data, replacer)]);
  };

  const readData = async (id) => {
    try {
      const res = await pool.query(
        'SELECT key_data FROM whatsapp_sessions WHERE session_id = $1 AND key_id = $2',
        [sessionId, id]
      );
      if (res.rows.length === 0) return null;
      return JSON.parse(res.rows[0].key_data, reviver);
    } catch (e) {
      return null;
    }
  };

  const removeData = async (id) => {
    try {
      await pool.query(
        'DELETE FROM whatsapp_sessions WHERE session_id = $1 AND key_id = $2',
        [sessionId, id]
      );
    } catch (e) {}
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          for (const id of ids) {
            let value = await readData(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
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
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(value, key));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      await writeData(creds, 'creds');
    }
  };
}

async function getAllSavedSessions() {
  try {
    const res = await pool.query('SELECT DISTINCT session_id FROM whatsapp_sessions');
    return res.rows.map(row => row.session_id);
  } catch (e) {
    return [];
  }
}

async function deleteSession(sessionId) {
  try {
    await pool.query('DELETE FROM whatsapp_sessions WHERE session_id = $1', [sessionId]);
    await pool.query('DELETE FROM whatsapp_settings WHERE session_id = $1', [sessionId]);
  } catch (e) {}
}

async function getSessionSettings(sessionId) {
  try {
    const res = await pool.query('SELECT settings FROM whatsapp_settings WHERE session_id = $1', [sessionId]);
    if (res.rows.length > 0) return res.rows[0].settings;
  } catch (e) {}
  return null;
}

async function saveSessionSettings(sessionId, settings) {
  try {
    const query = `
      INSERT INTO whatsapp_settings (session_id, settings)
      VALUES ($1, $2)
      ON CONFLICT (session_id)
      DO UPDATE SET settings = EXCLUDED.settings;
    `;
    await pool.query(query, [sessionId, JSON.stringify(settings)]);
  } catch (e) {}
}

async function cleanupOldSignalKeys() {
  // Optional cleanup task
}

// Custom JSON replacer/reviver for Baileys buffers
function replacer(key, value) {
  if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
    return { type: 'Buffer', data: value.data };
  }
  return value;
}

function reviver(key, value) {
  if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
    return Buffer.from(value.data);
  }
  return value;
}

module.exports = {
  usePostgresAuthState,
  getAllSavedSessions,
  deleteSession,
  getSessionSettings,
  saveSessionSettings,
  cleanupOldSignalKeys
};
