// © 2026 Alpha. All Rights Reserved.

const fs = require("fs");
const { execSync } = require("child_process");

const modules = [
  "pino","@whiskeysockets/baileys","@hapi/boom","chalk","axios",
  "node-fetch","yt-search","form-data","file-type","moment-timezone",
  "human-readable","fluent-ffmpeg","@ffmpeg-installer/ffmpeg",
  "crypto-js","adm-zip"
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
    autoread: false, autotyping: false, autorecording: false, autoreact: false,
    antidelete: false, antiedit: false
};

try {
    const saved = JSON.parse(fs.readFileSync(settingsPath));
    if (saved["global"]) globalSettings = { ...globalSettings, ...saved["global"] };
} catch (err) {}

let messageHandler;
try { messageHandler = require("./message"); } catch { messageHandler = async () => {}; }

let isRestarting = false;

const funnyWelcomes = ["🌟 Welcome @user! 🎉","👋 @user joined!"];
const funnyGoodbyes = ["🚶‍♂️ @user left.","😢 @user gone."];
const funnyDeleted = ["🕵️‍♂️ Deleted saved!","📝 Deleted rescued:"];
const funnyEdited = ["✏️ Original:","📝 Edit detected!"];

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

  // ========== AUTO PAIRING CODE (ALWAYS WORKS) ==========
  if (!sock.authState.creds.registered) {
    const ownerNumber = config().owner?.[0] || '263786641436';
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow('📱 Requesting pairing code...'));
    const code = await sock.requestPairingCode(ownerNumber);
    console.log(chalk.green(`🔥 YOUR PAIRING CODE: ${code}`));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white('📲 Open WhatsApp → Linked Devices → Link a Device'));
    console.log(chalk.white('🔢 Enter the code shown above'));
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ Bot Connected!');

      const followChannel = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const newsletterJid = config().newsletter.id + '@newsletter';
          await sock.newsletterFollow(newsletterJid);
        } catch (err) {}
      };
      followChannel();

      const sendConnectionDM = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 4000));
          const botJid = sock.user.id;
          const botName = config().settings?.title || 'Alpha Bot';
          const repoLink = "https://github.com/Alexio11-09/alpha-xmd";
          const channelLink = `https://whatsapp.com/channel/${config().newsletter.id}`;
          const ownerContact = "wa.me/263786641436";

          const message = `╭───〔  🤖 *${botName}*  〕───⬣\n\n` +
            `✅ *Bot Online*\n` +
            `👑 *Owner:* Alpha\n` +
            `📞 *Contact:* ${ownerContact}\n` +
            `📂 *Repo:* ${repoLink}\n` +
            `📢 *Channel:* ${channelLink}\n\n` +
            `🔥 Ready to use.`;

          await sock.sendMessage(botJid, {
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
        } catch (err) {}
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

  // ========== CHANNEL AUTO‑REACT ==========
  const channelJid = config().newsletter.id + '@newsletter';
  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages || !messages[0]) return;
    const msg = messages[0];
    if (msg.key?.remoteJid !== channelJid) return;

    try {
        const saved = JSON.parse(fs.readFileSync(settingsPath));
        if (saved["global"]) globalSettings = { ...globalSettings, ...saved["global"] };
    } catch {}

    const crConfig = globalSettings.chreact || { enabled: false, emojis: ['💬'] };
    if (!crConfig.enabled) return;

    for (const emoji of crConfig.emojis) {
      try {
        if (sock.newsletterReact) {
          await sock.newsletterReact(channelJid, msg.key.id, emoji);
        } else {
          await sock.relayMessage(channelJid, {
            reactionMessage: {
              key: { remoteJid: channelJid, id: msg.key.id, fromMe: false },
              text: emoji,
              senderTimestampMs: Date.now()
            }
          }, {});
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {}
    }
  });

  // ========== MAIN MESSAGE HANDLER ==========
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const messages = chatUpdate.messages;
      if (!messages?.length) return;

      for (let mek of messages) {
        if (!mek.message) continue;

        if (mek.key.fromMe) {
            const txt = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
            if (!txt.startsWith(".")) continue;
        }

        if (mek.key?.remoteJid === "status@broadcast") continue;
        if (mek.key?.remoteJid === channelJid) continue;

        const m = await smsg(sock, mek);

        const msgDbPath = './database/messageCount.json';
        if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
        if (!fs.existsSync(msgDbPath)) fs.writeFileSync(msgDbPath, '{}');
        try {
            const raw = fs.readFileSync(msgDbPath, 'utf-8');
            const counts = JSON.parse(raw.length ? raw : '{}');
            counts[m.chat] = counts[m.chat] || {};
            counts[m.chat][m.sender] = (counts[m.chat][m.sender] || 0) + 1;
            fs.writeFileSync(msgDbPath, JSON.stringify(counts, null, 2));
        } catch (countErr) {}

        store.set(mek.key.id, {
            text: m.text || "",
            message: mek.message,
            sender: m.sender,
            pushName: m.pushName || null
        });

        if (m.isGroup) {
          try {
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;
            const senderJidDecoded = sock.decodeJid(m.sender);
            const senderNumber = senderJidDecoded.split('@')[0].replace(/[^0-9]/g, '');
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
          const txt = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
          if (!txt.startsWith(".")) {
            const emojis = ["🔥","😂","😍","😎","🤖","⚡","💯","👀","🥶","😈"];
            await sock.sendMessage(m.chat, { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: mek.key } });
          }
        }

        await messageHandler(sock, m);
      }
    } catch (err) {}
  });

  // ANTIDELETE + ANTIEDIT
  sock.ev.on('messages.update', async (updates) => {
    try {
      try {
        const saved = JSON.parse(fs.readFileSync(settingsPath));
        if (saved["global"]) globalSettings = { ...globalSettings, ...saved["global"] };
      } catch {}

      const adConfig = globalSettings.antidelete || { enabled: false, mode: 'chat', style: 'fancy', react: true };
      const ownerJid = (config().owner?.[0] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';

      for (let update of updates) {
        const oldMsg = store.get(update.key.id);
        if (!oldMsg) continue;

        if (update.update.message === null) {
          if (!adConfig.enabled) continue;

          const chatJidDel = update.key.remoteJid;
          const isGroup = chatJidDel.endsWith('@g.us');
          const senderJidDel = oldMsg.sender || update.key.participant || chatJidDel;
          const senderNumber = senderJidDel.split('@')[0];
          const senderDisplayPrivate = oldMsg.pushName && oldMsg.pushName.trim() !== '' ? oldMsg.pushName : senderNumber;

          let chatName = 'Private Chat';
          if (isGroup) { try { const gm = await sock.groupMetadata(chatJidDel); chatName = gm.subject; } catch { chatName = 'Group'; } }

          const now = new Date();
          const time = now.toLocaleTimeString();
          const date = now.toLocaleDateString();

          let text;
          if (adConfig.style === 'fancy') {
            if (isGroup) text = `╭───〔 👁️‍🗨️ ANTIDELETE 〕───⬣\n│\n│ 👤 @${senderNumber}\n│ 📍 ${chatName}\n│ 🕒 ${time}\n│ 📅 ${date}\n│\n│ 🗑️:\n│ ┌─\n│ │ ${(oldMsg.text||'Media').replace(/\n/g,'\n│ │ ')}\n│ └─\n│ 🛡️ Alpha\n╰──`;
            else text = `╭───〔 👁️‍🗨️ ANTIDELETE 〕───⬣\n│\n│ 👤 ${senderDisplayPrivate}\n│ 📍 Private\n│ 🕒 ${time}\n│ 📅 ${date}\n│\n│ 🗑️:\n│ ┌─\n│ │ ${(oldMsg.text||'Media').replace(/\n/g,'\n│ │ ')}\n│ └─\n│ 🛡️ Alpha\n╰──`;
          } else text = funnyDeleted[0] + `\n\n${oldMsg.text||'Media'}`;

          const mentions = isGroup && adConfig.style === 'fancy' && senderJidDel !== sock.user.id ? [senderJidDel] : [];
          const destinations = [];
          if (adConfig.mode === 'chat' || adConfig.mode === 'both') destinations.push(chatJidDel);
          if ((adConfig.mode === 'owner' || adConfig.mode === 'both') && ownerJid) destinations.push(ownerJid);

          for (const dest of destinations) {
            const opts = {};
            if (mentions.length > 0 && dest === chatJidDel) opts.mentions = mentions;
            if (adConfig.style === 'fancy') {
              await sock.sendMessage(dest, { text, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: config().newsletter.id + "@newsletter", newsletterName: config().newsletter.name } }, ...opts });
            } else {
              await sock.sendMessage(dest, { text, ...opts });
            }
            if (adConfig.react && dest === chatJidDel) { try { await sock.sendMessage(dest, { react: { text: '👀', key: update.key } }); } catch {} }
          }
        }

        if (globalSettings.antiedit && update.update?.message) {
          let newText = "";
          try { const msg = update.update.message; const type = Object.keys(msg)[0]; newText = msg[type]?.text || msg[type]?.caption || ""; } catch {}
          if (oldMsg?.text && newText && oldMsg.text !== newText) {
            await sock.sendMessage(update.key.remoteJid, { text: `✏️ Edited.\n\n📌 Old: ${oldMsg.text}\n🆕 New: ${newText}` });
          }
        }
      }
    } catch (err) {}
  });

  // WELCOME & GOODBYE
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      let gs = { welcome: false, welcomeMsg: funnyWelcomes[Math.floor(Math.random() * funnyWelcomes.length)], goodbye: false, goodbyeMsg: funnyGoodbyes[Math.floor(Math.random() * funnyGoodbyes.length)] };
      try { const all = JSON.parse(fs.readFileSync(dbPath)); gs = all[id] || gs; } catch {}

      if (action === 'add' && gs.welcome) {
        for (let user of participants) {
          const msg = gs.welcomeMsg.replace(/@user/g, `@${user.split("@")[0]}`);
          await sock.sendMessage(id, { text: msg, mentions: [user] });
        }
      }
      if (action === 'remove' && gs.goodbye) {
        for (let user of participants) {
          const msg = gs.goodbyeMsg.replace(/@user/g, `@${user.split("@")[0]}`);
          await sock.sendMessage(id, { text: msg, mentions: [user] });
        }
      }
    } catch (err) {}
  });

  sock.public = true;
};

clientstart();