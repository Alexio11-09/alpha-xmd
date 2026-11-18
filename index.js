// © 2026 Alpha. All Rights Reserved.
const fs = require("fs");
const path = require("path");
const express = require("express");
const pino = require("pino");
const chalk = require("chalk");
const { Boom } = require("@hapi/boom");
const baileys = require("@whiskeysockets/baileys");
const { smsg } = require("./library/serialize");
const config = () => require("./settings/config");
const {
  usePostgresAuthState,
  getAllSavedSessions,
  deleteSession,
  getSessionSettings,
  saveSessionSettings,
  cleanupOldSignalKeys
} = require("./library/postgresAuth");

// 🎯 GLOBAL ERROR CATCHERS
process.on("uncaughtException", (err) => {
  console.log("🔥 [UNCAUGHT EXCEPTION] Prevented Crash:", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.log("🔥 [UNHANDLED REJECTION] Prevented Crash:", reason);
});

const _origErr = console.error;
console.error = (...a) => {
  const m = a.join(" ");
  if (
    m.includes("Bad MAC") ||
    m.includes("Session error") ||
    m.includes("verifyMAC") ||
    m.includes("Failed to decrypt") ||
    m.includes("decryptWithSessions") ||
    m.includes("closed session")
  )
    return;
  _origErr(...a);
};

const NGROK_AUTHTOKEN = "3L4Ccoik7R16ilMsfKycK2OZkmC_7qvF29reP3BEE19h42nyk";
const NGROK_DOMAIN = "itinerary-splashy-flyer.ngrok-free.dev";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const activeSockets = new Map();
const settingsCache = new Map();
const store = new Map();
const rateLimits = new Map();

global.ghostMode = false;
global.pollCache = new Map();

// 🧹 AUTOMATIC RAM & RATE-LIMIT SWEEP (Every 10 minutes)
setInterval(() => {
  store.clear();
  global.pollCache.clear();

  const now = Date.now();
  for (const [ip, timestamps] of rateLimits.entries()) {
    const valid = timestamps.filter((t) => now - t < 3600000);
    if (valid.length === 0) rateLimits.delete(ip);
    else rateLimits.set(ip, valid);
  }

  if (global.gc) global.gc();
}, 10 * 60 * 1000);

// 🧹 AUTOMATIC POSTGRESQL STALE KEY PRUNING (Every 6 hours)
setInterval(async () => {
  try {
    const pruned = await cleanupOldSignalKeys();
    if (pruned > 0) console.log(chalk.cyan(`🧹 [DB CLEANUP] Pruned ${pruned} stale Signal keys from PostgreSQL.`));
  } catch (e) {}
}, 6 * 60 * 60 * 1000);

let autoStatusHandler;
try {
  autoStatusHandler = require("./plugins/autostatus");
} catch (e) {
  autoStatusHandler = { handleStatusUpdate: () => {} };
}

let messageHandler;
try {
  messageHandler = require("./message");
  console.log("✅ Message Handler loaded successfully!");
} catch (e) {
  console.log("❌ FAILED TO LOAD message.js:", e.message);
  messageHandler = async () => {};
}

const funnyDeleted = ["🕵️‍♂️ Someone deleted a message, but I saved it! 🛡️", "📝 Deleted message rescued:"];

function rateLimiter(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();
  if (!rateLimits.has(ip)) rateLimits.set(ip, []);
  const requests = rateLimits.get(ip).filter((time) => now - time < 3600000);
  if (requests.length >= 5) return res.status(429).json({ success: false, error: "Too many requests." });
  requests.push(now);
  rateLimits.set(ip, requests);
  next();
}

const DEFAULT_SETTINGS = {
  autoread: false,
  autotyping: false,
  autorecording: false,
  autoreact: false,
  antidelete: false,
  antiedit: false,
  chreact: { enabled: false, emojis: ["💬"] },
  prefix: "."
};

async function loadGlobalSettings(phoneNumber) {
  if (settingsCache.has(phoneNumber)) return settingsCache.get(phoneNumber);
  try {
    const saved = await getSessionSettings(phoneNumber);
    const merged = { ...DEFAULT_SETTINGS, ...(saved || {}) };
    settingsCache.set(phoneNumber, merged);
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function attachHandlers(sock, phoneNumber) {
  const channelJid = `${config().newsletter.id}@newsletter`;
  const channelName = config().newsletter.name;

  const updateAutobio = async () => {
    try {
      const p = path.join(process.cwd(), "database", "autobio.json");
      if (fs.existsSync(p)) {
        const cfg = JSON.parse(fs.readFileSync(p, "utf8"));
        if (cfg.enabled === 1) {
          const bios = [
            "⚡ Built different.",
            "🥶 I don't do small talk.",
            "🛑 Zero tolerance.",
            "💼 Efficiency is my only language.",
            "🤖 I run on code.",
            "🧊 Cold hearted.",
            "📵 Call me? I'll block you.",
            "👑 The system doesn't sleep.",
            "⚙️ Programmed for perfection.",
            "🔇 Actions over words."
          ];
          await sock.updateProfileStatus(bios[Math.floor(Math.random() * bios.length)]);
        }
      }
    } catch (e) {}
  };

  sock._autobioInterval = setInterval(updateAutobio, 60 * 60 * 1000);
  sock._autobioTimeout = setTimeout(updateAutobio, 5000);

  sock.ev.on("call", async (calls) => {
    try {
      const anticallPath = path.join(process.cwd(), "database", "anticall.json");
      let cfg = { enabled: 0, block: 0 };
      if (fs.existsSync(anticallPath)) {
        try {
          cfg = JSON.parse(fs.readFileSync(anticallPath, "utf8"));
        } catch (e) {}
      }
      if (cfg.enabled === 1) {
        for (const call of calls) {
          if (call.status === "offer") {
            await sock.rejectCall(call.id, call.from);
            if (cfg.block === 1) {
              try {
                await sock.updateBlockStatus(call.from, "block");
              } catch (e) {}
            } else {
              await sock.sendMessage(call.from, {
                text: `⚡ *ALPHA-XMD* ⚡\n──────────────────\n📵 *Call Blocked!*\nDrop a text message and let's get to work. 🤖💸`,
                contextInfo: {
                  forwardingScore: 999,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: { newsletterJid: channelJid, newsletterName: channelName }
                }
              });
            }
          }
        }
      }
    } catch (e) {}
  });

  sock.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      if (!chatUpdate.messages?.length) return;
      const globalSettings = await loadGlobalSettings(phoneNumber);

      for (const mek of chatUpdate.messages) {
        const remote = mek.key?.remoteJid;
        if (remote === "status@broadcast") {
          if (autoStatusHandler.handleStatusUpdate) {
            autoStatusHandler.handleStatusUpdate(sock, { messages: [mek] }).catch(() => {});
          }
          continue;
        }
        if (!mek.message) continue;

        const msgContent =
          mek.message?.ephemeralMessage?.message ||
          mek.message?.deviceSentMessage?.message ||
          mek.message;
        const messageText =
          msgContent?.conversation ||
          msgContent?.extendedTextMessage?.text ||
          msgContent?.imageMessage?.caption ||
          msgContent?.videoMessage?.caption ||
          "";
        const isCmd = messageText.startsWith(globalSettings.prefix);

        if (remote && remote.endsWith("@newsletter")) {
          if (mek.message.pollCreationMessage || mek.message.pollCreationMessageV3) {
            global.pollCache.set(mek.key.id, mek);
          }
          let autoReactChannels = {};
          try {
            if (fs.existsSync("./database/channel_automation.json")) {
              autoReactChannels = JSON.parse(fs.readFileSync("./database/channel_automation.json"));
            }
          } catch (e) {}
          if (autoReactChannels[remote]) {
            const emojis = ["🔥", "💯", "🚀", "❤️", "😂", "⚡", "🎉", "👑", "💎", "🤯"];
            (async () => {
              for (let e of emojis) {
                try {
                  if (sock.newsletterReact) {
                    await sock.newsletterReact(remote, mek.key.id, e);
                  } else {
                    await sock.relayMessage(
                      remote,
                      { reactionMessage: { key: { remoteJid: remote, id: mek.key.id, fromMe: false }, text: e, senderTimestampMs: Date.now() } },
                      {}
                    );
                  }
                } catch (err) {
                  break;
                }
                await new Promise((r) => setTimeout(r, 1500));
              }
            })();
          } else if (isCmd) {
            try {
              if (sock.newsletterReact) {
                await sock.newsletterReact(remote, mek.key.id, "⚡");
              } else {
                await sock.relayMessage(
                  remote,
                  { reactionMessage: { key: { remoteJid: remote, id: mek.key.id, fromMe: false }, text: "⚡", senderTimestampMs: Date.now() } },
                  {}
                );
              }
            } catch (e) {}
          } else {
            const cr = globalSettings.chreact || { enabled: false, emojis: ["💬"] };
            if (cr.enabled) {
              for (const emoji of cr.emojis || []) {
                try {
                  if (sock.newsletterReact) {
                    await sock.newsletterReact(remote, mek.key.id, emoji);
                  } else {
                    await sock.relayMessage(
                      remote,
                      { reactionMessage: { key: { remoteJid: remote, id: mek.key.id, fromMe: false }, text: emoji, senderTimestampMs: Date.now() } },
                      {}
                    );
                  }
                  await new Promise((r) => setTimeout(r, 1000));
                } catch (e) {}
              }
            }
          }
        }

        if (isCmd) {
          const senderNumber = mek.key.participant?.split("@")[0] || mek.key.remoteJid?.split("@")[0] || "unknown";
          console.log(`[CMD] ${phoneNumber} | ${senderNumber} | ${messageText.substring(0, 30)}`);
        }

        const m = await smsg(sock, mek);
        m.prefix = globalSettings.prefix;
        m.globalSettings = globalSettings;
        if (m.text) {
          store.set(mek.key.id, {
            text: m.text || "",
            message: mek.message,
            sender: m.sender,
            pushName: m.pushName || null
          });
        }
        await messageHandler(sock, m);
      }
    } catch (err) {
      console.log("⚠️ Message handler:", err.message);
    }
  });

  sock.ev.on("messages.update", async (updates) => {
    try {
      const globalSettings = await loadGlobalSettings(phoneNumber);
      const ad = globalSettings.antidelete || { enabled: false, mode: "chat", style: "fancy", react: true };
      const ownerNumber = (config().owner?.[0] || "").replace(/[^0-9]/g, "");
      const ownerJid = ownerNumber ? `${ownerNumber}@s.whatsapp.net` : null;

      for (const update of updates) {
        const oldMsg = store.get(update.key.id);
        if (!oldMsg) continue;
        if (update.update?.message === null && ad.enabled) {
          const chat = update.key.remoteJid;
          if (!chat) continue;
          const isGroup = chat.endsWith("@g.us");
          const sender = oldMsg.sender || update.key.participant || chat;
          const senderNumber = sender.split("@")[0].replace(/[^0-9]/g, "");
          let chatName = "Private Chat";
          if (isGroup) {
            try {
              const gm = await sock.groupMetadata(chat);
              chatName = gm.subject;
            } catch {}
          }
          const now = new Date();
          const deleted = (oldMsg.text || "Media").replace(/\n/g, "\n│ │ ");
          let text =
            ad.style === "fancy"
              ? `╭───〔 👁️‍🗨️ ANTIDELETE 〕───⬣\n│\n│ 👤 @${senderNumber}\n│ 📍 ${chatName}\n│ 🕒 ${now.toLocaleTimeString()}\n│ 📅 ${now.toLocaleDateString()}\n│\n│ 🗑️:\n│ ┌─\n│ │ ${deleted}\n│ └─\n│ 🛡️ Alpha\n╰──`
              : `${funnyDeleted[0]}\n\n${oldMsg.text || "Media"}`;

          const destinations = [];
          if (ad.mode === "chat" || ad.mode === "both") destinations.push(chat);
          if ((ad.mode === "owner" || ad.mode === "both") && ownerJid) destinations.push(ownerJid);

          for (const dest of destinations) {
            const opts = {};
            if (isGroup && ad.style === "fancy" && dest === chat) opts.mentions = [sender];
            if (ad.style === "fancy") {
              await sock.sendMessage(dest, {
                text,
                contextInfo: {
                  forwardingScore: 999,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: { newsletterJid: channelJid, newsletterName: channelName }
                },
                ...opts
              });
            } else {
              await sock.sendMessage(dest, { text, ...opts });
            }
            if (ad.react && dest === chat) {
              try {
                await sock.sendMessage(dest, { react: { text: "👀", key: update.key } });
              } catch {}
            }
          }
        }
        if (globalSettings.antiedit && update.update?.message) {
          let newText = "";
          try {
            const msg = update.update.message;
            const type = Object.keys(msg)[0];
            newText = msg[type]?.text || msg[type]?.caption || "";
          } catch {}
          if (oldMsg.text && newText && oldMsg.text !== newText) {
            try {
              await sock.sendMessage(update.key.remoteJid, {
                text: `✏️ Edited.\n\n📌 Old: ${oldMsg.text}\n🆕 New: ${newText}`
              });
            } catch {}
          }
        }
      }
    } catch {}
  });

  sock.ev.on("group-participants.update", async (update) => {
    try {
      const { id, participants, action } = update;
      let gs = { welcome: false, welcomeMsg: "🌟 Welcome @user!", goodbye: false, goodbyeMsg: "🚶‍♂️ @user left." };
      try {
        const all = JSON.parse(fs.readFileSync(path.join(__dirname, "database/groupSettings.json"), "utf8"));
        gs = all[id] || gs;
      } catch {}

      if (action === "add") {
        for (const user of participants) {
          let isAntibot = false;
          try {
            if (fs.existsSync("./database/antibot.json")) {
              isAntibot = JSON.parse(fs.readFileSync("./database/antibot.json")).enabled === 1;
            }
          } catch {}
          if (isAntibot) {
            const pInfo = gs.participants?.find((p) => p.id === user) || {};
            const name = pInfo.notify || pInfo.name || "";
            if (name.toLowerCase().includes("bot") || name.toLowerCase().includes("baileys")) {
              await sock.groupParticipantsUpdate(id, [user], "remove").catch(() => {});
              await sock.sendMessage(id, { text: `🤖 Removed a bot: ${name}` });
              continue;
            }
          }
          let isAntiforeign = false,
            foreignCode = "";
          try {
            if (fs.existsSync("./database/antiforeign.json")) {
              const a = JSON.parse(fs.readFileSync("./database/antiforeign.json"));
              isAntiforeign = a.enabled === 1;
              foreignCode = a.code || "";
            }
          } catch {}
          if (isAntiforeign && foreignCode) {
            const num = user.split("@")[0];
            if (num.startsWith(foreignCode)) {
              await sock.groupParticipantsUpdate(id, [user], "remove").catch(() => {});
              await sock.sendMessage(id, {
                text: `🚫 Kicked @${num} (Foreign number: +${foreignCode})`,
                mentions: [user]
              });
              continue;
            }
          }
        }
      }
      if (action === "add" && gs.welcome) {
        for (const user of participants) {
          await sock.sendMessage(id, {
            text: gs.welcomeMsg.replace(/@user/g, `@${user.split("@")[0]}`),
            mentions: [user]
          });
        }
      }
      if (action === "remove" && gs.goodbye) {
        for (const user of participants) {
          await sock.sendMessage(id, {
            text: gs.goodbyeMsg.replace(/@user/g, `@${user.split("@")[0]}`),
            mentions: [user]
          });
        }
      }
    } catch {}
  });

  setTimeout(async () => {
    try {
      await sock.newsletterFollow(channelJid);
    } catch {}
  }, 3000);

  setTimeout(async () => {
    try {
      const botName = config().settings?.title || "Alpha Bot";
      const text = `╭───〔 🤖 ${botName} 〕───⬣\n\n✅ Bot Online (PostgreSQL Cloud)\n👑 Owner: Alpha\n📞 Contact: wa.me/263786641436\n🔥 Ready to use.`;
      await sock.sendMessage(sock.user.id, {
        text,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: { newsletterJid: channelJid, newsletterName: config().newsletter.name }
        }
      });
    } catch {}
  }, 4000);

  sock._presenceInterval = setInterval(() => {
    if (sock.user && !global.ghostMode) {
      sock.sendPresenceUpdate("available").catch(() => {});
    }
  }, 20000);
}

async function startBot(phoneNumber) {
  if (activeSockets.has(phoneNumber)) return;
  console.log(chalk.blue(`🤖 Starting bot for ${phoneNumber}`));

  try {
    const { version } = await baileys.fetchLatestBaileysVersion();
    const { state, saveCreds } = await usePostgresAuthState(phoneNumber);

    const sock = baileys.default({
      version,
      logger: pino({ level: "silent" }, pino.destination({ dest: '/dev/null', sync: true })),
      printQRInTerminal: false,
      auth: state,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      syncFullHistory: false,
      getMessage: async () => ({ conversation: "" }),
      markOnlineOnConnect: false
    });

    global.currentSock = sock;

    const originalSendReceipt = sock.sendReceipt.bind(sock);
    sock.sendReceipt = async (jid, participant, ids, type) => {
      if (global.ghostMode && type === "delivered") return;
      return originalSendReceipt(jid, participant, ids, type);
    };

    sock.ev.on("creds.update", saveCreds);
    activeSockets.set(phoneNumber, sock);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") console.log(chalk.green(`✅ [${phoneNumber}] Bot Connected!`));

      if (connection === "close") {
        if (sock._autobioInterval) clearInterval(sock._autobioInterval);
        if (sock._presenceInterval) clearInterval(sock._presenceInterval);
        if (sock._autobioTimeout) clearTimeout(sock._autobioTimeout);
        try {
          sock.ev.removeAllListeners();
          sock.end(undefined);
        } catch (e) {}
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        activeSockets.delete(phoneNumber);

        if (code === 401) {
          console.log(chalk.red(`🗑️ [${phoneNumber}] Logged out (401), removing from PostgreSQL...`));
          await deleteSession(phoneNumber).catch(() => {});
        } else {
          console.log(chalk.yellow(`🔄 [${phoneNumber}] Reconnecting in 5s...`));
          setTimeout(() => startBot(phoneNumber), 5000);
        }
      }
    });

    attachHandlers(sock, phoneNumber);
  } catch (error) {
    console.log(chalk.red(`❌ Failed to start ${phoneNumber}: ${error.message}`));
  }
}

global.startBot = startBot;

app.get("/api/stats", (req, res) => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  res.json({
    connected: activeSockets.size,
    status: "online",
    uptime: process.uptime(),
    memory: Math.round(used * 100) / 100,
    sessions: activeSockets.size
  });
});

app.get("/api/status", (req, res) => res.json({ connected: activeSockets.has(req.query.phoneNumber) }));

app.post("/api/pair", rateLimiter, async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber))
    return res.status(400).json({ success: false, error: "Invalid number format." });
  if (activeSockets.has(phoneNumber)) return res.json({ success: true, alreadyPaired: true });

  setImmediate(async () => {
    try {
      const { version } = await baileys.fetchLatestBaileysVersion();
      const { state, saveCreds } = await usePostgresAuthState(phoneNumber);

      const tempSock = baileys.default({
        version,
        logger: pino({ level: "silent" }, pino.destination({ dest: '/dev/null', sync: true })),
        printQRInTerminal: false,
        auth: state,
        browser: baileys.Browsers.ubuntu("Chrome"),
        syncFullHistory: false
      });

      tempSock.ev.on("creds.update", saveCreds);
      let responded = false;

      tempSock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "connecting" && !responded) {
          setTimeout(async () => {
            try {
              const code = await tempSock.requestPairingCode(phoneNumber);
              const formatted = code.match(/.{1,4}/g)?.join("-") || code;
              responded = true;
              if (!res.headersSent) res.json({ success: true, phoneNumber, code: formatted });
            } catch (err) {
              if (!responded) {
                responded = true;
                if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
                try {
                  tempSock.end(undefined);
                } catch (e) {}
              }
            }
          }, 3000);
        }

        if (connection === "open") {
          console.log(chalk.cyan(`🔗 [${phoneNumber}] Pairing complete, handing off to main socket...`));
          try {
            tempSock.ev.removeAllListeners();
            tempSock.end(undefined);
          } catch (e) {}
          setTimeout(() => startBot(phoneNumber), 2000);
        }

        if (connection === "close") {
          const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
          if (code === 515) {
            try {
              tempSock.ev.removeAllListeners();
              tempSock.end(undefined);
            } catch (e) {}
            setTimeout(() => startBot(phoneNumber), 3000);
          } else if (!responded) {
            responded = true;
            if (!res.headersSent) res.status(500).json({ success: false, error: `Closed (${code})` });
            try {
              tempSock.end(undefined);
            } catch (e) {}
          }
        }
      });
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
    }
  });
});

app.post("/api/disconnect", async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    if (activeSockets.has(phoneNumber)) {
      await activeSockets.get(phoneNumber).logout();
      activeSockets.delete(phoneNumber);
    }
    await deleteSession(phoneNumber);
    settingsCache.delete(phoneNumber);
    res.json({ success: true, message: "Bot disconnected and removed from database." });
  } catch (err) {
    res.json({ success: true, message: "Session deleted." });
  }
});

app.get("/api/settings", async (req, res) => {
  const { phoneNumber } = req.query;
  const settings = await loadGlobalSettings(phoneNumber);
  res.json(settings);
});

app.post("/api/settings", async (req, res) => {
  const { phoneNumber, settings } = req.body;
  await saveSessionSettings(phoneNumber, settings);
  settingsCache.set(phoneNumber, { ...DEFAULT_SETTINGS, ...settings });
  res.json({ success: true });
});

(async () => {
  console.log("🚀 Starting Alpha Bot Server (PostgreSQL Mode)...");
  const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🌐 Internal API running on port ${PORT}`);
    try {
      const ngrok = require("@ngrok/ngrok");
      const listener = await ngrok.forward({
        addr: PORT,
        authtoken: NGROK_AUTHTOKEN,
        domain: NGROK_DOMAIN
      });
      console.log(`🔗 Ngrok Tunnel Active: ${listener.url()}`);
    } catch (err) {
      console.log(`❌ NGROK ERROR: ${err.message}`);
    }

    // 🎯 AUTO-CONNECT ALL SAVED SESSIONS FROM POSTGRESQL ON SERVER STARTUP
    try {
      const pruned = await cleanupOldSignalKeys();
      if (pruned > 0) console.log(chalk.cyan(`🧹 [DB CLEANUP] Pruned ${pruned} stale Signal keys.`));

      const savedSessions = await getAllSavedSessions();
      console.log(`🐘 Found ${savedSessions.length} PostgreSQL session(s): ${savedSessions.join(", ") || "None"}`);
      for (let i = 0; i < savedSessions.length; i++) {
        setTimeout(() => startBot(savedSessions[i]), i * 1500);
      }
    } catch (err) {
      console.log(chalk.red(`❌ PostgreSQL Startup Error: ${err.message}`));
    }

    setInterval(() => {
      require("http")
        .get(`http://127.0.0.1:${PORT}/api/stats`, () => {})
        .on("error", () => {});
    }, 10 * 60 * 1000);

    setInterval(() => {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`📊 Memory Usage: ${Math.round(used * 100) / 100} MB`);
      if (used > 450) {
        console.log(`⚠️ Memory limit reached. Restarting to prevent crash...`);
        process.exit(1);
      }
    }, 60000);
  });
})();
