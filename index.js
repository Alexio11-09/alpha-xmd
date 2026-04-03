// © 2026 Alpha. All Rights Reserved.

console.clear();
const config = () => require('./settings/config');
process.on("uncaughtException", console.error);

// 🔥 LOAD BAILEYS DYNAMICALLY
let makeWASocket, Browsers, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidDecode, downloadContentFromMessage, jidNormalizedUser, isPnUser;

const loadBaileys = async () => {
  const baileys = await import('@whiskeysockets/baileys');
  
  makeWASocket = baileys.default;
  Browsers = baileys.Browsers;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
  jidDecode = baileys.jidDecode;
  downloadContentFromMessage = baileys.downloadContentFromMessage;
  jidNormalizedUser = baileys.jidNormalizedUser;
  isPnUser = baileys.isPnUser;
};

const pino = require('pino');
const readline = require("readline");
const chalk = require("chalk");
const { Boom } = require('@hapi/boom');

// 🔥 YOUR SYSTEM
const { smsg } = require('./library/serialize');
const { konek } = require('./library/connection/connection');

// 🔥 TERMINAL INPUT
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

let isRestarting = false;

// 🚀 START CLIENT
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

    // 🔥 decodeJid FIX
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server ? decode.user + '@' + decode.server : jid;
        } else return jid;
    };

    // 🔥 PAIRING CODE
    if (config().status.terminal && !sock.authState.creds.registered) {
        const phoneNumber = await question('📱 Enter your WhatsApp number (263...):\n');
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(chalk.green(`🔥 PAIRING CODE: ${code}`));
    }

    // 💾 SAVE CREDS
    sock.ev.on('creds.update', saveCreds);

    // 🔌 CONNECTION HANDLER (NEW SYSTEM)
    sock.ev.on('connection.update', (update) => {
        konek({ sock, update, clientstart, DisconnectReason, Boom });
    });

    // 📩 MESSAGE HANDLER
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const m = await smsg(sock, mek);

            require("./message")(sock, m, chatUpdate);

        } catch (err) {
            console.log("❌ Message Error:", err);
        }
    });

    sock.public = config().status.public;

    return sock;
};

// 🚀 START BOT
clientstart();