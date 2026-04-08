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

// Clean number helper
const clean = (jid) => {
    if (!jid) return "";
    try {
        return jid.toString().replace(/[^0-9]/g, "");
    } catch {
        return "";
    }
};

// Try multiple database paths
let dbPath = './database/groupSettings.json';
try {
    if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
    fs.writeFileSync(dbPath, '{}', { flag: 'a' });
} catch {
    dbPath = '/tmp/groupSettings.json';
}

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
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: true,
    markOnlineOnConnect: false
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
  const store = new Map();
  const statusStore = new Map();

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

  // 🔥 KEEP ALIVE FOR STATUS EVENTS
  sock.ev.on("presence.update", () => {});

  // 🔥 ANTIDELETE + ANTIEDIT
  sock.ev.on('messages.update', async (updates) => {
    const settings = getSettings();

    for (let update of updates) {
      const oldMsg = store.get(update.key.id);

      // 🛡️ ANTIDELETE
      if (settings.antidelete && update.update.message === null) {
        if (!oldMsg) continue;

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

        if (oldMsg && oldMsg.text && newText && oldMsg.text !== newText) {
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

        // 🔥 STRONG STATUS DETECTION
        const isStatus =
          mek.key?.remoteJid === "status@broadcast" ||
          mek.key?.participant?.includes("status");

        if (isStatus) {
          statusStore.set(mek.key.id, mek);

          if (settings.autoviewstatus) {
            await sock.readMessages([mek.key]);
          }

          if (settings.autoreactstatus) {
            const emojis = ["🔥","😍","😂","💯","⚡","😎","🥶"];
            const random = emojis[Math.floor(Math.random() * emojis.length)];

            try {
              await sock.sendMessage(mek.key.remoteJid, {
                react: { text: random, key: mek.key }
              });
            } catch {}
          }

          continue;
        }

        const m = await smsg(sock, mek);

        // ========== ANTILINK DETECTION (WITH MODE) ==========
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
                
                // Get bot owner number (the number bot is deployed on)
                const botOwnerNumber = clean(sock.user.id);
                const senderNum = clean(m.sender);
                const isBotOwner = (senderNum === botOwnerNumber);
                
                // Check mode: "owner" = only owner exempt, "admins" = admins + owner exempt
                const mode = groupSettings.antilinkMode || "admins";
                
                let exempt = false;
                if (mode === "owner") {
                    exempt = isBotOwner;
                } else {
                    exempt = isSenderAdmin || isBotOwner;
                }
                
                // Skip if exempt
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

        // ✏️ FALLBACK ANTIEDIT
        if (store.has(mek.key.id)) {
          const old = store.get(mek.key.id);

          if (old.text && m.text && old.text !== m.text) {
            if (settings.antiedit) {
              await sock.sendMessage(m.chat, {
                text: `✏️ *Edited Message*\n\n📌 Old: ${old.text}\n🆕 New: ${m.text}`
              });
            }
          }
        }

        // 💾 SAVE MESSAGE
        store.set(mek.key.id, {
          text: m.text || "",
          message: mek.message
        });

        // 🔥 ADMIN DETECTION (BOT IS ALWAYS ADMIN)
        if (m.isGroup) {
          try {
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;

            const senderJid = sock.decodeJid(m.sender);
            const senderNumber = senderJid.split('@')[0].replace(/[^0-9]/g, '');

            const botJid = sock.decodeJid(sock.user.id);
            const botNumber = botJid.split('@')[0].replace(/[^0-9]/g, '');

            m.isAdmin = participants.some(p => {
              const pJid = sock.decodeJid(p.id);
              const pNumber = pJid.split('@')[0].replace(/[^0-9]/g, '');
              return pNumber === senderNumber && (p.admin === 'admin' || p.admin === true);
            });

            m.isBotAdmin = true;

          } catch (err) {
            m.isAdmin = false;
            m.isBotAdmin = true;
          }
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

  // ========== WELCOME & GOODBYE (AUTO) ==========
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      
      let groupSettings = { 
        welcome: false, 
        welcomeMsg: "Welcome @user! 🎉", 
        goodbye: false, 
        goodbyeMsg: "Goodbye @user! 👋" 
      };
      
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