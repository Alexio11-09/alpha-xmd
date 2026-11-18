const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');
const {
  usePostgresAuthState,
  getAllSavedSessions,
  deleteSession,
  getSessionSettings,
  saveSessionSettings,
  cleanupOldSignalKeys
} = require('./library/postgresAuth');
const pino = require('pino');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ngrok = require('@ngrok/ngrok');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve your pairing website files from 'public' (or root if index.html is there)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Load Plugins
const plugins = [];
const pluginDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginDir)) {
  fs.readdirSync(pluginDir).forEach(file => {
    if (file.endsWith('.js')) {
      try {
        const loaded = require(path.join(pluginDir, file));
        if (Array.isArray(loaded)) plugins.push(...loaded);
        else plugins.push(loaded);
      } catch (e) {
        console.error(`Failed to load plugin ${file}:`, e.message);
      }
    }
  });
}
console.log(`✅ Loaded ${plugins.length} plugin commands successfully!`);

// Active bot sessions map
const activeSessions = new Map();

async function startBot(sessionId, res = null) {
  if (activeSessions.has(sessionId)) return;

  console.log(`🤖 Starting bot for ${sessionId}`);
  const { state, saveCreds } = await usePostgresAuthState(sessionId);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Alpha-XMD', 'Chrome', '20.0.04'],
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    syncFullHistory: false,
    getMessage: async () => ({ conversation: '' })
  });

  activeSessions.set(sessionId, sock);
  sock.ev.on('creds.update', saveCreds);

  // Pairing code generation on the active socket
  if (res && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(sessionId);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        if (!res.headersSent) res.json({ status: true, code });
      } catch (err) {
        if (!res.headersSent) res.status(500).json({ error: err.message });
      }
    }, 3000);
  } else if (res) {
    if (!res.headersSent) res.json({ status: true, message: 'Already registered' });
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log(`✅ [${sessionId}] Bot Connected!`);
      io.emit('session-connected', { sessionId });
    } else if (connection === 'close') {
      activeSessions.delete(sessionId);
      let reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(sessionId), 5000);
      } else {
        console.log(`❌ [${sessionId}] Device logged out.`);
        await deleteSession(sessionId);
      }
    }
  });

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek || !mek.message) return;
      if (mek.key && mek.key.remoteJid === 'status@broadcast') return;

      const m = {
        chat: mek.key.remoteJid,
        sender: jidNormalizedUser(mek.key.participant || mek.key.remoteJid),
        fromMe: mek.key.fromMe,
        id: mek.key.id,
        body:
          mek.message.conversation ||
          mek.message.extendedTextMessage?.text ||
          mek.message.imageMessage?.caption ||
          mek.message.videoMessage?.caption ||
          '',
        quoted: mek.message.extendedTextMessage?.contextInfo?.quotedMessage || null,
        key: mek.key
      };

      const settings = (await getSessionSettings(sessionId)) || { prefix: '.', title: 'Alpha-XMD' };
      const body = m.body.trim();
      if (!body.startsWith(settings.prefix)) return;

      const args = body.slice(settings.prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      const plugin = plugins.find(p => p.command === command || (p.aliases && p.aliases.includes(command)));
      if (!plugin) return;

      const reply = async (text) => {
        await sock.sendMessage(m.chat, { text }, { quoted: mek });
      };

      await plugin.execute(sock, m, { args, reply, config: { settings } });
    } catch (e) {
      console.error('Message Handler Error:', e);
    }
  });
}

// Auto-initialize all saved sessions from PostgreSQL on startup
async function initAllSessions() {
  console.log('🔄 Starting Alpha Bot Server (PostgreSQL Mode)...');
  try {
    await cleanupOldSignalKeys();
    const sessions = await getAllSavedSessions();
    console.log(`📂 Found ${sessions.length} PostgreSQL session(s):`, sessions.join(', '));
    for (const sessionId of sessions) {
      await startBot(sessionId);
    }
  } catch (e) {
    console.error('Failed to initialize sessions from DB:', e.message);
  }
}

// Pairing Endpoints (supports both /pair POST and GET query)
app.post('/pair', async (req, res) => {
  const phoneNumber = req.body.phoneNumber || req.body.number;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (activeSessions.has(cleanNumber)) {
    return res.json({ status: 'already_running', message: 'Session already active!' });
  }

  try {
    await startBot(cleanNumber, res);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

app.get('/pair', async (req, res) => {
  const phoneNumber = req.query.number || req.query.phoneNumber;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (activeSessions.has(cleanNumber)) {
    return res.json({ status: 'already_running', message: 'Session already active!' });
  }

  try {
    await startBot(cleanNumber, res);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// Status & Sessions API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    activeSessions: Array.from(activeSessions.keys()),
    pluginsLoaded: plugins.length
  });
});

// Fallback route to serve index.html if present
app.get('/', (req, res) => {
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  const rootIndex = path.join(__dirname, 'index.html');
  if (fs.existsSync(publicIndex)) return res.sendFile(publicIndex);
  if (fs.existsSync(rootIndex)) return res.sendFile(rootIndex);
  res.send('Alpha-XMD Bot Server is Running Smoothly!');
});

const PORT = process.env.PORT || 25440;
server.listen(PORT, async () => {
  console.log(`🌐 Internal API running on port ${PORT}`);

  // Start Ngrok tunnel automatically (restoring your static domain if configured)
  const authtoken = process.env.NGROK_AUTHTOKEN;
  const domain = process.env.NGROK_DOMAIN || 'itinerary-splashy-flyer.ngrok-free.dev';
  if (authtoken) {
    try {
      const listener = await ngrok.connect({
        addr: PORT,
        authtoken,
        domain
      });
      console.log(`🚇 Ngrok Tunnel Active: ${listener.url()}`);
    } catch (err) {
      console.log('⚠️ Ngrok Tunnel Warning:', err.message);
    }
  }

  initAllSessions();
});
