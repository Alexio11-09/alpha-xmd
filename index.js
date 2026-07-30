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
process.on("uncaughtException", (e) => console.log('Uncaught:', e));

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

let autoStatusHandler;
try {
    autoStatusHandler = require("./plugins/autostatus");
} catch {
    autoStatusHandler = { handleStatusUpdate: () => {} };
}

let messageHandler;
try { messageHandler = require("./message"); } catch { messageHandler = async () => {}; }

let globalSettings = {
    autoread: false, autotyping: false, autorecording: false, autoreact: false,
    antidelete: false, antiedit: false
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

const funnyWelcomes = [
    "🌟 A new legend has arrived! Welcome @user! 🎉",
    "👋 Look who decided to join us! Welcome @user! 🥳"
];
const funnyGoodbyes = [
    "🚶‍♂️ @user has left the building. We'll miss the vibes.",
    "😢 Another one bites the dust. Goodbye @user!"
];
const funnyDeleted = [
    "🕵️‍♂️ Someone deleted a message, but I saved it! 🛡️",
    "📝 Deleted message rescued:"
];
const funnyEdited = [
    "✏️ A message was edited. Here's the original:",
    "📝 Edit detected! Original version:"
];

let phoneNumber = null; // store globally
let pairingRequested = false;

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(chalk.yellow(text), ans => { resolve(ans); rl.close(); }));
};

// ---------- HANDLER ATTACHMENT (ONLY AFTER 'open') ----------
const attachHandlers = (sock, store) => {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsPath));
    if (saved["global"]) globalSettings = { ...globalSettings, ...saved["global"] };
  } catch (err) {}

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages || !messages[0]) return;
    const msg = messages[0];
    if (msg.key?.remoteJid === 'status@broadcast') {
      if (autoStatusHandler.handleStatusUpdate) {
        await autoStatusHandler.handleStatusUpdate(sock, { messages: [msg] });
      }
    }
  });

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

  // --- send connection DM after handlers attached
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
};

// ---------- MAIN ----------
const clientstart = async () => {
  await loadBaileys();

  // Delete session only if no creds (first run)
  if (!fs.existsSync('./session/creds.json')) {
    if (fs.existsSync('./session')) fs.rmSync('./session', { recursive: true, force: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    version,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    connectTimeoutMs: 120000,
    defaultQueryTimeoutMs: 120000,
    keepAliveIntervalMs: 30000,
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

  // ---------- GET PHONE NUMBER (only once) ----------
  if (!phoneNumber) {
    phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`📱 Enter your WhatsApp number (without + or spaces): `)));
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
  }
  if (!phoneNumber || phoneNumber.length < 10) {
    console.log(chalk.red('❌ Invalid number.'));
    process.exit(1);
  }
  console.log(chalk.green(`✅ Using number: ${phoneNumber}`));

  // ---------- PAIRING REQUEST (only once) ----------
  if (!pairingRequested && !state.creds.registered) {
    setTimeout(async () => {
      try {
        console.log(chalk.yellow('⏳ Requesting pairing code...'));
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(chalk.black(chalk.bgGreen(`\n✅ PAIRING CODE: ${code}`)));
        console.log(chalk.yellow(`\n📱 Instructions:`));
        console.log(chalk.gray('1. Open WhatsApp on your phone'));
        console.log(chalk.gray('2. Go to Settings > Linked Devices'));
        console.log(chalk.gray('3. Tap "Link a Device"'));
        console.log(chalk.gray(`4. Enter this code: ${code}\n`));
        console.log(chalk.green('⏳ Waiting for you to enter the code in WhatsApp...'));
        pairingRequested = true;
      } catch (error) {
        console.log(chalk.red('❌ Failed:'), error.message);
      }
    }, 3000);
  } else if (state.creds.registered) {
    console.log(chalk.green('✅ Already paired.'));
  }

  // ---------- CONNECTION UPDATE ----------
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    console.log(chalk.blue(`🔍 Connection state: ${connection}`));

    if (connection === 'open') {
      console.log(chalk.green('✅ Bot Connected!'));
      attachHandlers(sock, store);
    }
    
    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(chalk.yellow(`🔍 Close status code: ${statusCode}`));
      
      // If 401 (logged out), delete session and exit
      if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
        console.log(chalk.red('❌ Logged out. Deleting session and exiting.'));
        try {
          fs.rmSync('./session', { recursive: true, force: true });
        } catch (err) {}
        process.exit(0);
      }

      // For any other close (including 515, 408), reconnect without resetting pairing flag
      // This keeps the same code valid.
      console.log(chalk.yellow('🔄 Reconnecting in 10 seconds...'));
      setTimeout(clientstart, 10000);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Ping interval to keep socket alive
  setInterval(() => {
    if (sock.user) {
      sock.sendPresenceUpdate('available').catch(() => {});
    }
  }, 20000);
};

// Keep process alive
setInterval(() => {}, 60000);

clientstart();
