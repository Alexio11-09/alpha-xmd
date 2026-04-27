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

// Import the reliable auto‑status handler
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
    const saved = JSON.parse(fs.readFileSync(settingsPath));
    if (saved["global"]) globalSettings = { ...globalSettings, ...saved["global"] };
} catch (err) {}

let messageHandler;
try { messageHandler = require("./message"); } catch { messageHandler = async () => {}; }

let isRestarting = false;

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(chalk.yellow(text), ans => { resolve(ans); rl.close(); }));
};

// ==================== FUNNY DEFAULT MESSAGES ====================
const funnyWelcomes = [
    "🌟 A new legend has arrived! Welcome @user! 🎉",
    "👋 Look who decided to join us! Welcome @user! 🥳",
    "🦸‍♂️ Hero @user just landed in the group. Welcome!",
    "💫 Someone special just appeared. Hello @user!",
    "🎊 The party is now better because @user is here!",
    "🍾 Pop the champagne! @user joined the crew."
];

const funnyGoodbyes = [
    "🚶‍♂️ @user has left the building. We'll miss the vibes.",
    "😢 Another one bites the dust. Goodbye @user!",
    "👋 @user just slipped out. The group got a little quieter.",
    "🛸 @user has been abducted by aliens. Goodbye!",
    "💨 And just like that, @user vanished. Farewell!"
];

const funnyDeleted = [
    "🕵️‍♂️ Someone deleted a message, but I saved it! 🛡️",
    "📝 Deleted message rescued:",
    "🤫 Shh… a message disappeared, but not from me.",
    "👀 I saw what you deleted! Here it is:",
    "🗑️ Trash tried to eat this message, but I caught it."
];

const funnyEdited = [
    "✏️ A message was edited. Here's the original:",
    "📝 Edit detected! Original version:",
    "🕵️‍♀️ Someone changed their message. I caught the before:",
    "🤔 Wait, that wasn't there before. Original:",
    "✍️ Edit history brought to you by me."
];

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

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ Bot Connected!');

      // ---- AUTO FOLLOW CHANNEL ----
      const followChannel = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const newsletterJid = config().newsletter.id + '@newsletter';
          console.log('🔄 Following channel:', newsletterJid);
          await sock.newsletterFollow(newsletterJid);
          console.log('✅ Followed channel:', config().newsletter.name);
        } catch (err) {
          console.error('❌ Channel follow error:', err.message);
        }
      };
      followChannel();

      // ---- SEND CONNECTION DM TO OWNER ----
      const sendConnectionDM = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 4000));
          const ownerRaw = config().owner?.[0];
          if (!ownerRaw) return console.log('⚠️ No owner number in config, skipping DM.');
          const ownerJid = ownerRaw.includes('@') ? ownerRaw : ownerRaw + '@s.whatsapp.net';
          const botName = config().settings?.title || 'Alpha Bot';
          const repoLink = "https://GitHub.com/Alexio11-09/alpha-xmd";
          const channelLink = `https://whatsapp.com/channel/${config().newsletter.id}`;
          const ownerContact = "wa.me/263786641436";

          const message = `╭───〔  🤖 *${botName}*  〕───⬣\n\n` +
            `✅ *Bot Online*\n` +
            `👑 *Owner:* Alpha\n` +
            `📞 *Contact:* ${ownerContact}\n` +
            `📂 *Repo:* ${repoLink}\n` +
            `📢 *Channel:* ${channelLink}\n\n` +
            `🔥 Ready to use.`;

          await sock.sendMessage(ownerJid, {
            text: message,
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: config().newsletter.id + "@newsletter",
                newsletterName: config().newsletter.name
              }
            }
          });
          console.log('✅ Connection DM sent to owner');
        } catch (err) {
          console.error('❌ Failed to send connection DM:', err.message);
        }
      };
      sendConnectionDM();
    }
    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) process.exit(0);
      if (!isRestarting) {
        isRestarting = true;
        setTimeout(() => { clientstart(); isRestarting = false; }, 5000);
      }
    }
  });

  // ========== STATUS EVENTS (reliable single listener) ==========
  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages || !messages[0]) return;
    const msg = messages[0];
    if (msg.key?.remoteJid === 'status@broadcast') {
      if (autoStatusHandler.handleStatusUpdate) {
        await autoStatusHandler.handleStatusUpdate(sock, { messages: [msg] });
      }
    }
  });

  // ========== MAIN MESSAGE HANDLER ==========
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const messages = chatUpdate.messages;
      if (!messages?.length) return;

      try {
        const saved = JSON.parse(fs.readFileSync(settingsPath));
        if (saved["global"]) globalSettings = { ...globalSettings, ...saved["global"] };
      } catch (err) {}

      for (let mek of messages) {
        if (!mek.message) continue;

        if (mek.key.fromMe) {
            const txt = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
            if (!txt.startsWith(".")) continue;
        }

        if (mek.key?.remoteJid === "status@broadcast") continue;

        const m = await smsg(sock, mek);

        // Store message with sender for antidelete
        store.set(mek.key.id, { text: m.text || "", message: mek.message, sender: m.sender });

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

        // ---- AUTOREACT (skip commands) ----
        if (globalSettings.autoreact) {
          const txt = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
          if (!txt.startsWith(".")) {
            const emojis = ["🔥","😂","😍","😎","🤖","⚡","💯","👀","🥶","😈"];
            await sock.sendMessage(m.chat, { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: mek.key } });
          }
        }

        await messageHandler(sock, m);
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err) {}
  });

  // ANTIDELETE (UPGRADED) + ANTIEDIT (KEPT AS BEFORE)
  sock.ev.on('messages.update', async (updates) => {
    try {
      // Refresh global settings
      try {
        const saved = JSON.parse(fs.readFileSync(settingsPath));
        if (saved["global"]) globalSettings = { ...globalSettings, ...saved["global"] };
      } catch {}

      // Antidelete config
      const adConfig = globalSettings.antidelete || { enabled: false, mode: 'chat', style: 'fancy', react: true };
      const ownerJid = (config().owner?.[0] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';

      for (let update of updates) {
        const oldMsg = store.get(update.key.id);
        if (!oldMsg) continue;

        // ----- ANTIDELETE -----
        if (update.update.message === null) {
          if (!adConfig.enabled) continue;

          const chatJid = update.key.remoteJid;
          const senderJid = oldMsg.sender || update.key.participant || chatJid;
          const senderName = senderJid.split('@')[0];
          const isGroup = chatJid.endsWith('@g.us');

          // FIXED: Properly await group metadata
          let chatName = 'Private Chat';
          if (isGroup) {
            try {
              const gm = await sock.groupMetadata(chatJid);
              chatName = gm.subject;
            } catch {
              chatName = 'Group';
            }
          }

          const now = new Date();
          const time = now.toLocaleTimeString();
          const date = now.toLocaleDateString();

          let text;
          if (adConfig.style === 'fancy') {
            text = `╭───〔 👁️‍🗨️ ANTIDELETE 〕───⬣\n│\n│ 👤 *Sender:* @${senderName}\n│ 📍 *Chat:* ${chatName}\n│ 🕒 *Time:* ${time}\n│ 📅 *Date:* ${date}\n│\n│ 🗑️ *Deleted Message:*\n│ ┌─────────────────────┐\n│ │ ${(oldMsg.text || 'Media message').replace(/\n/g, '\n│ │ ')}\n│ └─────────────────────┘\n│\n│ 🛡️ *Saved by Alpha Bot*\n╰────────────⬣`;
          } else {
            const funny = ["🕵️‍♂️ Someone deleted a message, but I saved it! 🛡️","📝 Deleted message rescued:","🤫 Shh… a message disappeared, but not from me.","👀 I saw what you deleted! Here it is:","🗑️ Trash tried to eat this message, but I caught it."];
            text = funny[Math.floor(Math.random() * funny.length)] + `\n\n${oldMsg.text || 'Media message'}`;
          }

          const mentions = (adConfig.style === 'fancy' && senderJid !== sock.user.id) ? [senderJid] : [];

          const destinations = [];
          if (adConfig.mode === 'chat' || adConfig.mode === 'both') destinations.push(chatJid);
          if ((adConfig.mode === 'owner' || adConfig.mode === 'both') && ownerJid) destinations.push(ownerJid);

          for (const dest of destinations) {
            const opts = {};
            if (mentions.length > 0 && dest === chatJid) opts.mentions = mentions;

            if (adConfig.style === 'fancy') {
              await sock.sendMessage(dest, {
                text,
                contextInfo: {
                  forwardingScore: 999,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: config().newsletter.id + "@newsletter",
                    newsletterName: config().newsletter.name
                  }
                },
                ...opts
              });
            } else {
              await sock.sendMessage(dest, { text, ...opts });
            }

            // Auto-react
            if (adConfig.react && dest === chatJid) {
              try {
                await sock.sendMessage(dest, { react: { text: '👀', key: update.key } });
              } catch {}
            }
          }
        }

        // ----- ANTIEDIT (unchanged) -----
        if (globalSettings.antiedit && update.update?.message) {
          let newText = "";
          try {
            const msg = update.update.message;
            const type = Object.keys(msg)[0];
            newText = msg[type]?.text || msg[type]?.caption || "";
          } catch {}
          if (oldMsg?.text && newText && oldMsg.text !== newText) {
            const msg = funnyEdited[Math.floor(Math.random() * funnyEdited.length)];
            await sock.sendMessage(update.key.remoteJid, { text: `${msg}\n\n📌 Old: ${oldMsg.text}\n🆕 New: ${newText}` });
          }
        }
      }
    } catch (err) {
      console.log("Antidelete/antiedit error:", err);
    }
  });

  // WELCOME & GOODBYE (funny)
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      let groupSettings = { 
        welcome: false, 
        welcomeMsg: funnyWelcomes[Math.floor(Math.random() * funnyWelcomes.length)], 
        goodbye: false, 
        goodbyeMsg: funnyGoodbyes[Math.floor(Math.random() * funnyGoodbyes.length)]
      };
      try { const all = JSON.parse(fs.readFileSync(dbPath)); groupSettings = all[id] || groupSettings; } catch {}

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