// © 2026 Alpha. All Rights Reserved.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const pino = require("pino");
const chalk = require("chalk");
const { Boom } = require("@hapi/boom");
const { smsg } = require("./library/serialize");
const { useSQLiteAuthState } = require('@nevi-dev/sqlite-auth'); // 🎯 SQLITE IMPORT
const tenant = require("./library/tenant");
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

const sessionsDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

const activeSockets = new Map();
const pairingSockets = new Map();
const store = new Map(); 
const settingsCache = new Map(); 
let baileys;

global.ghostMode = false; // Legacy fallback; account-specific state is stored on each socket.
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

  const loadGlobalSettings = async () => {
    let defaults = { autoread: false, autotyping: false, autorecording: false, autoreact: false, antidelete: false, antiedit: false, chreact: { enabled: false, emojis: ["💬"] }, prefix: "." };
    try {
      const settingsPath = path.join(sessionsDir, phoneNumber, "settings.json");
      if (fs.existsSync(settingsPath)) {
          const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          const merged = { ...defaults, ...saved };
          settingsCache.set(phoneNumber, merged);
          return merged;
      }
    } catch (err) {}
    settingsCache.set(phoneNumber, defaults);
    return defaults;
  };

  const updateAutobio = async () => {
    try {
        const cfg = tenant.read(sock, 'autobio.json', { enabled: 0 });
        if (cfg) {
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
        const config = tenant.read(sock, 'anticall.json', { enabled: 0, block: 0 });
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
        try {
          const remote = mek.key?.remoteJid;
          if (remote === "status@broadcast") {
            if (autoStatusHandler.handleStatusUpdate) { autoStatusHandler.handleStatusUpdate(sock, { messages: [mek] }).catch(() => {}); }
            continue; 
          }
          if (!mek.message) continue;
          
          const messageText = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
          const isCmd = messageText.startsWith(globalSettings.prefix);

          if (remote && remote.endsWith('@newsletter')) {
              if (mek.message.pollCreationMessage || mek.message.pollCreationMessageV3) { global.pollCache.set(`${phoneNumber}:${mek.key.id}`, mek); }
              let autoReactChannels = {};
              try { const tenantChannelFile = path.join(sessionsDir, phoneNumber, 'channel_automation.json'); if(fs.existsSync(tenantChannelFile)) autoReactChannels = JSON.parse(fs.readFileSync(tenantChannelFile)); } catch(e) {}
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
          
          if (isCmd) { 
              const senderNumber = mek.key.participant?.split('@')[0] || mek.key.remoteJid?.split('@')[0] || 'unknown'; 
              console.log(`[CMD] ${phoneNumber} | ${senderNumber} | ${messageText.substring(0, 30)}`); 
          }
          
          const m = await smsg(sock, mek);
          m.prefix = globalSettings.prefix;
          m.globalSettings = globalSettings; 
          
          if (m.text) { store.set(`${phoneNumber}:${mek.key.id}`, { text: m.text || "", message: mek.message, sender: m.sender, pushName: m.pushName || null }); }
          
          await messageHandler(sock, m);

        } catch (err) {
          console.log("⚠️ Single message process error:", err.message);
        }
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
        const oldMsg = store.get(`${phoneNumber}:${update.key.id}`);
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
      try { const all = tenant.read(sock, 'groupSettings.json', {}); gs = all[id] || gs; } catch {}
      if (action === "add") {
        for (const user of participants) {
            let isAntibot = false;
            try { const a = tenant.read(sock, 'antibot.json', { enabled: 0 }); isAntibot = a.enabled === 1; } catch{}
            if (isAntibot) {
                const pInfo = gs.participants?.find(p => p.id === user) || {};
                const name = pInfo.notify || pInfo.name || "";
                if (name.toLowerCase().includes('bot') || name.toLowerCase().includes('baileys')) { await sock.groupParticipantsUpdate(id, [user], 'remove').catch(()=>{}); await sock.sendMessage(id, { text: `🤖 Removed a bot: ${name}` }); continue; }
            }
            let isAntiforeign = false, foreignCode = "";
            try { const a = tenant.read(sock, 'antiforeign.json', { enabled: 0, code: '' }); isAntiforeign = a.enabled === 1; foreignCode = a.code || ""; } catch{}
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
    if (sock.user) { if (!sock._ghostMode) { sock.sendPresenceUpdate("available").catch(() => {}); } }
  }, 20000);
}

async function startBot(phoneNumber) {
  if (activeSockets.has(phoneNumber)) return; 
  console.log(chalk.blue(`🤖 Starting bot for ${phoneNumber} (SQLite)`));

  try {
    const { version } = await baileys.fetchLatestBaileysVersion();
    
    // 🎯 SQLITE AUTH STATE
    const { state, saveCreds } = await useSQLiteAuthState(`./sessions/${phoneNumber}`, {
        dbName: 'auth.db', 
        cleanOldFiles: true 
    });

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

    sock._phoneNumber = phoneNumber;
    sock._ghostMode = false;
    global.currentSock = sock; // Backward compatibility for older plugins only.

    const originalSendReceipt = sock.sendReceipt.bind(sock);
    sock.sendReceipt = async (jid, participant, ids, type) => {
        if (sock._ghostMode && type === 'delivered') { return; }
        return originalSendReceipt(jid, participant, ids, type);
    };

    sock.ev.on("creds.update", saveCreds);
    activeSockets.set(phoneNumber, sock);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") console.log(chalk.green(`✅ [${phoneNumber}] Bot Connected!`));

      if (connection === "close") {
        if (sock._autobioInterval) clearInterval(sock._autobioInterval);
        if (sock._pairCleanup) clearTimeout(sock._pairCleanup);
        if (sock._presenceInterval) clearInterval(sock._presenceInterval);
        if (sock._autobioTimeout) clearTimeout(sock._autobioTimeout);
        try { sock.ev.removeAllListeners(); sock.end(undefined); } catch (e) {}
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (activeSockets.get(phoneNumber) === sock) activeSockets.delete(phoneNumber);

        if (code !== 401 && !sock._manualDisconnect && !activeSockets.has(phoneNumber)) {
          console.log(chalk.yellow(`🔄 [${phoneNumber}] Reconnecting in 5s...`));
          setTimeout(() => startBot(phoneNumber), 5000);
        } else {
          console.log(chalk.red(`❌ [${phoneNumber}] Logged out.`));
        }
      }
    });

    attachHandlers(sock, phoneNumber);
  } catch (error) {
    console.log(chalk.red(`❌ Failed to start ${phoneNumber}: ${error.message}`));
  }
}

global.startBot = startBot;

// Chat-based .pair command: uses the SAME SQLite auth system as the dashboard.
// It never deletes an existing session and prevents duplicate pairing attempts.
global.pairAccount = async function pairAccount(phoneNumber, callbacks = {}) {
  const validPhone = value => typeof value === "string" && /^\d{10,15}$/.test(value);
  const onCode = typeof callbacks.onCode === "function" ? callbacks.onCode : () => {};
  const onConnected = typeof callbacks.onConnected === "function" ? callbacks.onConnected : () => {};
  const onError = typeof callbacks.onError === "function" ? callbacks.onError : () => {};

  if (!validPhone(phoneNumber)) throw new Error("Invalid phone number. Use 10–15 digits with country code.");
  if (activeSockets.has(phoneNumber)) throw new Error("That number is already connected.");
  if (pairingSockets.has(phoneNumber)) throw new Error("A pairing request for that number is already running.");

  const { version } = await baileys.fetchLatestBaileysVersion();
  const { state, saveCreds } = await useSQLiteAuthState(`./sessions/${phoneNumber}`, {
    dbName: "auth.db",
    cleanOldFiles: true
  });

  const tempSock = baileys.default({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: baileys.Browsers.ubuntu("Chrome"),
    syncFullHistory: false
  });

  pairingSockets.set(phoneNumber, tempSock);
  tempSock.ev.on("creds.update", saveCreds);
  let codeSent = false;
  let finished = false;
  let requestTimer;

  const cleanup = () => {
    if (requestTimer) clearTimeout(requestTimer);
    if (pairingSockets.get(phoneNumber) === tempSock) pairingSockets.delete(phoneNumber);
  };

  tempSock.ev.on("connection.update", async update => {
    const { connection, lastDisconnect } = update;
    if (connection === "connecting" && !codeSent && !requestTimer) {
      requestTimer = setTimeout(async () => {
        try {
          const code = await tempSock.requestPairingCode(phoneNumber);
          codeSent = true;
          const formatted = code.match(/.{1,4}/g)?.join("-") || code;
          await onCode(formatted);
        } catch (err) {
          if (!finished) {
            finished = true;
            cleanup();
            try { tempSock.end(undefined); } catch {}
            await onError(err);
          }
        }
      }, 3000);
    }

    if (connection === "open") {
      finished = true;
      cleanup();
      try { tempSock.end(undefined); } catch {}
      await onConnected();
      setTimeout(() => startBot(phoneNumber), 2500);
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      cleanup();
      if (code === 515) {
        finished = true;
        setTimeout(() => startBot(phoneNumber), 5000);
      } else if (!finished) {
        finished = true;
        try { tempSock.end(undefined); } catch {}
        await onError(new Error(`Pairing connection closed (${code || "unknown"}). Please try again.`));
      }
    }
  });

  return { started: true };
};

// Dashboard control tokens: only the browser that completes pairing receives the token.
function validPhone(value) { return typeof value === "string" && /^\d{10,15}$/.test(value); }
function controlFile(phone) { return path.join(sessionsDir, phone, "control.json"); }
function hashToken(token) { return crypto.createHash("sha256").update(String(token)).digest("hex"); }
function issueControlToken(phone) {
  const token = crypto.randomBytes(32).toString("hex");
  fs.mkdirSync(path.join(sessionsDir, phone), { recursive: true });
  fs.writeFileSync(controlFile(phone), JSON.stringify({ tokenHash: hashToken(token), createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
  return token;
}
function authorized(req, phone) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !validPhone(phone)) return false;
  try {
    const saved = JSON.parse(fs.readFileSync(controlFile(phone), "utf8"));
    const a = Buffer.from(saved.tokenHash || "", "hex"), b = Buffer.from(hashToken(token), "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

app.get("/api/stats", (req, res) => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  res.json({ connected: activeSockets.size, status: "online", uptime: process.uptime(), memory: Math.round(used * 100) / 100, sessions: activeSockets.size });
});

app.get("/api/status", (req, res) => { const phone = req.query.phoneNumber; if (!validPhone(phone)) return res.status(400).json({ connected: false }); return res.json({ connected: activeSockets.has(phone) }); });

app.post("/api/pair", rateLimiter, async (req, res) => {
  const { phoneNumber } = req.body;
  if (!validPhone(phoneNumber)) return res.status(400).json({ success: false, error: "Invalid number format." });
  if (activeSockets.has(phoneNumber)) return res.json({ success: true, alreadyPaired: true, needsControlToken: true });
  if (pairingSockets.has(phoneNumber)) return res.status(409).json({ success: false, error: "A pairing request for this number is already running." });
  const existingControl = fs.existsSync(controlFile(phoneNumber));
  if (existingControl && !authorized(req, phoneNumber)) return res.status(403).json({ success: false, error: "This account is already registered. Use its saved dashboard access token." });
  let controlToken = null;

  try {
    const { version } = await baileys.fetchLatestBaileysVersion();

    // 🎯 SQLITE AUTH STATE FOR PAIRING
    const { state, saveCreds } = await useSQLiteAuthState(`./sessions/${phoneNumber}`, {
        dbName: 'auth.db',
        cleanOldFiles: true
    });

    const tempSock = baileys.default({
      version, logger: pino({ level: "silent" }), printQRInTerminal: false, auth: state, browser: baileys.Browsers.ubuntu("Chrome"), syncFullHistory: false
    });

    pairingSockets.set(phoneNumber, tempSock);
    tempSock.ev.on("creds.update", saveCreds);
    let responded = false;

    tempSock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "connecting" && !responded) {
        setTimeout(async () => {
          try {
            const code = await tempSock.requestPairingCode(phoneNumber);
            const formatted = code.match(/.{1,4}/g)?.join("-") || code;
            if (!existingControl) controlToken = issueControlToken(phoneNumber);
            responded = true;
            res.json({ success: true, phoneNumber, code: formatted, controlToken });
          } catch (err) {
            if(!responded) { responded = true; pairingSockets.delete(phoneNumber); res.status(500).json({ success: false, error: err.message }); try { tempSock.end(undefined); } catch (e) {} }
          }
        }, 3000);
      }
      if (connection === "open") { pairingSockets.delete(phoneNumber); setTimeout(() => { try { tempSock.end(undefined); } catch {} startBot(phoneNumber); }, 2500); }
      if (connection === "close") {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        pairingSockets.delete(phoneNumber);
        if (code === 515) { setTimeout(() => startBot(phoneNumber), 5000); } 
        else if (!responded) { responded = true; res.status(500).json({ success: false, error: `Closed (${code})` }); try { tempSock.end(undefined); } catch (e) {} }
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post("/api/disconnect", async (req, res) => {
  const { phoneNumber } = req.body || {};
  if (!validPhone(phoneNumber)) return res.status(400).json({ success: false, error: "Invalid number format." });
  if (!authorized(req, phoneNumber)) return res.status(403).json({ success: false, error: "Unauthorized. Pair this account from this browser first." });
  try {
    const sock = activeSockets.get(phoneNumber);
    if (sock) {
      activeSockets.delete(phoneNumber);
      sock._manualDisconnect = true;
      try { await sock.logout(); } catch {}
      try { sock.end(undefined); } catch {}
    }
    const sessionPath = path.join(sessionsDir, phoneNumber);
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
    settingsCache.delete(phoneNumber);
    res.json({ success: true, message: "Bot disconnected and session deleted." });
  } catch (err) { res.status(500).json({ success: false, error: "Could not disconnect this account." }); }
});

app.get("/api/settings", async (req, res) => {
  const phoneNumber = req.query.phoneNumber;
  if (!validPhone(phoneNumber)) return res.status(400).json({ success: false, error: "Invalid number format." });
  if (!authorized(req, phoneNumber)) return res.status(403).json({ success: false, error: "Unauthorized." });
  if (settingsCache.has(phoneNumber)) return res.json(settingsCache.get(phoneNumber));
  const settingsPath = path.join(sessionsDir, phoneNumber, "settings.json");
  try {
    const saved = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : { autoread: false, autotyping: false, autorecording: false, antidelete: false, antiedit: false, antilink: false, autoreact: false, chreact: { enabled: false, emojis: ["💬"] }, prefix: "." };
    settingsCache.set(phoneNumber, saved);
    return res.json(saved);
  } catch { return res.status(500).json({ success: false, error: "Could not read settings." }); }
});

app.post("/api/settings", async (req, res) => {
  const { phoneNumber, settings } = req.body || {};
  if (!validPhone(phoneNumber) || !settings || typeof settings !== "object" || Array.isArray(settings)) return res.status(400).json({ success: false, error: "Invalid settings request." });
  if (!authorized(req, phoneNumber)) return res.status(403).json({ success: false, error: "Unauthorized." });
  const allowed = ["autoread", "autotyping", "autorecording", "autoreact", "antidelete", "antiedit", "antilink", "chreact", "prefix"];
  const cleanSettings = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(settings, key)) cleanSettings[key] = settings[key];
  const dir = path.join(sessionsDir, phoneNumber);
  fs.mkdirSync(dir, { recursive: true });
  try {
    fs.writeFileSync(path.join(dir, "settings.json"), JSON.stringify(cleanSettings, null, 2), { mode: 0o600 });
    settingsCache.set(phoneNumber, cleanSettings);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, error: "Could not save settings." }); }
});

(async () => {
  console.log("🚀 Starting Alpha Bot Server (SQLite Mode)...");
  baileys = await import("@whiskeysockets/baileys");
  const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

  app.listen(PORT, async () => {
    console.log(`🌐 Internal API running on port ${PORT}`);
    try { 
      const ngrok = require("@ngrok/ngrok"); 
      if (!NGROK_AUTHTOKEN) throw new Error("Set NGROK_AUTHTOKEN in hosting environment variables.");
      const listener = await ngrok.forward({ addr: PORT, authtoken: NGROK_AUTHTOKEN, domain: NGROK_DOMAIN });
      console.log(`🚇 Ngrok Tunnel Active: ${listener.url()}`);
    } catch (err) {
      console.log("⚠️ Ngrok Error:", err.message);
    }

    // Auto-start saved SQLite sessions on boot
    try {
      const dirs = fs.readdirSync(sessionsDir);
      const sessions = dirs.filter(d => /^\d{10,15}$/.test(d));
      console.log(`📂 Found ${sessions.length} SQLite session(s):`, sessions.join(', '));
      for (const phone of sessions) {
        await startBot(phone);
        await new Promise(res => setTimeout(res, 3000)); // Stagger to prevent crash
      }
    } catch (err) {
      console.log("❌ Error loading SQLite sessions:", err.message);
    }

    setInterval(() => { require('http').get(`http://localhost:${PORT}/api/stats`, () => {}).on('error', () => {}); }, 10 * 60 * 1000); 

    setInterval(() => {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`📊 Memory Usage: ${Math.round(used * 100) / 100} MB`);
      if (used > 220) { console.log(`⚠️ Heap usage is high. Reduce concurrent sessions or restart manually if needed.`); }
    }, 60000); 
  });
})();