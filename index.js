// © 2026 Alpha. All Rights Reserved.
const fs = require("fs");
const path = require("path");
const express = require("express");
const pino = require("pino");
const chalk = require("chalk");
const { Boom } = require("@hapi/boom");
const { smsg } = require("./library/serialize");
const {
  usePostgresAuthState,
  getAllSavedSessions,
  deleteSession,
  getSessionSettings,
  saveSessionSettings,
  cleanupOldSignalKeys
} = require("./library/postgresAuth"); // 🎯 POSTGRESQL IMPORT
const config = () => require("./settings/config");

// 🎯 GLOBAL ERROR CATCHERS
process.on('uncaughtException', (err) => { console.log('🔥 [UNCAUGHT EXCEPTION] Prevented Crash:', err.message); });
process.on('unhandledRejection', (reason, promise) => { console.log('🔥 [UNHANDLED REJECTION] Prevented Crash:', reason); });

const _origErr = console.error;
console.error = (...a) => {
  const m = a.join(" ");
  if (m.includes("Bad MAC") || m.includes("Session error") || m.includes("verifyMAC") || m.includes("Failed to decrypt") || m.includes("decryptWithSessions") || m.includes("closed session")) return;
  _origErr(...a);
};

const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN || "3L4Ccoik7R16ilMsfKycK2OZkmC_7qvF29reP3BEE19h42nyk"; 
const NGROK_DOMAIN = process.env.NGROK_DOMAIN || "itinerary-splashy-flyer.ngrok-free.dev"; 

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const activeSockets = new Map();
const store = new Map(); 
let baileys;

global.ghostMode = false;
global.pollCache = new Map();

setInterval(() => {
    store.clear();
    global.pollCache.clear();
    if (global.gc) global.gc(); 
}, 10 * 60 * 1000); 

let autoStatusHandler; try { autoStatusHandler = require("./plugins/autostatus"); } catch (e) { autoStatusHandler = { handleStatusUpdate: () => {} }; }

let messageHandler; 
try { 
    messageHandler = require("./message"); 
    console.log("✅ Message Handler loaded successfully!");
} catch (e) { 
    console.log("❌ FAILED TO LOAD message.js:", e.message); 
    messageHandler = async () => {}; 
}

const funnyDeleted = ["🕵️‍♂️ Someone deleted a message, but I saved it! 🛡️", "📝 Deleted message rescued:"];

const rateLimits = new Map();
function rateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  if (!rateLimits.has(ip)) rateLimits.set(ip, []);
  const requests = rateLimits.get(ip).filter(time => now - time < 3600000);
  if (requests.length >= 5) return res.status(429).json({ success: false, error: "Too many requests." });
  requests.push(now); rateLimits.set(ip, requests);
  if (requests.length === 0) rateLimits.delete(ip); 
  next();
}

function attachHandlers(sock, phoneNumber) {
  const channelJid = `${config().newsletter.id}@newsletter`;
  const channelName = config().newsletter.name;

  // Load settings directly from PostgreSQL instead of local disk
  const loadGlobalSettings = async () => {
    let defaults = { autoread: false, autotyping: false, autorecording: false, autoreact: false, antidelete: false, antiedit: false, chreact: { enabled: false, emojis: ["💬"] }, prefix: "." };
    try {
      const saved = await getSessionSettings(phoneNumber);
      if (saved) return { ...defaults, ...saved };
    } catch {}
    return defaults;
  };

  const updateAutobio = async () => {
    try {
        const p = path.join(process.cwd(), 'database', 'autobio.json');
        if (fs.existsSync(p)) {
            const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (cfg.enabled === 1) {
                const bios = ["⚡ Built different.", "🥶 I don't do small talk.", "🛑 Zero tolerance.", "💼 Efficiency is my only language.", "🤖 I run on code.", "🧊 Cold hearted.", "📵 Call me? I'll block you.", "👑 The system doesn't sleep.", "⚙️ Programmed for perfection.", "🔇 Actions over words."];
                await sock.updateProfileStatus(bios[Math.floor(Math.random() * bios.length)]);
            }
        }
    } catch(e) {}
  };

  sock._autobioInterval = setInterval(updateAutobio, 60 * 60 * 1000);
  sock._autobioTimeout = setTimeout(updateAutobio, 5000);

  sock.ev.on("call", async (calls) => {
    try {
        const anticallPath = path.join(process.cwd(), 'database', 'anticall.json');
        let config = { enabled: 0, block: 0 };
        if (fs.existsSync(anticallPath)) { try { config = JSON.parse(fs.readFileSync(anticallPath, 'utf8')); } catch(e) {} }
        if (config.enabled === 1) {
            for (const call of calls) {
                if (call.status === "offer") {
                    await sock.rejectCall(call.id, call.from);
                    if (config.block === 1) { try { await sock.updateBlockStatus(call.from, "block"); } catch (e) {} } 
                    else { await sock.sendMessage(call.from, { text: `⚡ *ALPHA-XMD* ⚡\n──────────────────\n📵 *Call Blocked!*\nDrop a text message and let's get to work. 🤖💸`, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: channelJid, newsletterName: channelName } } }); }
                }
            }
        }
    } catch (e) {}
  });

  sock.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      if (!chatUpdate.messages?.length) return;
      const globalSettings = await loadGlobalSettings(); 

      for (const mek of chatUpdate.messages) {
        const remote = mek.key?.remoteJid;
        if (remote === "status@broadcast") {
          if (autoStatusHandler.handleStatusUpdate) { autoStatusHandler.handleStatusUpdate(sock, { messages: [mek] }).catch(() => {}); }
          continue; 
        }
        if (!mek.message) continue;
        const messageText = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
        const isCmd = messageText.startsWith(globalSettings.prefix);

        if (remote && remote.endsWith('@newsletter')) {
            if (mek.message.pollCreationMessage || mek.message.pollCreationMessageV3) { global.pollCache.set(mek.key.id, mek); }
            let autoReactChannels = {};
            try { if(fs.existsSync('./database/channel_automation.json')) autoReactChannels = JSON.parse(fs.readFileSync('./database/channel_automation.json')); } catch(e) {}
            if (autoReactChannels[remote]) {
                const emojis = ["🔥","💯","🚀","❤️","😂","⚡","🎉","👑","💎","🤯"];
                (async () => {
                    for (let e of emojis) {
                        try { if (sock.newsletterReact) { await sock.newsletterReact(remote, mek.key.id, e); } else { await sock.relayMessage(remote, { reactionMessage: { key: { remoteJid: remote, id: mek.key.id, fromMe: false }, text: e, senderTimestampMs: Date.now() } }, {}); } } catch (err) { break; }
                        await new Promise(r => setTimeout(r, 1500));
                    }
                })();
            } else if (isCmd) {
                try { if (sock.newsletterReact) { await sock.newsletterReact(remote, mek.key.id, "⚡"); } else { await sock.relayMessage(remote, { reactionMessage: { key: { remoteJid: remote, id: mek.key.id, fromMe: false }, text: "⚡", senderTimestampMs: Date.now() } }, {}); } } catch(e) {}
            } else {
                const cr = globalSettings.chreact || { enabled: false, emojis: ["💬"] };
                if (cr.enabled) {
                  for (const emoji of cr.emojis || []) {
                    try { if (sock.newsletterReact) { await sock.newsletterReact(remote, mek.key.id, emoji); } else { await sock.relayMessage(remote, { reactionMessage: { key: { remoteJid: remote, id: mek.key.id, fromMe: false }, text: emoji, senderTimestampMs: Date.now() } }, {}); } await new Promise(r => setTimeout(r, 1000)); } catch (e) {}
                  }
                }
            }
        }
        if (isCmd) { const senderNumber = mek.key.participant?.split('@')[0] || mek.key.remoteJid?.split('@')[0] || 'unknown'; console.log(`[CMD] ${phoneNumber} | ${senderNumber} | ${messageText.substring(0, 30)}`); }
        const m = await smsg(sock, mek);
        m.prefix = globalSettings.prefix;
        m.globalSettings = globalSettings; 
        if (m.text) { store.set(mek.key.id, { text: m.text || "", message: mek.message, sender: m.sender, pushName: m.pushName || null }); }
        await messageHandler(sock, m);
      }
    } catch (err) { console.log("⚠️ Message handler:", err.message); }
  });

  sock.ev.on("messages.update", async updates => {
    try {
      const globalSettings = await loadGlobalSettings();
      const ad = globalSettings.antidelete || { enabled: false, mode: "chat", style: "fancy", react: true };
      const ownerNumber = (config().owner?.[0] || "").replace(/[^0-9]/g, "");
      const ownerJid = ownerNumber ? `${ownerNumber}@s.whatsapp.net` : null;
      for (const update of updates) {
        const oldMsg = store.get(update.key.id);
        if (!oldMsg) continue;
        if (update.update?.message === null && ad.enabled) {
          const chat = update.key.remoteJid; if (!chat) continue;
          const isGroup = chat.endsWith("@g.us");
          const sender = oldMsg.sender || update.key.participant || chat;
          const senderNumber = sender.split("@")[0].replace(/[^0-9]/g, "");
          let chatName = "Private Chat";
          if (isGroup) { try { const gm = await sock.groupMetadata(chat); chatName = gm.subject; } catch {} }
          const now = new Date();
          const deleted = (oldMsg.text || "Media").replace(/\n/g, "\n│ │ ");
          let text = ad.style === "fancy" ? `╭───〔 👁️‍🗨️ ANTIDELETE 〕───⬣\n│\n│ 👤 @${senderNumber}\n│ 📍 ${chatName}\n│ 🕒 ${now.toLocaleTimeString()}\n│ 📅 ${now.toLocaleDateString()}\n│\n│ 🗑️:\n│ ┌─\n│ │ ${deleted}\n│ └─\n│ 🛡️ Alpha\n╰──` : `${funnyDeleted[0]}\n\n${oldMsg.text || "Media"}`;
          const destinations = [];
          if (ad.mode === "chat" || ad.mode === "both") destinations.push(chat);
          if ((ad.mode === "owner" || ad.mode === "both") && ownerJid) destinations.push(ownerJid);
          for (const dest of destinations) {
            const opts = {};
            if (isGroup && ad.style === "fancy" && dest === chat) opts.mentions = [sender];
            if (ad.style === "fancy") { await sock.sendMessage(dest, { text, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: channelJid, newsletterName: config().newsletter.name } }, ...opts }); } 
            else { await sock.sendMessage(dest, { text, ...opts }); }
            if (ad.react && dest === chat) { try { await sock.sendMessage(dest, { react: { text: "👀", key: update.key } }); } catch {} }
          }
        }
        if (globalSettings.antiedit && update.update?.message) {
          let newText = "";
          try { const msg = update.update.message; const type = Object.keys(msg)[0]; newText = msg[type]?.text || msg[type]?.caption || ""; } catch {}
          if (oldMsg.text && newText && oldMsg.text !== newText) { try { await sock.sendMessage(update.key.remoteJid, { text: `✏️ Edited.\n\n📌 Old: ${oldMsg.text}\n🆕 New: ${newText}` }); } catch {} }
        }
      }
    } catch {}
  });

  sock.ev.on("group-participants.update", async update => {
    try {
      const { id, participants, action } = update;
      let gs = { welcome: false, welcomeMsg: "🌟 Welcome @user!", goodbye: false, goodbyeMsg: "🚶‍♂️ @user left." };
      try { const all = JSON.parse(fs.readFileSync(path.join(__dirname, "database/groupSettings.json"), "utf8")); gs = all[id] || gs; } catch {}
      if (action === "add") {
        for (const user of participants) {
            let isAntibot = false;
            try { if(fs.existsSync('./database/antibot.json')) isAntibot = JSON.parse(fs.readFileSync('./database/antibot.json')).enabled === 1; } catch{}
            if (isAntibot) {
                const pInfo = gs.participants?.find(p => p.id === user) || {};
                const name = pInfo.notify || pInfo.name || "";
                if (name.toLowerCase().includes('bot') || name.toLowerCase().includes('baileys')) { await sock.groupParticipantsUpdate(id, [user], 'remove').catch(()=>{}); await sock.sendMessage(id, { text: `🤖 Removed a bot: ${name}` }); continue; }
            }
            let isAntiforeign = false, foreignCode = "";
            try { if(fs.existsSync('./database/antiforeign.json')) { const a = JSON.parse(fs.readFileSync('./database/antiforeign.json')); isAntiforeign = a.enabled === 1; foreignCode = a.code || ""; } } catch{}
            if (isAntiforeign && foreignCode) {
                const num = user.split('@')[0];
                if (num.startsWith(foreignCode)) { await sock.groupParticipantsUpdate(id, [user], 'remove').catch(()=>{}); await sock.sendMessage(id, { text: `🚫 Kicked @${num} (Foreign number: +${foreignCode})`, mentions: [user] }); continue; }
            }
        }
      }
      if (action === "add" && gs.welcome) { for (const user of participants) await sock.sendMessage(id, { text: gs.welcomeMsg.replace(/@user/g, `@${user.split("@")[0]}`), mentions: [user] }); }
      if (action === "remove" && gs.goodbye) { for (const user of participants) await sock.sendMessage(id, { text: gs.goodbyeMsg.replace(/@user/g, `@${user.split("@")[0]}`), mentions: [user] }); }
    } catch {}
  });

  setTimeout(async () => { try { await sock.newsletterFollow(channelJid); } catch {} }, 3000);
  setTimeout(async () => {
    try {
      const botName = config().settings?.title || "Alpha Bot";
      const text = `╭───〔 🤖 ${botName} 〕───⬣\n\n✅ Bot Online\n👑 Owner: Alpha\n📞 Contact: wa.me/263786641436\n🔥 Ready to use.`;
      await sock.sendMessage(sock.user.id, { text, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: channelJid, newsletterName: config().newsletter.name } } });
    } catch {}
  }, 4000);

  sock._presenceInterval = setInterval(() => { 
    if (sock.user) { if (!global.ghostMode) { sock.sendPresenceUpdate("available").catch(() => {}); } }
  }, 20000);
}

async function startBot(phoneNumber) {
  if (activeSockets.has(phoneNumber)) return; 
  console.log(chalk.blue(`🤖 Starting bot for ${phoneNumber} (PostgreSQL)`));

  try {
    const { version } = await baileys.fetchLatestBaileysVersion();
    
    // 🎯 POSTGRESQL AUTH STATE
    const { state, saveCreds } = await usePostgresAuthState(phoneNumber);

    const sock = baileys.default({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      syncFullHistory: false, 
      getMessage: async () => { return { conversation: '' }; },
      markOnlineOnConnect: false, 
    });

    global.currentSock = sock;

    const originalSendReceipt = sock.sendReceipt.bind(sock);
    sock.sendReceipt = async (jid, participant, ids, type) => {
        if (global.ghostMode && type === 'delivered') { return; }
        return originalSendReceipt(jid, participant, ids, type);
    };

    sock.ev.on("creds.update", saveCreds);
    activeSockets.set(phoneNumber, sock);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") console.log(chalk.green(`✅ [${phoneNumber}] Bot Connected!`));

      if (connection === "close") {
        if (sock._autobioInterval) clearInterval(sock._autobioInterval);
        if (sock._presenceInterval) clearInterval(sock._presenceInterval);
        if (sock._autobioTimeout) clearTimeout(sock._autobioTimeout);
        try { sock.ev.removeAllListeners(); sock.end(undefined); } catch (e) {}
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        activeSockets.delete(phoneNumber);
        
        if (code !== 401) {
          console.log(chalk.yellow(`🔄 [${phoneNumber}] Reconnecting in 5s...`));
          setTimeout(() => startBot(phoneNumber), 5000);
        } else {
          console.log(chalk.red(`❌ [${phoneNumber}] Logged out. Deleting session from DB.`));
          await deleteSession(phoneNumber);
        }
      }
    });

    attachHandlers(sock, phoneNumber);
  } catch (error) {
    console.log(chalk.red(`❌ Failed to start ${phoneNumber}: ${error.message}`));
  }
}

global.startBot = startBot;

app.get("/api/stats", (req, res) => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  res.json({ connected: activeSockets.size, status: "online", uptime: process.uptime(), memory: Math.round(used * 100) / 100, sessions: activeSockets.size });
});

app.get("/api/status", (req, res) => res.json({ connected: activeSockets.has(req.query.phoneNumber) }));

app.post("/api/pair", rateLimiter, async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber)) return res.status(400).json({ success: false, error: "Invalid number format." });
  if (activeSockets.has(phoneNumber)) return res.json({ success: true, alreadyPaired: true });

  try {
    const { version } = await baileys.fetchLatestBaileysVersion();
    
    // 🎯 POSTGRESQL AUTH STATE FOR PAIRING
    const { state, saveCreds } = await usePostgresAuthState(phoneNumber);

    const tempSock = baileys.default({
      version, logger: pino({ level: "silent" }), printQRInTerminal: false, auth: state, browser: baileys.Browsers.ubuntu("Chrome"), syncFullHistory: false
    });

    tempSock.ev.on("creds.update", saveCreds);
    let responded = false;

    tempSock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "connecting" && !responded) {
        setTimeout(async () => {
          try {
            const code = await tempSock.requestPairingCode(phoneNumber);
            const formatted = code.match(/.{1,4}/g)?.join("-") || code;
            responded = true;
            res.json({ success: true, phoneNumber, code: formatted });
          } catch (err) {
            if(!responded) { responded = true; res.status(500).json({ success: false, error: err.message }); try { tempSock.end(undefined); } catch (e) {} }
          }
        }, 3000);
      }
      if (connection === "open") { setTimeout(() => startBot(phoneNumber), 3000); }
      if (connection === "close") {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (code === 515) { setTimeout(() => startBot(phoneNumber), 5000); } 
        else if (!responded) { responded = true; res.status(500).json({ success: false, error: `Closed (${code})` }); try { tempSock.end(undefined); } catch (e) {} }
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post("/api/disconnect", async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    if (activeSockets.has(phoneNumber)) { await activeSockets.get(phoneNumber).logout(); activeSockets.delete(phoneNumber); }
    await deleteSession(phoneNumber);
    res.json({ success: true, message: "Bot disconnected." });
  } catch (err) { res.json({ success: true, message: "Session deleted." }); }
});

app.get("/api/settings", async (req, res) => {
  const { phoneNumber } = req.query;
  const saved = await getSessionSettings(phoneNumber);
  if (saved) return res.json(saved);
  res.json({ autoread: false, autotyping: false, antidelete: false, antilink: false, autoreact: false, chreact: { enabled: false, emojis: ["💬"] }, prefix: "." });
});

app.post("/api/settings", async (req, res) => {
  const { phoneNumber, settings } = req.body;
  await saveSessionSettings(phoneNumber, settings);
  res.json({ success: true });
});

(async () => {
  console.log("🚀 Starting Alpha Bot Server (PostgreSQL Mode)...");
  baileys = await import("@whiskeysockets/baileys");
  const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

  app.listen(PORT, async () => {
    console.log(`🌐 Internal API running on port ${PORT}`);
    try { 
      const ngrok = require("@ngrok/ngrok"); 
      const listener = await ngrok.forward({ addr: PORT, authtoken: NGROK_AUTHTOKEN, domain: NGROK_DOMAIN }); 
      console.log(`🚇 Ngrok Tunnel Active: ${listener.url()}`);
    } catch (err) {
      console.log("⚠️ Ngrok Error:", err.message);
    }

    // Auto-start all saved PostgreSQL sessions on boot
    try {
      await cleanupOldSignalKeys();
      const sessions = await getAllSavedSessions();
      console.log(`📂 Found ${sessions.length} PostgreSQL session(s):`, sessions.join(', '));
      for (const phone of sessions) {
        await startBot(phone);
      }
    } catch (err) {
      console.log("❌ Error loading PostgreSQL sessions:", err.message);
    }

    setInterval(() => { require('http').get(`http://localhost:${PORT}/api/stats`, () => {}).on('error', () => {}); }, 10 * 60 * 1000); 
    
    setInterval(() => {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`📊 Memory Usage: ${Math.round(used * 100) / 100} MB`);
      if (used > 450) { console.log(`⚠️ Memory limit reached. Restarting to prevent crash...`); process.exit(1); }
    }, 60000); 
  });
})();
