const { Pool } = require('pg');
const { initAuthCreds, proto } = require('@whiskeysockets/baileys');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 15, // Good balance for free tier
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

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
initTables().catch(err => console.error('Database Init Error:', err.message));

async function usePostgresAuthState(sessionId) {
  const writeData = async (data, id) => {
    await pool.query(
      `INSERT INTO whatsapp_sessions (session_id, key_id, key_data) VALUES ($1, $2, $3)
       ON CONFLICT (session_id, key_id) DO UPDATE SET key_data = EXCLUDED.key_data;`,
      [sessionId, id, JSON.stringify(data, replacer)]
    );
  };

  const readData = async (id) => {
    try {
      const res = await pool.query('SELECT key_data FROM whatsapp_sessions WHERE session_id = $1 AND key_id = $2', [sessionId, id]);
      return res.rows.length ? JSON.parse(res.rows[0].key_data, reviver) : null;
    } catch (e) { return null; }
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          if (!ids || ids.length === 0) return {};
          const keyIds = ids.map(id => `${type}-${id}`);
          
          // 🎯 FETCH ALL KEYS IN ONE QUERY
          const res = await pool.query(
            'SELECT key_id, key_data FROM whatsapp_sessions WHERE session_id = $1 AND key_id = ANY($2::varchar[])',
            [sessionId, keyIds]
          );

          const data = {};
          for (const row of res.rows) {
            const originalId = row.key_id.replace(`${type}-`, '');
            let value = JSON.parse(row.key_data, reviver);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[originalId] = value;
          }
          return data;
        },
        set: async (data) => {
          const upserts = [];
          const deletes = [];

          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                upserts.push([sessionId, key, JSON.stringify(value, replacer)]);
              } else {
                deletes.push(key);
              }
            }
          }

          // 🎯 SAVE ALL KEYS AT ONCE USING UNNEST
          if (upserts.length > 0) {
            const query = `
              INSERT INTO whatsapp_sessions (session_id, key_id, key_data)
              SELECT * FROM UNNEST($1::varchar[], $2::varchar[], $3::text[])
              ON CONFLICT (session_id, key_id) DO UPDATE SET key_data = EXCLUDED.key_data;
            `;
            await pool.query(query, [
              upserts.map(u => u[0]),
              upserts.map(u => u[1]),
              upserts.map(u => u[2])
            ]);
          }

          // 🎯 DELETE ALL KEYS AT ONCE
          if (deletes.length > 0) {
            await pool.query('DELETE FROM whatsapp_sessions WHERE session_id = $1 AND key_id = ANY($2::varchar[])', [sessionId, deletes]);
          }
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
  } catch (e) { return []; }
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
    await pool.query(
      `INSERT INTO whatsapp_settings (session_id, settings) VALUES ($1, $2)
       ON CONFLICT (session_id) DO UPDATE SET settings = EXCLUDED.settings;`,
      [sessionId, JSON.stringify(settings)]
    );
  } catch (e) {}
}

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
  cleanupOldSignalKeys: async () => {}
};