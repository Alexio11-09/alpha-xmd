// © 2026 Alpha. All Rights Reserved.

// 🔥 AUTO INSTALL MISSING MODULES
const { execSync } = require("child_process");

const modules = [
  "pino",
  "@whiskeysockets/baileys",
  "@hapi/boom",
  "chalk",
  "axios",
  "node-fetch",
  "yt-search",
  "form-data",
  "file-type",
  "moment-timezone",
  "human-readable",
  "jimp",
  "fluent-ffmpeg",
  "@ffmpeg-installer/ffmpeg",
  "node-webpmux",
  "crypto-js",
  "adm-zip"
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

let isRestarting = false;

// 📲 INPUT
const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(chalk.yellow(text), (answer) => {
      resolve(answer);
      rl.close();
    });
  });
};

const clientstart = async () => {
  await loadBaileys();

  const { state, saveCreds } = await useMultiFileAuthState(`./${config().session}`);
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
      let decode = jidDecode(jid) || {};
      return decode.user && decode.server
        ? decode.user + '@' + decode.server
        : jid;
    }
    return jid;
  };

  // 🔥 PAIRING
  if (config().status.terminal && !sock.authState.creds.registered) {
    const phoneNumber = await question('📱 Enter your WhatsApp number (263...):\n');
    const code = await sock.requestPairingCode(phoneNumber);
    console.log(chalk.green(`🔥 PAIRING CODE: ${code}`));
  }

  sock.ev.on('creds.update', saveCreds);

  // 🔌 CONNECTION
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
      console.log('🔄 Connecting...');
    }

    if (connection === 'open') {
      console.log('✅ Connected!');
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

      console.log('❌ Disconnected:', statusCode);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('🚫 Logged out. Delete session.');
        process.exit(0);
      }

      if (!isRestarting) {
        isRestarting = true;
        console.log('🔄 Reconnecting...');
        setTimeout(() => {
          clientstart();
          isRestarting = false;
        }, 5000);
      }
    }
  });

  // 🔥🔥🔥 FINAL MESSAGE HANDLER (PRIVATE FIXED)
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const messages = chatUpdate.messages;
      if (!messages || !messages.length) return;

      for (let mek of messages) {
        if (!mek.message) continue;
        if (mek.key?.remoteJid === 'status@broadcast') continue;

        const m = await smsg(sock, mek);

        // 🔥 FORCE ALL MESSAGES THROUGH HANDLER
        await require("./message")(sock, m);
      }

    } catch (err) {
      console.log("MESSAGE ERROR:", err);
    }
  });

  sock.public = true;

  return sock;
};

clientstart();