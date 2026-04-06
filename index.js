// © 2026 Alpha. All Rights Reserved.

// 🔥 REQUIRE FIXES
const fs = require("fs");
const { execSync } = require("child_process");

// 🔥 AUTO INSTALL MODULES
const modules = [
  "pino","@whiskeysockets/baileys","@hapi/boom","chalk","axios",
  "node-fetch","yt-search","form-data","file-type","moment-timezone",
  "human-readable","jimp","fluent-ffmpeg","@ffmpeg-installer/ffmpeg",
  "node-webpmux","crypto-js","adm-zip"
];

modules.forEach(mod => {
  try {
    require.resolve(mod);
  } catch {
    console.log(`📦 Installing ${mod}`);
    execSync(`npm install ${mod} --force`, { stdio: "inherit" });
  }
});

console.clear();

const config = () => require('./settings/config');
process.on("uncaughtException", console.error);

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

// ✅ SAFE MESSAGE HANDLER
let messageHandler;
try {
  messageHandler = require("./message");
} catch {
  messageHandler = async () => {};
}

let isRestarting = false;

// 📲 INPUT
const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(chalk.yellow(text), (answer) => {
      resolve(answer);
      rl.close();
    });
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
    browser: Browsers.macOS('Chrome')
  });

  // 🔄 JID FIX
  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let d = jidDecode(jid) || {};
      return d.user && d.server ? d.user + '@' + d.server : jid;
    }
    return jid;
  };

  const normalize = (jid) => {
    if (!jid) return jid;
    return jid.split(":")[0].split("@")[0];
  };

  // 🔥 SETTINGS LOADER
  const getSettings = () => {
    try {
      return JSON.parse(fs.readFileSync('./database/settings.json'));
    } catch {
      return {};
    }
  };

  // 💾 STORES
  const store = new Map();       // messages
  const statusStore = new Map(); // statuses

  // 🔥 PAIRING
  if (config().status.terminal && !sock.authState.creds.registered) {
    const phoneNumber = await question('📱 Enter your WhatsApp number:\n');
    const code = await sock.requestPairingCode(phoneNumber);
    console.log(chalk.green(`🔥 CODE: ${code}`));
  }

  sock.ev.on('creds.update', saveCreds);

  // 🔌 CONNECTION
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') console.log('🔄 Connecting...');
    if (connection === 'open') console.log('✅ Connected!');

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut) process.exit(0);

      if (!isRestarting) {
        isRestarting = true;
        setTimeout(() => {
          clientstart();
          isRestarting = false;
        }, 5000);
      }
    }
  });

  // 🔥 ANTIDELETE + ANTIEDIT
  sock.ev.on('messages.update', async (updates) => {
    const settings = getSettings();

    for (let update of updates) {
      const oldMsg = store.get(update.key.id);

      // 🛡️ ANTIDELETE
      if (settings.antidelete && update.update.message === null) {
        if (!oldMsg) return;

        await sock.sendMessage(update.key.remoteJid, {
          text: `🛡️ *Deleted Message*\n\n${oldMsg.text || "Media message"}`
        });
      }

      // ✏️ ANTIEDIT
      if (settings.antiedit && update.update?.message) {
        let newText = "";

        try {
          const msg = update.update.message;
          const type = Object.keys(msg)[0];
          newText = msg[type]?.text || msg[type]?.caption || "";
        } catch {}

        if (oldMsg && newText && oldMsg.text !== newText) {
          await sock.sendMessage(update.key.remoteJid, {
            text: `✏️ *Edited Message*\n\n📌 Old: ${oldMsg.text}\n🆕 New: ${newText}`
          });
        }
      }
    }
  });

  // 🔥 MESSAGE HANDLER
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const messages = chatUpdate.messages;
      if (!messages?.length) return;

      for (let mek of messages) {
        if (!mek.message) continue;

        const settings = getSettings();

        // 👁️ STATUS SYSTEM (PRO)
        if (mek.key?.remoteJid === 'status@broadcast') {

          // 💾 SAVE STATUS
          statusStore.set(mek.key.id, mek);

          // 👁️ AUTO VIEW
          if (settings.autoviewstatus) {
            await sock.readMessages([mek.key]);
          }

          // ❤️ AUTO REACT
          if (settings.autoreactstatus) {
            const emojis = ["🔥","😍","😂","💯","⚡","😎","🥶"];
            const random = emojis[Math.floor(Math.random() * emojis.length)];

            try {
              await sock.sendMessage(mek.key.remoteJid, {
                react: { text: random, key: mek.key }
              });
            } catch {}
          }

          return;
        }

        const m = await smsg(sock, mek);

        // 💾 SAVE MESSAGE
        store.set(mek.key.id, m);

        // 🔥 ADMIN DETECTION
        if (m.isGroup) {
          const metadata = await sock.groupMetadata(m.chat);
          const participants = metadata.participants;

          const senderId = normalize(sock.decodeJid(m.sender));
          const botId = normalize(sock.decodeJid(sock.user.id));

          m.isAdmin = participants.some(p => normalize(sock.decodeJid(p.id)) === senderId && p.admin);
          m.isBotAdmin = participants.some(p => normalize(sock.decodeJid(p.id)) === botId && p.admin);
        }

        // 🔥 AUTO FEATURES
        if (settings.autoread) await sock.readMessages([mek.key]);
        if (settings.autotyping) await sock.sendPresenceUpdate('composing', m.chat);
        if (settings.autorecording) await sock.sendPresenceUpdate('recording', m.chat);

        if (settings.autoreact) {
          const emojis = ["🔥","😂","😍","😎","🤖","⚡","💯","👀","🥶","😈"];
          const random = emojis[Math.floor(Math.random() * emojis.length)];

          await sock.sendMessage(m.chat, {
            react: { text: random, key: mek.key }
          });
        }

        await messageHandler(sock, m);

        await new Promise(r => setTimeout(r, 200));
      }

    } catch (err) {
      console.log("MESSAGE ERROR:", err);
    }
  });

  sock.public = true;
};

clientstart();