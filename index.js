

// © 2026 Alpha. All Rights Reserved.

const fs = require("fs");
const { execSync } = require("child_process");

const modules = [
  "pino","@whiskeysockets/baileys","@hapi/boom","chalk","axios",
  "node-fetch","yt-search","form-data","file-type","moment-timezone",
  "human-readable","jimp","fluent-ffmpeg","@ffmpeg-installer/ffmpeg",
  "node-webpmux","crypto-js","adm-zip"
];

modules.forEach(mod => {
  try { require.resolve(mod); } catch {
    execSync(`npm install ${mod} --force`, { stdio: "inherit" });
  }
});

console.clear();

const config = () => require('./settings/config');
process.on("uncaughtException", () => {});

let makeWASocket, Browsers, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidDecode;

const loadBaileys = async () => {
  const baileys = await import('@whiskeysockets/baileys');
  makeWASocket = baileys.default;
  Browsers = baileys.Browsers;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
  jidDecode = baileys.jidDecode;
};

const pino = require('pino');
const readline = require("readline");
const chalk = require("chalk");
const { Boom } = require('@hapi/boom');
const { smsg } = require('./library/serialize');

// Import auto status handler
let autoStatusHandler;
try {
    autoStatusHandler = require("./plugins/autostatus");
} catch {
    autoStatusHandler = { handleStatusUpdate: () => {} };
}

const clean = (jid) => {
    if (!jid) return "";
    try { return jid.toString().replace(/[^0-9]/g, ""); } catch { return ""; }
};

let dbPath = './database/groupSettings.json';
let settingsPath = './database/settings.json';
try {
    if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
    fs.writeFileSync(dbPath, '{}', { flag: 'a' });
    if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}');
} catch {
    dbPath = '/tmp/groupSettings.json';
    settingsPath = '/tmp/settings.json';
}

let globalSettings = {
    autoread: true, autotyping: false, autorecording: false, autoreact: false,
    antidelete: false, antiedit: false
};

try {
    const savedSettings = JSON.parse(fs.readFileSync(settingsPath));
    if (savedSettings["global"]) globalSettings = { ...globalSettings, ...savedSettings["global"] };
} catch (err) {}

let messageHandler;
try { messageHandler = require("./message"); } catch { messageHandler = async () => {}; }

let isRestarting = false;

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(chalk.yellow(text), (answer) => { resolve(answer); rl.close(); });
  });
};

const clientstart = async () => {
  await loadBaileys();
  const sessionPath = `./${config().session}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !config().status.terminal,
    auth: state,
    version,
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: true,
    markOnlineOnConnect: false
  });

  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let d = jidDecode(jid) || {};
      return d.user && d.server ? d.user + '@' + d.server : jid;
    }
    return jid;
  };

  const store = new Map();

  if (config().status.terminal && !sock.authState.creds.registered) {
    const phoneNumber = await question('📱 Enter your WhatsApp number:\n');
    const code = await sock.requestPairingCode(phoneNumber);
    console.log(chalk.green(`🔥 CODE: ${code}`));
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') console.log('✅ Bot Connected!');
    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) process.exit(0);
      if (!isRestarting) {
        isRestarting = true;
        setTimeout(() => { clientstart(); isRestarting = false; }, 5000);
      }
    }
  });

  // 🔥 STATUS DETECTION - WITH MESSAGE CONTENT
  sock.ev.on('messages.upsert', async (m) => {
    if (m.messages && m.messages[0]?.key?.remoteJid === 'status@broadcast') {
      const msg = m.messages[0];

      // Extract status content
      let content = '[Media Status]';
      if (msg.message?.conversation) content = msg.message.conversation;
      else if (msg.message?.extendedTextMessage?.text) content = msg.message.extendedTextMessage.text;
      else if (msg.message?.imageMessage?.caption) content = '📷 ' + msg.message.imageMessage.caption;
      else if (msg.message?.videoMessage?.caption) content = '🎥 ' + msg.message.videoMessage.caption;

      console.log(`\n📱 ========== STATUS ==========`);
      console.log(`👤 From: ${msg.key?.participant || msg.key?.remoteJid}`);
      console.log(`📝 Content: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
      console.log(`🆔 Full JID: ${msg.key?.participant || msg.key?.remoteJid}`);
      console.log(`===============================\n`);

      if (autoStatusHandler && autoStatusHandler.handleStatusUpdate) {
        await autoStatusHandler.handleStatusUpdate(sock, m);
      }
    }
  });

  sock.ev.on('status.update', async (status) => {
    console.log(`\n📱 STATUS UPDATE | JID: ${status.key?.remoteJid || 'N/A'}\n`);

    if (autoStatusHandler && autoStatusHandler.handleStatusUpdate) {
      await autoStatusHandler.handleStatusUpdate(sock, status);
    }
  });

  sock.ev.on('messages.reaction', async (status) => {
    console.log(`\n💫 STATUS REACTION | JID: ${status.key?.remoteJid || 'N/A'}\n`);

    if (autoStatusHandler && autoStatusHandler.handleStatusUpdate) {
      await autoStatusHandler.handleStatusUpdate(sock, status);
    }
  });

  // MAIN MESSAGE HANDLER
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const messages = chatUpdate.messages;
      if (!messages?.length) return;

      try {
        const savedSettings = JSON.parse(fs.readFileSync(settingsPath));
        if (savedSettings["global"]) globalSettings = { ...globalSettings, ...savedSettings["global"] };
      } catch (err) {}

      for (let mek of messages) {
        if (!mek.message) continue;

        // Skip messages from bot UNLESS they're commands
        if (mek.key.fromMe) {
            const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
            if (!text.startsWith(".")) continue;
        }

        if (mek.key?.remoteJid === "status@broadcast") continue;

        const m = await smsg(sock, mek);

        // 🔥 DEBUG: Show JID AND Message content
        const shortText = m.text ? (m.text.substring(0, 40) + (m.text.length > 40 ? '...' : '')) : '[Media]';

        if (m.isGroup) {
            console.log(`👥 GROUP | Chat: ${m.chat} | Sender: ${m.sender.split('@')[0]} | Msg: ${shortText}`);
        } else {
            console.log(`💬 PRIVATE | User: ${m.chat.split('@')[0]} | Msg: ${shortText}`);
        }

        // ANTILINK
        if (m.isGroup && m.text) {
          try {
            let groupSettings = { antilink: false, antilinkAction: "delete", antilinkMode: "admins" };
            try {
              const allSettings = JSON.parse(fs.readFileSync(dbPath));
              groupSettings = allSettings[m.chat] || groupSettings;
            } catch {}

            if (groupSettings.antilink) {
              const linkRegex = /(https?:\/\/|whatsapp\.com|chat\.whatsapp\.com|wa\.me|t\.me|discord\.gg|instagram\.com|facebook\.com|youtube\.com|twitter\.com)/i;

              if (linkRegex.test(m.text)) {
                const metadata = await sock.groupMetadata(m.chat);
                const senderJid = sock.decodeJid(m.sender);
                const senderNumber = senderJid.split('@')[0].replace(/[^0-9]/g, '');
                const isSenderAdmin = metadata.participants.some(p => {
                  const pNumber = sock.decodeJid(p.id).split('@')[0].replace(/[^0-9]/g, '');
                  return pNumber === senderNumber && p.admin;
                });

                const botOwnerNumber = clean(sock.user.id);
                const senderNum = clean(m.sender);
                const isBotOwner = (senderNum === botOwnerNumber);
                const mode = groupSettings.antilinkMode || "admins";

                let exempt = (mode === "owner") ? isBotOwner : (isSenderAdmin || isBotOwner);

                if (!exempt) {
                  const action = groupSettings.antilinkAction;
                  if (action === "delete") {
                    await sock.sendMessage(m.chat, { delete: mek.key });
                    await sock.sendMessage(m.chat, { text: "🛡️ Links are not allowed!" }, { quoted: mek });
                  } else if (action === "warn") {
                    await sock.sendMessage(m.chat, { text: "⚠️ Warning: Links are not allowed!" }, { quoted: mek });
                  } else if (action === "kick") {
                    await sock.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                    await sock.sendMessage(m.chat, { text: "🚫 User kicked for sending links!" });
                  }
                  return;
                }
              }
            }
          } catch (err) {}
        }

        store.set(mek.key.id, { text: m.text || "", message: mek.message });

        if (m.isGroup) {
          try {
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;
            const senderJid = sock.decodeJid(m.sender);
            const senderNumber = senderJid.split('@')[0].replace(/[^0-9]/g, '');
            m.isAdmin = participants.some(p => {
              const pJid = sock.decodeJid(p.id);
              const pNumber = pJid.split('@')[0].replace(/[^0-9]/g, '');
              return pNumber === senderNumber && (p.admin === 'admin' || p.admin === true);
            });
            m.isBotAdmin = true;
          } catch (err) { m.isAdmin = false; m.isBotAdmin = true; }
        }

        if (globalSettings.autoread) await sock.readMessages([mek.key]);
        if (globalSettings.autotyping) await sock.sendPresenceUpdate('composing', m.chat);
        if (globalSettings.autorecording) await sock.sendPresenceUpdate('recording', m.chat);
        if (globalSettings.autoreact) {
          const emojis = ["🔥","😂","😍","😎","🤖","⚡","💯","👀","🥶","😈"];
          await sock.sendMessage(m.chat, { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: mek.key } });
        }

        await messageHandler(sock, m);
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err) {}
  });

  // ANTIDELETE + ANTIEDIT
  sock.ev.on('messages.update', async (updates) => {
    try {
      try {
        const savedSettings = JSON.parse(fs.readFileSync(settingsPath));
        if (savedSettings["global"]) globalSettings = { ...globalSettings, ...savedSettings["global"] };
      } catch (err) {}

      for (let update of updates) {
        const oldMsg = store.get(update.key.id);

        if (globalSettings.antidelete && update.update.message === null && oldMsg) {
          await sock.sendMessage(update.key.remoteJid, { text: `🛡️ *Deleted Message*\n\n${oldMsg.text || "Media message"}` });
        }

        if (globalSettings.antiedit && update.update?.message) {
          let newText = "";
          try {
            const msg = update.update.message;
            const type = Object.keys(msg)[0];
            newText = msg[type]?.text || msg[type]?.caption || "";
          } catch {}
          if (oldMsg && oldMsg.text && newText && oldMsg.text !== newText) {
            await sock.sendMessage(update.key.remoteJid, { text: `✏️ *Edited Message*\n\n📌 Old: ${oldMsg.text}\n🆕 New: ${newText}` });
          }
        }
      }
    } catch (err) {}
  });

  // WELCOME & GOODBYE
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      let groupSettings = { welcome: false, welcomeMsg: "Welcome @user! 🎉", goodbye: false, goodbyeMsg: "Goodbye @user! 👋" };
      try {
        const allSettings = JSON.parse(fs.readFileSync(dbPath));
        groupSettings = allSettings[id] || groupSettings;
      } catch {}

      if (action === 'add' && groupSettings.welcome) {
        for (let user of participants) {
          const msg = groupSettings.welcomeMsg.replace(/@user/g, `@${user.split("@")[0]}`);
          await sock.sendMessage(id, { text: msg, mentions: [user] });
        }
      }
      if (action === 'remove' && groupSettings.goodbye) {
        for (let user of participants) {
          const msg = groupSettings.goodbyeMsg.replace(/@user/g, `@${user.split("@")[0]}`);
          await sock.sendMessage(id, { text: msg, mentions: [user] });
        }
      }
    } catch (err) {}
  });

  sock.public = true;
};

clientstart();