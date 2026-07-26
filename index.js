
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
process.on("uncaughtException", (e) => console.log('⚠️ Error:', e.message));

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

let phoneNumber = null;
let pairingRequested = false; // this will become true after first request

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(chalk.yellow(text), ans => { resolve(ans); rl.close(); }));
};

// ---------- HANDLERS ----------
const attachHandlers = (sock, store) => {
  // ... (your full handlers from the working version)
  // For brevity, I'll include the full handlers from the working version you retrieved.
  // I'll paste the complete version in the final file.
};

// ---------- MAIN ----------
const clientstart = async () => {
  await loadBaileys();

  // Only delete session if it's the first run (no creds)
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
    keepAliveIntervalMs: 10000,
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

  // ---------- GET PHONE NUMBER ----------
  if (!phoneNumber) {
    phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`📱 Enter your WhatsApp number (without + or spaces): `)));
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
  }
  if (!phoneNumber || phoneNumber.length < 10) {
    console.log(chalk.red('❌ Invalid number.'));
    process.exit(1);
  }

  // ---------- PAIRING REQUEST (ONLY ONCE) ----------
  if (!pairingRequested && !state.creds.registered) {
    console.log(chalk.yellow('⏳ Requesting pairing code...'));
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(chalk.black(chalk.bgGreen(`\n✅ PAIRING CODE: ${code}`)));
        console.log(chalk.yellow(`\n📱 Instructions:`));
        console.log(chalk.gray('1. Open WhatsApp on your phone'));
        console.log(chalk.gray('2. Go to Settings > Linked Devices'));
        console.log(chalk.gray('3. Tap "Link a Device"'));
        console.log(chalk.gray(`4. Enter this code: ${code}\n`));
        console.log(chalk.green('⏳ Waiting for you to enter the code in WhatsApp...'));
        pairingRequested = true; // never request again
      } catch (error) {
        console.log(chalk.red('❌ Failed:'), error.message);
        // If it fails, allow retry only if the socket hasn't connected yet
      }
    }, 3000);
  } else if (state.creds.registered) {
    console.log(chalk.green('✅ Already paired.'));
    attachHandlers(sock, store);
  } else {
    console.log(chalk.green('⏳ Waiting for you to enter the code in WhatsApp...'));
  }

  // ---------- CONNECTION UPDATE ----------
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(chalk.green('✅ Bot Connected!'));
      attachHandlers(sock, store);
    }
    
    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
        console.log(chalk.red('❌ Logged out. Deleting session...'));
        try {
          fs.rmSync('./session', { recursive: true, force: true });
        } catch (err) {}
        process.exit(0);
      }
      // Do NOT reset pairingRequested – code is still valid
      console.log(chalk.yellow('🔄 Disconnected. Reconnecting...'));
      // Baileys will reconnect automatically, no need to call clientstart()
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Keep-alive ping every 10 seconds
  setInterval(() => {
    if (sock.user) {
      sock.sendPresenceUpdate('available').catch(() => {});
    }
  }, 10000);
};

setInterval(() => {}, 60000);
clientstart();
