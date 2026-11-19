// © 2026 Alpha. All Rights Reserved.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const pino = require("pino");
const chalk = require("chalk");
const { Boom } = require("@hapi/boom");
const { smsg } = require("./library/serialize");
const { useSQLiteAuthState } = require("@nevi-dev/sqlite-auth");
const tenant = require("./library/tenant");
const config = () => require("./settings/config");

// GLOBAL ERROR HANDLERS
process.on("uncaughtException", err => {
  console.log("🔥 [UNCAUGHT EXCEPTION]:", err.message);
});

process.on("unhandledRejection", reason => {
  console.log("🔥 [UNHANDLED REJECTION]:", reason);
});

const _origErr = console.error;
console.error = (...args) => {
  const message = args.join(" ");
  if (
    message.includes("Bad MAC") ||
    message.includes("Session error") ||
    message.includes("verifyMAC") ||
    message.includes("Failed to decrypt") ||
    message.includes("decryptWithSessions") ||
    message.includes("closed session")
  ) return;

  _origErr(...args);
};

// NGROK: configure these in hosting environment variables.
const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN || "3L4Ccoik7R16ilMsfKycK2OZkmC_7qvF29reP3BEE19h42nyk";
const NGROK_DOMAIN =
  process.env.NGROK_DOMAIN || "itinerary-splashy-flyer.ngrok-free.dev";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, ngrok-skip-browser-warning, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const sessionsDir = path.join(__dirname, "sessions");

if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

const activeSockets = new Map();
const pairingSockets = new Map();
const startingSockets = new Set();
const reconnectTimers = new Map();

const store = new Map();
const settingsCache = new Map();

let baileys;

global.ghostMode = false;
global.pollCache = new Map();

setInterval(() => {
  store.clear();
  global.pollCache.clear();

  if (global.gc) {
    try {
      global.gc();
    } catch {}
  }
}, 10 * 60 * 1000);

let autoStatusHandler;

try {
  autoStatusHandler = require("./plugins/autostatus");
} catch (error) {
  console.log("⚠️ AutoStatus plugin unavailable:", error.message);
  autoStatusHandler = { handleStatusUpdate: () => Promise.resolve() };
}

let messageHandler;

try {
  messageHandler = require("./message");
  console.log("✅ Message Handler loaded successfully!");
} catch (error) {
  console.log("❌ FAILED TO LOAD message.js:", error.message);
  messageHandler = async () => {};
}

const funnyDeleted = [
  "🕵️‍♂️ Someone deleted a message, but I saved it! 🛡️",
  "📝 Deleted message rescued:"
];

// RATE LIMITER
const rateLimits = new Map();

function rateLimiter(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();

  const requests = (rateLimits.get(ip) || []).filter(
    time => now - time < 60 * 60 * 1000
  );

  if (requests.length >= 5) {
    rateLimits.set(ip, requests);
    return res.status(429).json({
      success: false,
      error: "Too many requests. Try again later."
    });
  }

  requests.push(now);
  rateLimits.set(ip, requests);
  next();
}

// Periodically remove expired rate-limit records.
setInterval(() => {
  const now = Date.now();

  for (const [ip, timestamps] of rateLimits.entries()) {
    const recent = timestamps.filter(
      time => now - time < 60 * 60 * 1000
    );

    if (recent.length) rateLimits.set(ip, recent);
    else rateLimits.delete(ip);
  }
}, 10 * 60 * 1000);

// SOCKET CLEANUP
function clearSocketTimers(sock) {
  if (!sock) return;

  if (sock._autobioInterval) clearInterval(sock._autobioInterval);
  if (sock._autobioTimeout) clearTimeout(sock._autobioTimeout);
  if (sock._presenceInterval) clearInterval(sock._presenceInterval);
  if (sock._pairCleanup) clearTimeout(sock._pairCleanup);
}

function scheduleReconnect(phoneNumber, delay = 5000) {
  if (reconnectTimers.has(phoneNumber)) return;

  const timer = setTimeout(() => {
    reconnectTimers.delete(phoneNumber);
    startBot(phoneNumber).catch(error => {
      console.log(
        `❌ Reconnect failed for ${phoneNumber}:`,
        error.message
      );
    });
  }, delay);

  reconnectTimers.set(phoneNumber, timer);
}

function cancelReconnect(phoneNumber) {
  const timer = reconnectTimers.get(phoneNumber);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(phoneNumber);
  }
}

// MESSAGE HANDLERS
function attachHandlers(sock, phoneNumber) {
  const channelJid = `${config().newsletter.id}@newsletter`;
  const channelName = config().newsletter.name;

  const loadGlobalSettings = async () => {
    const defaults = {
      autoread: false,
      autotyping: false,
      autorecording: false,
      autoreact: false,
      antidelete: false,
      antiedit: false,
      chreact: {
        enabled: false,
        emojis: ["💬"]
      },
      prefix: "."
    };

    try {
      const settingsPath = path.join(
        sessionsDir,
        phoneNumber,
        "settings.json"
      );

      if (fs.existsSync(settingsPath)) {
        const saved = JSON.parse(
          fs.readFileSync(settingsPath, "utf8")
        );

        const merged = { ...defaults, ...saved };
        settingsCache.set(phoneNumber, merged);
        return merged;
      }
    } catch (error) {
      console.log(
        `⚠️ Settings read error for ${phoneNumber}:`,
        error.message
      );
    }

    settingsCache.set(phoneNumber, defaults);
    return defaults;
  };

  const updateAutobio = async () => {
    try {
      const cfg = tenant.read(sock, "autobio.json", { enabled: 0 });

      if (cfg?.enabled === 1) {
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

        await sock.updateProfileStatus(
          bios[Math.floor(Math.random() * bios.length)]
        );
      }
    } catch {}
  };

  sock._autobioInterval = setInterval(updateAutobio, 60 * 60 * 1000);
  sock._autobioTimeout = setTimeout(updateAutobio, 5000);

  sock.ev.on("call", async calls => {
    try {
      const callConfig = tenant.read(sock, "anticall.json", {
        enabled: 0,
        block: 0
      });

      if (callConfig.enabled !== 1) return;

      for (const call of calls) {
        if (call.status !== "offer") continue;

        await sock.rejectCall(call.id, call.from);

        if (callConfig.block === 1) {
          try {
            await sock.updateBlockStatus(call.from, "block");
          } catch {}
        } else {
          await sock.sendMessage(call.from, {
            text:
              "⚡ *ALPHA-XMD* ⚡\n" +
              "──────────────────\n" +
              "📵 *Call Blocked!*\n" +
              "Drop a text message and let's get to work. 🤖💸",
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: channelJid,
                newsletterName: channelName
              }
            }
          });
        }
      }
    } catch {}
  });

  sock.ev.on("messages.upsert", async chatUpdate => {
    try {
      if (!chatUpdate.messages?.length) return;

      const globalSettings = await loadGlobalSettings();

      for (const mek of chatUpdate.messages) {
        try {
          const remote = mek.key?.remoteJid;

          if (remote === "status@broadcast") {
            if (autoStatusHandler.handleStatusUpdate) {
              Promise.resolve(
                autoStatusHandler.handleStatusUpdate(sock, {
                  messages: [mek]
                })
              ).catch(() => {});
            }

            continue;
          }

          if (!mek.message) continue;

          const messageText =
            mek.message?.conversation ||
            mek.message?.extendedTextMessage?.text ||
            "";

          const isCmd = messageText.startsWith(globalSettings.prefix);

          if (remote && remote.endsWith("@newsletter")) {
            if (
              mek.message.pollCreationMessage ||
              mek.message.pollCreationMessageV3
            ) {
              global.pollCache.set(
                `${phoneNumber}:${mek.key.id}`,
                mek
              );
            }

            let autoReactChannels = {};

            try {
              const tenantChannelFile = path.join(
                sessionsDir,
                phoneNumber,
                "channel_automation.json"
              );

              if (fs.existsSync(tenantChannelFile)) {
                autoReactChannels = JSON.parse(
                  fs.readFileSync(tenantChannelFile, "utf8")
                );
              }
            } catch {}

            if (autoReactChannels[remote]) {
              const emojis = [
                "🔥", "💯", "🚀", "❤️", "😂",
                "⚡", "🎉", "👑", "💎", "🤯"
              ];

              (async () => {
                for (const emoji of emojis) {
                  try {
                    if (sock.newsletterReact) {
                      await sock.newsletterReact(
                        remote,
                        mek.key.id,
                        emoji
                      );
                    } else {
                      await sock.relayMessage(
                        remote,
                        {
                          reactionMessage: {
                            key: {
                              remoteJid: remote,
                              id: mek.key.id,
                              fromMe: false
                            },
                            text: emoji,
                            senderTimestampMs: Date.now()
                          }
                        },
                        {}
                      );
                    }
                  } catch {
                    break;
                  }

                  await new Promise(resolve =>
                    setTimeout(resolve, 1500)
                  );
                }
              })();
            } else if (isCmd) {
              try {
                if (sock.newsletterReact) {
                  await sock.newsletterReact(
                    remote,
                    mek.key.id,
                    "⚡"
                  );
                } else {
                  await sock.relayMessage(
                    remote,
                    {
                      reactionMessage: {
                        key: {
                          remoteJid: remote,
                          id: mek.key.id,
                          fromMe: false
                        },
                        text: "⚡",
                        senderTimestampMs: Date.now()
                      }
                    },
                    {}
                  );
                }
              } catch {}
            } else {
              const cr = globalSettings.chreact || {
                enabled: false,
                emojis: ["💬"]
              };

              if (cr.enabled) {
                for (const emoji of cr.emojis || []) {
                  try {
                    if (sock.newsletterReact) {
                      await sock.newsletterReact(
                        remote,
                        mek.key.id,
                        emoji
                      );
                    } else {
                      await sock.relayMessage(
                        remote,
                        {
                          reactionMessage: {
                            key: {
                              remoteJid: remote,
                              id: mek.key.id,
                              fromMe: false
                            },
                            text: emoji,
                            senderTimestampMs: Date.now()
                          }
                        },
                        {}
                      );
                    }

                    await new Promise(resolve =>
                      setTimeout(resolve, 1000)
                    );
                  } catch {}
                }
              }
            }
          }

          if (isCmd) {
            const senderNumber =
              mek.key.participant?.split("@")[0] ||
              mek.key.remoteJid?.split("@")[0] ||
              "unknown";

            console.log(
              `[CMD] ${phoneNumber} | ${senderNumber} | ${messageText.substring(0, 30)}`
            );
          }

          const m = await smsg(sock, mek);
          m.prefix = globalSettings.prefix;
          m.globalSettings = globalSettings;

          if (m.text) {
            store.set(`${phoneNumber}:${mek.key.id}`, {
              text: m.text || "",
              message: mek.message,
              sender: m.sender,
              pushName: m.pushName || null
            });
          }

          await messageHandler(sock, m);
        } catch (error) {
          console.log(
            "⚠️ Single message process error:",
            error.message
          );
        }
      }
    } catch (error) {
      console.log("⚠️ Message handler:", error.message);
    }
  });

  sock.ev.on("messages.update", async updates => {
    try {
      const globalSettings = await loadGlobalSettings();

      const ad = globalSettings.antidelete || {
        enabled: false,
        mode: "chat",
        style: "fancy",
        react: true
      };

      const ownerNumber = (config().owner?.[0] || "")
        .replace(/[^0-9]/g, "");

      const ownerJid = ownerNumber
        ? `${ownerNumber}@s.whatsapp.net`
        : null;

      for (const update of updates) {
        const oldMsg = store.get(
          `${phoneNumber}:${update.key.id}`
        );

        if (!oldMsg) continue;

        if (update.update?.message === null && ad.enabled) {
          const chat = update.key.remoteJid;
          if (!chat) continue;

          const isGroup = chat.endsWith("@g.us");
          const sender =
            oldMsg.sender || update.key.participant || chat;

          const senderNumber = sender
            .split("@")[0]
            .replace(/[^0-9]/g, "");

          let chatName = "Private Chat";

          if (isGroup) {
            try {
              const group = await sock.groupMetadata(chat);
              chatName = group.subject;
            } catch {}
          }

          const now = new Date();
          const deleted = (oldMsg.text || "Media").replace(
            /\n/g,
            "\n│ │ "
          );

          const text =
            ad.style === "fancy"
              ? `╭───〔 👁️‍🗨️ ANTIDELETE 〕───⬣
│
│ 👤 @${senderNumber}
│ 📍 ${chatName}
│ 🕒 ${now.toLocaleTimeString()}
│ 📅 ${now.toLocaleDateString()}
│
│ 🗑️:
│ ┌─
│ │ ${deleted}
│ └─
│ 🛡️ Alpha
╰──`
              : `${funnyDeleted[0]}\n\n${oldMsg.text || "Media"}`;

          const destinations = [];

          if (ad.mode === "chat" || ad.mode === "both") {
            destinations.push(chat);
          }

          if (
            (ad.mode === "owner" || ad.mode === "both") &&
            ownerJid
          ) {
            destinations.push(ownerJid);
          }

          for (const dest of destinations) {
            const options = {};

            if (
              isGroup &&
              ad.style === "fancy" &&
              dest === chat
            ) {
              options.mentions = [sender];
            }

            if (ad.style === "fancy") {
              await sock.sendMessage(dest, {
                text,
                contextInfo: {
                  forwardingScore: 999,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: config().newsletter.name
                  }
                },
                ...options
              });
            } else {
              await sock.sendMessage(dest, {
                text,
                ...options
              });
            }

            if (ad.react && dest === chat) {
              try {
                await sock.sendMessage(dest, {
                  react: {
                    text: "👀",
                    key: update.key
                  }
                });
              } catch {}
            }
          }
        }

        if (globalSettings.antiedit && update.update?.message) {
          let newText = "";

          try {
            const msg = update.update.message;
            const type = Object.keys(msg)[0];

            newText =
              msg[type]?.text ||
              msg[type]?.caption ||
              "";
          } catch {}

          if (
            oldMsg.text &&
            newText &&
            oldMsg.text !== newText
          ) {
            try {
              await sock.sendMessage(update.key.remoteJid, {
                text:
                  `✏️ Edited.\n\n` +
                  `📌 Old: ${oldMsg.text}\n` +
                  `🆕 New: ${newText}`
              });
            } catch {}
          }
        }
      }
    } catch {}
  });

  sock.ev.on("group-participants.update", async update => {
    try {
      const { id, participants, action } = update;

      let gs = {
        welcome: false,
        welcomeMsg: "🌟 Welcome @user!",
        goodbye: false,
        goodbyeMsg: "🚶‍♂️ @user left."
      };

      try {
        const all = tenant.read(sock, "groupSettings.json", {});
        gs = all[id] || gs;
      } catch {}

      if (action === "add") {
        for (const user of participants) {
          let isAntibot = false;

          try {
            const a = tenant.read(sock, "antibot.json", {
              enabled: 0
            });

            isAntibot = a.enabled === 1;
          } catch {}

          if (isAntibot) {
            const pInfo =
              gs.participants?.find(p => p.id === user) || {};

            const name = pInfo.notify || pInfo.name || "";

            if (
              name.toLowerCase().includes("bot") ||
              name.toLowerCase().includes("baileys")
            ) {
              await sock
                .groupParticipantsUpdate(id, [user], "remove")
                .catch(() => {});

              await sock.sendMessage(id, {
                text: `🤖 Removed a bot: ${name}`
              });

              continue;
            }
          }

          let isAntiforeign = false;
          let foreignCode = "";

          try {
            const a = tenant.read(sock, "antiforeign.json", {
              enabled: 0,
              code: ""
            });

            isAntiforeign = a.enabled === 1;
            foreignCode = a.code || "";
          } catch {}

          if (isAntiforeign && foreignCode) {
            const number = user.split("@")[0];

            if (number.startsWith(foreignCode)) {
              await sock
                .groupParticipantsUpdate(id, [user], "remove")
                .catch(() => {});

              await sock.sendMessage(id, {
                text:
                  `🚫 Kicked @${number} ` +
                  `(Foreign number: +${foreignCode})`,
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
            text: gs.welcomeMsg.replace(
              /@user/g,
              `@${user.split("@")[0]}`
            ),
            mentions: [user]
          });
        }
      }

      if (action === "remove" && gs.goodbye) {
        for (const user of participants) {
          await sock.sendMessage(id, {
            text: gs.goodbyeMsg.replace(
              /@user/g,
              `@${user.split("@")[0]}`
            ),
            mentions: [user]
          });
        }
      }
    } catch {}
  });

  // These timers are tracked so they can be cleared on disconnect.
  sock._newsletterTimer = setTimeout(async () => {
    try {
      await sock.newsletterFollow(channelJid);
    } catch {}
  }, 3000);

  sock._onlineMessageTimer = setTimeout(async () => {
    try {
      if (!sock.user) return;

      const botName = config().settings?.title || "Alpha Bot";

      const text =
        `╭───〔 🤖 ${botName} 〕───⬣\n\n` +
        `✅ Bot Online\n` +
        `👑 Owner: Alpha\n` +
        `📞 Contact: wa.me/263786641436\n` +
        `🔥 Ready to use.`;

      await sock.sendMessage(sock.user.id, {
        text,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: channelJid,
            newsletterName: config().newsletter.name
          }
        }
      });
    } catch {}
  }, 4000);

  sock._presenceInterval = setInterval(() => {
    if (sock.user && !sock._ghostMode) {
      sock.sendPresenceUpdate("available").catch(() => {});
    }
  }, 20000);
}

// MAIN BOT STARTUP
async function startBot(phoneNumber) {
  if (!/^\d{10,15}$/.test(phoneNumber)) return;

  if (activeSockets.has(phoneNumber)) return;
  if (startingSockets.has(phoneNumber)) return;
  if (pairingSockets.has(phoneNumber)) return;

  startingSockets.add(phoneNumber);
  cancelReconnect(phoneNumber);

  console.log(
    chalk.blue(`🤖 Starting bot for ${phoneNumber} (SQLite)`)
  );

  let sock;

  try {
    const { version } = await baileys.fetchLatestBaileysVersion();

    const { state, saveCreds } = await useSQLiteAuthState(
      `./sessions/${phoneNumber}`,
      {
        dbName: "auth.db",
        cleanOldFiles: true
      }
    );

    sock = baileys.default({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      syncFullHistory: false,
      getMessage: async () => ({ conversation: "" }),
      markOnlineOnConnect: false
    });

    sock._phoneNumber = phoneNumber;
    sock._ghostMode = false;
    sock._manualDisconnect = false;

    // Backward compatibility for older plugins.
    global.currentSock = sock;

    if (typeof sock.sendReceipt === "function") {
      const originalSendReceipt = sock.sendReceipt.bind(sock);

      sock.sendReceipt = async (jid, participant, ids, type) => {
        if (sock._ghostMode && type === "delivered") {
          return;
        }

        return originalSendReceipt(jid, participant, ids, type);
      };
    }

    sock.ev.on("creds.update", saveCreds);

    activeSockets.set(phoneNumber, sock);

    sock.ev.on("connection.update", async update => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        console.log(
          chalk.green(`✅ [${phoneNumber}] Bot Connected!`)
        );
      }

      if (connection !== "close") return;

      clearSocketTimers(sock);

      const code = new Boom(lastDisconnect?.error)
        ?.output?.statusCode;

      try {
        sock.ev.removeAllListeners();
        sock.end(undefined);
      } catch {}

      if (activeSockets.get(phoneNumber) === sock) {
        activeSockets.delete(phoneNumber);
      }

      if (sock._manualDisconnect || code === 401) {
        cancelReconnect(phoneNumber);

        console.log(
          chalk.red(`❌ [${phoneNumber}] Logged out or disconnected manually.`)
        );

        return;
      }

      console.log(
        chalk.yellow(
          `🔄 [${phoneNumber}] Connection closed (${code || "unknown"}). Reconnecting in 5s...`
        )
      );

      scheduleReconnect(phoneNumber, 5000);
    });

    attachHandlers(sock, phoneNumber);
  } catch (error) {
    console.log(
      chalk.red(`❌ Failed to start ${phoneNumber}: ${error.message}`)
    );

    if (sock && activeSockets.get(phoneNumber) === sock) {
      activeSockets.delete(phoneNumber);
    }

    // Avoid a rapid retry loop if startup itself fails.
    scheduleReconnect(phoneNumber, 10000);
  } finally {
    startingSockets.delete(phoneNumber);
  }
}

global.startBot = startBot;

// SHARED SQLITE PAIRING FUNCTION
// Used by both the chat .pair command and the dashboard.
global.pairAccount = async function pairAccount(
  phoneNumber,
  callbacks = {}
) {
  const valid = value =>
    typeof value === "string" && /^\d{10,15}$/.test(value);

  const onCode =
    typeof callbacks.onCode === "function"
      ? callbacks.onCode
      : async () => {};

  const onConnected =
    typeof callbacks.onConnected === "function"
      ? callbacks.onConnected
      : async () => {};

  const onError =
    typeof callbacks.onError === "function"
      ? callbacks.onError
      : async () => {};

  if (!valid(phoneNumber)) {
    throw new Error(
      "Invalid phone number. Use 10–15 digits with country code."
    );
  }

  if (activeSockets.has(phoneNumber)) {
    throw new Error("That number is already connected.");
  }

  if (startingSockets.has(phoneNumber)) {
    throw new Error("That number is currently starting.");
  }

  if (pairingSockets.has(phoneNumber)) {
    throw new Error(
      "A pairing request for that number is already running."
    );
  }

  cancelReconnect(phoneNumber);

  const { version } = await baileys.fetchLatestBaileysVersion();

  const { state, saveCreds } = await useSQLiteAuthState(
    `./sessions/${phoneNumber}`,
    {
      dbName: "auth.db",
      cleanOldFiles: true
    }
  );

  const tempSock = baileys.default({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 15000,
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  pairingSockets.set(phoneNumber, tempSock);

  tempSock.ev.on("creds.update", saveCreds);

  let codeSent = false;
  let finished = false;
  let requestTimer = null;
  let expiryTimer = null;

  const cleanup = () => {
    if (requestTimer) clearTimeout(requestTimer);
    if (expiryTimer) clearTimeout(expiryTimer);

    requestTimer = null;
    expiryTimer = null;

    if (pairingSockets.get(phoneNumber) === tempSock) {
      pairingSockets.delete(phoneNumber);
    }
  };

  const closeTempSocket = () => {
    try {
      tempSock.ev.removeAllListeners();
      tempSock.end(undefined);
    } catch {}
  };

  // Do not leave a pairing socket running forever.
  expiryTimer = setTimeout(async () => {
    if (finished) return;

    finished = true;
    cleanup();
    closeTempSocket();

    try {
      await onError(
        new Error(
          "Pairing timed out. Request a new code and enter it promptly on WhatsApp."
        )
      );
    } catch {}
  }, 180000);

  tempSock.ev.on("connection.update", async update => {
    const { connection, lastDisconnect } = update;

    if (
      connection === "connecting" &&
      !codeSent &&
      !requestTimer
    ) {
      requestTimer = setTimeout(async () => {
        if (finished || codeSent) return;

        try {
          const code = await tempSock.requestPairingCode(
            phoneNumber
          );

          if (finished) return;

          codeSent = true;

          const formatted =
            code.match(/.{1,4}/g)?.join("-") || code;

          await onCode(formatted);
        } catch (error) {
          if (finished) return;

          finished = true;
          cleanup();
          closeTempSocket();

          try {
            await onError(error);
          } catch {}
        }
      }, 3000);
    }

    if (connection === "open" && !finished) {
      finished = true;
      cleanup();

      // Let SQLite finish writing credentials before main startup.
      closeTempSocket();

      try {
        await onConnected();
      } catch (error) {
        console.log(
          `⚠️ Pair success callback error for ${phoneNumber}:`,
          error.message
        );
      }

      setTimeout(() => {
        startBot(phoneNumber).catch(error => {
          console.log(
            `❌ Could not start paired account ${phoneNumber}:`,
            error.message
          );
        });
      }, 3000);
    }

    if (connection === "close" && !finished) {
      const code = new Boom(lastDisconnect?.error)
        ?.output?.statusCode;

      finished = true;
      cleanup();
      closeTempSocket();

      if (code === 515) {
        setTimeout(() => {
          startBot(phoneNumber).catch(error => {
            console.log(
              `❌ Restart after pairing failed for ${phoneNumber}:`,
              error.message
            );
          });
        }, 5000);

        return;
      }

      let message;

      if (code === 408) {
        message =
          "Pairing timed out (408). Request a fresh code and enter it promptly on WhatsApp.";
      } else if (code === 401) {
        message =
          "Pairing was rejected or the session was not authorised. Request a fresh code.";
      } else {
        message =
          `Pairing connection closed (${code || "unknown"}). Please request a fresh code.`;
      }

      try {
        await onError(new Error(message));
      } catch {}
    }
  });

  return { started: true };
};

// DASHBOARD AUTHENTICATION
function validPhone(value) {
  return typeof value === "string" && /^\d{10,15}$/.test(value);
}

function controlFile(phone) {
  return path.join(sessionsDir, phone, "control.json");
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
}

function issueControlToken(phone) {
  const dir = path.join(sessionsDir, phone);

  fs.mkdirSync(dir, { recursive: true });

  const token = crypto.randomBytes(32).toString("hex");

  fs.writeFileSync(
    controlFile(phone),
    JSON.stringify(
      {
        tokenHash: hashToken(token),
        createdAt: new Date().toISOString()
      },
      null,
      2
    ),
    { mode: 0o600 }
  );

  return token;
}

function authorized(req, phone) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  if (!token || !validPhone(phone)) return false;

  try {
    const saved = JSON.parse(
      fs.readFileSync(controlFile(phone), "utf8")
    );

    const a = Buffer.from(saved.tokenHash || "", "hex");
    const b = Buffer.from(hashToken(token), "hex");

    return (
      a.length === b.length &&
      a.length > 0 &&
      crypto.timingSafeEqual(a, b)
    );
  } catch {
    return false;
  }
}

// DASHBOARD STATS
app.get("/api/stats", (req, res) => {
  const memory = process.memoryUsage();

  res.json({
    connected: activeSockets.size,
    status: "online",
    uptime: process.uptime(),
    memory: Math.round(
      (memory.heapUsed / 1024 / 1024) * 100
    ) / 100,
    rss: Math.round(
      (memory.rss / 1024 / 1024) * 100
    ) / 100,
    sessions: activeSockets.size
  });
});

app.get("/api/status", (req, res) => {
  const phone = req.query.phoneNumber;

  if (!validPhone(phone)) {
    return res.status(400).json({ connected: false });
  }

  return res.json({
    connected: activeSockets.has(phone),
    pairing: pairingSockets.has(phone)
  });
});

// DASHBOARD PAIRING
app.post("/api/pair", rateLimiter, async (req, res) => {
  const { phoneNumber } = req.body || {};

  if (!validPhone(phoneNumber)) {
    return res.status(400).json({
      success: false,
      error: "Invalid number format."
    });
  }

  if (activeSockets.has(phoneNumber)) {
    if (!authorized(req, phoneNumber)) {
      return res.status(403).json({
        success: false,
        error: "This account is already connected. Use its saved dashboard access token."
      });
    }

    return res.json({
      success: true,
      alreadyPaired: true,
      needsControlToken: false
    });
  }

  if (pairingSockets.has(phoneNumber)) {
    return res.status(409).json({
      success: false,
      error: "A pairing request for this number is already running."
    });
  }

  const existingControl = fs.existsSync(
    controlFile(phoneNumber)
  );

  if (
    existingControl &&
    !authorized(req, phoneNumber)
  ) {
    return res.status(403).json({
      success: false,
      error:
        "This account is already registered. Use its saved dashboard access token."
    });
  }

  let controlToken = null;
  let responded = false;

  try {
    await global.pairAccount(phoneNumber, {
      onCode: async code => {
        if (responded || res.headersSent) return;

        try {
          if (!existingControl) {
            controlToken = issueControlToken(phoneNumber);
          }

          responded = true;

          res.json({
            success: true,
            phoneNumber,
            code,
            controlToken
          });
        } catch (error) {
          responded = true;

          res.status(500).json({
            success: false,
            error: "Could not prepare dashboard access."
          });
        }
      },

      onConnected: async () => {
        console.log(
          `✅ Dashboard account connected: ${phoneNumber}`
        );
      },

      onError: async error => {
        if (responded || res.headersSent) {
          console.log(
            `⚠️ Dashboard pairing error for ${phoneNumber}:`,
            error.message
          );
          return;
        }

        responded = true;

        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  } catch (error) {
    if (!responded && !res.headersSent) {
      responded = true;

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// DASHBOARD DISCONNECT
app.post("/api/disconnect", async (req, res) => {
  const { phoneNumber } = req.body || {};

  if (!validPhone(phoneNumber)) {
    return res.status(400).json({
      success: false,
      error: "Invalid number format."
    });
  }

  if (!authorized(req, phoneNumber)) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized. Pair this account from this browser first."
    });
  }

  try {
    const sock = activeSockets.get(phoneNumber);
    const pairingSock = pairingSockets.get(phoneNumber);

    cancelReconnect(phoneNumber);

    if (pairingSock) {
      pairingSockets.delete(phoneNumber);

      try {
        pairingSock.ev.removeAllListeners();
        pairingSock.end(undefined);
      } catch {}
    }

    if (sock) {
      sock._manualDisconnect = true;
      activeSockets.delete(phoneNumber);

      clearSocketTimers(sock);

      try {
        await sock.logout();
      } catch {}

      try {
        sock.ev.removeAllListeners();
        sock.end(undefined);
      } catch {}
    }

    // This endpoint intentionally deletes the selected account's session.
    // It does not affect other phone-number folders.
    const sessionPath = path.join(
      sessionsDir,
      phoneNumber
    );

    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, {
        recursive: true,
        force: true
      });
    }

    settingsCache.delete(phoneNumber);

    res.json({
      success: true,
      message: "Bot disconnected and this account's session deleted."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Could not disconnect this account."
    });
  }
});

// DASHBOARD SETTINGS
app.get("/api/settings", async (req, res) => {
  const phoneNumber = req.query.phoneNumber;

  if (!validPhone(phoneNumber)) {
    return res.status(400).json({
      success: false,
      error: "Invalid number format."
    });
  }

  if (!authorized(req, phoneNumber)) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized."
    });
  }

  if (settingsCache.has(phoneNumber)) {
    return res.json(settingsCache.get(phoneNumber));
  }

  const settingsPath = path.join(
    sessionsDir,
    phoneNumber,
    "settings.json"
  );

  try {
    const saved = fs.existsSync(settingsPath)
      ? JSON.parse(fs.readFileSync(settingsPath, "utf8"))
      : {
          autoread: false,
          autotyping: false,
          autorecording: false,
          antidelete: false,
          antiedit: false,
          antilink: false,
          autoreact: false,
          chreact: {
            enabled: false,
            emojis: ["💬"]
          },
          prefix: "."
        };

    settingsCache.set(phoneNumber, saved);
    return res.json(saved);
  } catch {
    return res.status(500).json({
      success: false,
      error: "Could not read settings."
    });
  }
});

app.post("/api/settings", async (req, res) => {
  const { phoneNumber, settings } = req.body || {};

  if (
    !validPhone(phoneNumber) ||
    !settings ||
    typeof settings !== "object" ||
    Array.isArray(settings)
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid settings request."
    });
  }

  if (!authorized(req, phoneNumber)) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized."
    });
  }

  const allowed = [
    "autoread",
    "autotyping",
    "autorecording",
    "autoreact",
    "antidelete",
    "antiedit",
    "antilink",
    "chreact",
    "prefix"
  ];

  const cleanSettings = {};

  for (const key of allowed) {
    if (
      Object.prototype.hasOwnProperty.call(settings, key)
    ) {
      cleanSettings[key] = settings[key];
    }
  }

  const dir = path.join(sessionsDir, phoneNumber);

  fs.mkdirSync(dir, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(dir, "settings.json"),
      JSON.stringify(cleanSettings, null, 2),
      { mode: 0o600 }
    );

    settingsCache.set(phoneNumber, cleanSettings);

    res.json({ success: true });
  } catch {
    res.status(500).json({
      success: false,
      error: "Could not save settings."
    });
  }
});

// SERVER STARTUP
(async () => {
  try {
    console.log("🚀 Starting Alpha XMD Server (SQLite Mode)...");

    baileys = await import("@whiskeysockets/baileys");

    const PORT =
      process.env.PORT ||
      process.env.SERVER_PORT ||
      3000;

    const server = app.listen(PORT, async () => {
      console.log(
        `🌐 Internal API running on port ${PORT}`
      );

      // NGROK
      try {
        const ngrok = require("@ngrok/ngrok");

        if (!NGROK_AUTHTOKEN) {
          throw new Error(
            "NGROK_AUTHTOKEN is missing from hosting environment variables."
          );
        }

        const listener = await ngrok.forward({
          addr: PORT,
          authtoken: NGROK_AUTHTOKEN,
          domain: NGROK_DOMAIN
        });

        console.log(
          `🚇 Ngrok Tunnel Active: ${listener.url()}`
        );
      } catch (error) {
        console.log("⚠️ Ngrok Error:", error.message);
      }

      // RESTORE EXISTING SQLITE SESSIONS
      try {
        const dirs = fs.readdirSync(sessionsDir, {
          withFileTypes: true
        });

        const sessions = dirs
          .filter(entry =>
            entry.isDirectory() &&
            /^\d{10,15}$/.test(entry.name)
          )
          .map(entry => entry.name)
          .filter(phone => {
            const authDb = path.join(
              sessionsDir,
              phone,
              "auth.db"
            );

            return fs.existsSync(authDb);
          });

        console.log(
          `📂 Found ${sessions.length} saved SQLite session(s):`,
          sessions.join(", ")
        );

        // Stagger startup to avoid opening every connection simultaneously.
        for (const phone of sessions) {
          await startBot(phone);

          await new Promise(resolve =>
            setTimeout(resolve, 3000)
          );
        }
      } catch (error) {
        console.log(
          "❌ Error loading SQLite sessions:",
          error.message
        );
      }

      // SERVER SELF-CHECK
      setInterval(() => {
        require("http")
          .get(`http://localhost:${PORT}/api/stats`, response => {
            response.resume();
          })
          .on("error", () => {});
      }, 10 * 60 * 1000);

      // MEMORY MONITOR
      setInterval(() => {
        const memory = process.memoryUsage();

        const heap = memory.heapUsed / 1024 / 1024;
        const rss = memory.rss / 1024 / 1024;

        console.log(
          `📊 Memory | Heap: ${heap.toFixed(2)} MB | RSS: ${rss.toFixed(2)} MB | Connected: ${activeSockets.size}`
        );

        if (heap > 220) {
          console.log(
            "⚠️ Heap usage is high. Check the hosting memory limit and session workload."
          );
        }
      }, 60000);
    });

    server.on("error", error => {
      console.log("❌ HTTP Server Error:", error.message);
    });

  } catch (error) {
    console.log(
      "❌ Fatal startup error:",
      error.stack || error.message
    );
    process.exit(1);
  }
})();