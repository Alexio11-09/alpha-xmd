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

// ======================================================
// PROCESS DIAGNOSTICS
// ======================================================

process.on("uncaughtException", err => {
  console.error("🔥 [UNCAUGHT EXCEPTION]", err?.stack || err);
  process.exitCode = 1;
});

process.on("unhandledRejection", reason => {
  console.error("🔥 [UNHANDLED REJECTION]", reason?.stack || reason);
});

process.on("exit", code => {
  console.log(`🛑 Node process exiting. Exit code: ${code}`);
});

process.on("SIGTERM", () => {
  console.log("⚠️ Received SIGTERM from hosting panel.");
});

process.on("SIGINT", () => {
  console.log("⚠️ Received SIGINT.");
});

const originalConsoleError = console.error;

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

  originalConsoleError(...args);
};

// ======================================================
// NGROK CONFIGURATION
// ======================================================

const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN || "";
const NGROK_DOMAIN =
  process.env.NGROK_DOMAIN ||
  "itinerary-splashy-flyer.ngrok-free.dev";

// ======================================================
// EXPRESS SERVER
// ======================================================

const app = express();

app.use(express.json({ limit: "100kb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, ngrok-skip-browser-warning, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ======================================================
// SESSION MANAGEMENT
// ======================================================

const sessionsDir = path.join(__dirname, "sessions");

fs.mkdirSync(sessionsDir, { recursive: true });

const activeSockets = new Map();
const startingSockets = new Set();
const reconnectTimers = new Map();
const pairingSockets = new Map();

const store = new Map();
const settingsCache = new Map();

let baileys;

global.ghostMode = false;
global.pollCache = new Map();
global.currentSock = null;

// ======================================================
// MEMORY CLEANUP
// ======================================================

setInterval(() => {
  store.clear();
  global.pollCache.clear();

  if (global.gc) global.gc();
}, 10 * 60 * 1000);

// ======================================================
// HANDLER IMPORTS
// ======================================================

let autoStatusHandler;

try {
  autoStatusHandler = require("./plugins/autostatus");
} catch {
  autoStatusHandler = {
    handleStatusUpdate: () => Promise.resolve()
  };
}

let messageHandler;

try {
  messageHandler = require("./message");
  console.log("✅ Message Handler loaded successfully!");
} catch (err) {
  console.log("❌ FAILED TO LOAD message.js:", err.message);
  messageHandler = async () => {};
}

const funnyDeleted = [
  "🕵️‍♂️ Someone deleted a message, but I saved it! 🛡️",
  "📝 Deleted message rescued:"
];

// ======================================================
// COMMON HELPERS
// ======================================================

function validPhone(value) {
  return (
    typeof value === "string" &&
    /^\d{10,15}$/.test(value)
  );
}

function clearReconnectTimer(phoneNumber) {
  const timer = reconnectTimers.get(phoneNumber);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(phoneNumber);
  }
}

function scheduleReconnect(phoneNumber, delay = 5000) {
  if (
    reconnectTimers.has(phoneNumber) ||
    startingSockets.has(phoneNumber)
  ) return;

  const timer = setTimeout(() => {
    reconnectTimers.delete(phoneNumber);

    startBot(phoneNumber).catch(err => {
      console.error(
        `[${phoneNumber}] Reconnect error:`,
        err?.stack || err
      );
    });
  }, delay);

  reconnectTimers.set(phoneNumber, timer);
}

function formatUptime(seconds) {
  const total = Math.floor(Number(seconds) || 0);

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return [
    days ? `${days}d` : null,
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    `${secs}s`
  ].filter(Boolean).join(" ");
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ======================================================
// RATE LIMITER
// ======================================================

const rateLimits = new Map();

function rateLimiter(req, res, next) {
  const forwarded = String(
    req.headers["x-forwarded-for"] || ""
  ).split(",")[0].trim();

  const ip =
    forwarded ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();

  const requests = (
    rateLimits.get(ip) || []
  ).filter(time => now - time < 60 * 60 * 1000);

  if (requests.length >= 5) {
    rateLimits.set(ip, requests);

    return res.status(429).json({
      success: false,
      error: "Too many requests. Try again later."
    });
  }

  requests.push(now);
  rateLimits.set(ip, requests);

  if (rateLimits.size > 1000) {
    for (const [key, times] of rateLimits) {
      if (
        !times.length ||
        now - times[times.length - 1] >= 60 * 60 * 1000
      ) {
        rateLimits.delete(key);
      }
    }
  }

  next();
}

// ======================================================
// SOCKET HANDLERS
// ======================================================

function attachHandlers(sock, phoneNumber) {
  const channelJid = `${config().newsletter.id}@newsletter`;
  const channelName = config().newsletter.name;

  // ----------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------

  const loadGlobalSettings = async () => {
    const defaults = {
      autoread: false,
      autotyping: false,
      autorecording: false,
      autoreact: false,
      antidelete: false,
      antiedit: false,
      antilink: false,
      chreact: {
        enabled: false,
        emojis: ["💬"]
      },
      prefix: "."
    };

    if (settingsCache.has(phoneNumber)) {
      return settingsCache.get(phoneNumber);
    }

    let saved = {};

    try {
      const settingsPath = path.join(
        sessionsDir,
        phoneNumber,
        "settings.json"
      );

      if (fs.existsSync(settingsPath)) {
        saved = JSON.parse(
          fs.readFileSync(settingsPath, "utf8")
        );
      }
    } catch (err) {
      console.log(
        `[SETTINGS] Could not read ${phoneNumber}:`,
        err.message
      );
    }

    const merged = {
      ...defaults,
      ...(saved && typeof saved === "object" && !Array.isArray(saved)
        ? saved
        : {}),
      chreact: {
        ...defaults.chreact,
        ...(saved?.chreact && typeof saved.chreact === "object"
          ? saved.chreact
          : {})
      }
    };

    settingsCache.set(phoneNumber, merged);
    return merged;
  };

  // ----------------------------------------------------
  // AUTO BIO
  // ----------------------------------------------------

  const updateAutobio = async () => {
    try {
      const cfg = tenant.read(sock, "autobio.json", {
        enabled: 0
      });

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

  sock._autobioInterval = setInterval(
    updateAutobio,
    60 * 60 * 1000
  );

  sock._autobioTimeout = setTimeout(updateAutobio, 5000);

  // ----------------------------------------------------
  // ANTICALL
  // ----------------------------------------------------

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
          await sock.updateBlockStatus(
            call.from,
            "block"
          ).catch(() => {});
        } else {
          await sock.sendMessage(call.from, {
            text:
              `⚡ *ALPHA-XMD* ⚡\n` +
              `──────────────────\n` +
              `📵 *Call Blocked!*\n` +
              `Drop a text message and let's get to work. 🤖💸`,
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

  // ----------------------------------------------------
  // INCOMING MESSAGES
  // ----------------------------------------------------

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

          const isCmd = messageText.startsWith(
            globalSettings.prefix
          );

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
              const file = path.join(
                sessionsDir,
                phoneNumber,
                "channel_automation.json"
              );

              if (fs.existsSync(file)) {
                autoReactChannels = JSON.parse(
                  fs.readFileSync(file, "utf8")
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
                      await sock.relayMessage(remote, {
                        reactionMessage: {
                          key: {
                            remoteJid: remote,
                            id: mek.key.id,
                            fromMe: false
                          },
                          text: emoji,
                          senderTimestampMs: Date.now()
                        }
                      }, {});
                    }
                  } catch {
                    break;
                  }

                  await delay(1500);
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
                  await sock.relayMessage(remote, {
                    reactionMessage: {
                      key: {
                        remoteJid: remote,
                        id: mek.key.id,
                        fromMe: false
                      },
                      text: "⚡",
                      senderTimestampMs: Date.now()
                    }
                  }, {});
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
                      await sock.relayMessage(remote, {
                        reactionMessage: {
                          key: {
                            remoteJid: remote,
                            id: mek.key.id,
                            fromMe: false
                          },
                          text: emoji,
                          senderTimestampMs: Date.now()
                        }
                      }, {});
                    }

                    await delay(1000);
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

        } catch (err) {
          console.log(
            "⚠️ Single message process error:",
            err.message
          );
        }
      }
    } catch (err) {
      console.log("⚠️ Message handler:", err.message);
    }
  });

  // ----------------------------------------------------
  // ANTIDELETE / ANTIEDIT
  // ----------------------------------------------------

  sock.ev.on("messages.update", async updates => {
    try {
      const globalSettings = await loadGlobalSettings();
      const rawAntidelete = globalSettings.antidelete;

      const ad = rawAntidelete && typeof rawAntidelete === "object"
        ? {
            enabled: false,
            mode: "chat",
            style: "fancy",
            react: true,
            ...rawAntidelete
          }
        : {
            enabled: rawAntidelete === true,
            mode: "chat",
            style: "fancy",
            react: true
          };

      const ownerNumber = String(
        tenant.MAIN_OWNER || "263784969735"
      ).replace(/[^0-9]/g, "");

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
            oldMsg.sender ||
            update.key.participant ||
            chat;

          const senderNumber = sender
            .split("@")[0]
            .replace(/[^0-9]/g, "");

          let chatName = "Private Chat";

          if (isGroup) {
            try {
              const gm = await sock.groupMetadata(chat);
              chatName = gm.subject;
            } catch {}
          }

          const now = new Date();

          const deleted = (oldMsg.text || "Media")
            .replace(/\n/g, "\n│ │ ");

          const text = ad.style === "fancy"
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
            const opts = {};

            if (
              isGroup &&
              ad.style === "fancy" &&
              dest === chat
            ) {
              opts.mentions = [sender];
            }

            if (ad.style === "fancy") {
              await sock.sendMessage(dest, {
                text,
                contextInfo: {
                  forwardingScore: 999,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: channelName
                  }
                },
                ...opts
              });
            } else {
              await sock.sendMessage(dest, {
                text,
                ...opts
              });
            }

            if (ad.react && dest === chat) {
              await sock.sendMessage(dest, {
                react: {
                  text: "👀",
                  key: update.key
                }
              }).catch(() => {});
            }
          }
        }

        if (
          globalSettings.antiedit &&
          update.update?.message
        ) {
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
            await sock.sendMessage(
              update.key.remoteJid,
              {
                text:
                  `✏️ Edited.\n\n` +
                  `📌 Old: ${oldMsg.text}\n` +
                  `🆕 New: ${newText}`
              }
            ).catch(() => {});
          }
        }
      }
    } catch {}
  });

  // ----------------------------------------------------
  // GROUP PARTICIPANTS
  // ----------------------------------------------------

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
              await sock.groupParticipantsUpdate(
                id,
                [user],
                "remove"
              ).catch(() => {});

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
            const num = user.split("@")[0];

            if (num.startsWith(foreignCode)) {
              await sock.groupParticipantsUpdate(
                id,
                [user],
                "remove"
              ).catch(() => {});

              await sock.sendMessage(id, {
                text:
                  `🚫 Kicked @${num} ` +
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

  // ----------------------------------------------------
  // TIMED TASKS
  // ----------------------------------------------------

  sock._newsletterFollowTimeout = setTimeout(async () => {
    try {
      await sock.newsletterFollow(channelJid);
    } catch {}
  }, 3000);

  sock._onlineNoticeTimeout = setTimeout(async () => {
    try {
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
            newsletterName: channelName
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

// ======================================================
// START BOT
// ======================================================

async function startBot(phoneNumber) {
  if (!validPhone(phoneNumber)) return;

  if (
    activeSockets.has(phoneNumber) ||
    startingSockets.has(phoneNumber)
  ) {
    return;
  }

  startingSockets.add(phoneNumber);
  clearReconnectTimer(phoneNumber);

  console.log(
    chalk.blue(`🤖 Starting bot for ${phoneNumber} (SQLite)`)
  );

  try {
    fs.mkdirSync(
      path.join(sessionsDir, phoneNumber),
      { recursive: true }
    );

    const { version } =
      await baileys.fetchLatestBaileysVersion();

    const { state, saveCreds } =
      await useSQLiteAuthState(
        `./sessions/${phoneNumber}`,
        {
          dbName: "auth.db",
          cleanOldFiles: true
        }
      );

    if (activeSockets.has(phoneNumber)) return;

    const sock = baileys.default({
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
      getMessage: async () => ({
        conversation: ""
      }),
      markOnlineOnConnect: false
    });

    sock._phoneNumber = phoneNumber;
    sock._ghostMode = false;
    sock._manualDisconnect = false;

    global.currentSock = sock;

    const originalSendReceipt = sock.sendReceipt.bind(sock);

    sock.sendReceipt = async (jid, participant, ids, type) => {
      if (sock._ghostMode && type === "delivered") {
        return;
      }

      return originalSendReceipt(
        jid,
        participant,
        ids,
        type
      );
    };

    sock.ev.on("creds.update", saveCreds);

    activeSockets.set(phoneNumber, sock);

    sock.ev.on("connection.update", update => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        console.log(
          chalk.green(`✅ [${phoneNumber}] Bot Connected!`)
        );
      }

      if (connection !== "close" || sock._closedHandled) {
        return;
      }

      sock._closedHandled = true;

      if (sock._autobioInterval) {
        clearInterval(sock._autobioInterval);
      }

      if (sock._pairCleanup) {
        clearTimeout(sock._pairCleanup);
      }

      if (sock._presenceInterval) {
        clearInterval(sock._presenceInterval);
      }

      if (sock._autobioTimeout) {
        clearTimeout(sock._autobioTimeout);
      }

      if (sock._newsletterFollowTimeout) {
        clearTimeout(sock._newsletterFollowTimeout);
      }

      if (sock._onlineNoticeTimeout) {
        clearTimeout(sock._onlineNoticeTimeout);
      }

      if (activeSockets.get(phoneNumber) === sock) {
        activeSockets.delete(phoneNumber);
      }

      if (global.currentSock === sock) {
        global.currentSock =
          activeSockets.values().next().value || null;
      }

      const code = new Boom(lastDisconnect?.error)
        ?.output?.statusCode;

      console.log(
        chalk.yellow(
          `⚠️ [${phoneNumber}] Connection closed. Status: ${code || "unknown"}`
        )
      );

      try {
        sock.ev.removeAllListeners();
        sock.end(undefined);
      } catch {}

      if (code !== 401 && !sock._manualDisconnect) {
        console.log(
          chalk.yellow(
            `🔄 [${phoneNumber}] Reconnecting in 5 seconds...`
          )
        );

        scheduleReconnect(phoneNumber, 5000);
      } else {
        console.log(
          chalk.red(
            `❌ [${phoneNumber}] Logged out or manually disconnected.`
          )
        );
      }
    });

    attachHandlers(sock, phoneNumber);

  } catch (error) {
    console.error(
      chalk.red(`❌ Failed to start ${phoneNumber}:`),
      error?.stack || error
    );
  } finally {
    startingSockets.delete(phoneNumber);
  }
}

global.startBot = startBot;

// ======================================================
// SHARED SQLITE PAIRING IMPLEMENTATION
// ======================================================

async function pairAccount(phoneNumber, callbacks = {}) {
  const onCode =
    typeof callbacks.onCode === "function"
      ? callbacks.onCode
      : () => {};

  const onConnected =
    typeof callbacks.onConnected === "function"
      ? callbacks.onConnected
      : () => {};

  const onError =
    typeof callbacks.onError === "function"
      ? callbacks.onError
      : () => {};

  if (!validPhone(phoneNumber)) {
    throw new Error(
      "Invalid phone number. Use 10–15 digits with country code."
    );
  }

  if (activeSockets.has(phoneNumber)) {
    throw new Error("That number is already connected.");
  }

  if (startingSockets.has(phoneNumber)) {
    throw new Error("That account is currently starting.");
  }

  if (pairingSockets.has(phoneNumber)) {
    throw new Error(
      "A pairing request for that number is already running."
    );
  }

  if (!baileys) {
    throw new Error("WhatsApp connection library is not ready.");
  }

  const sessionPath = path.join(
    sessionsDir,
    phoneNumber
  );

  fs.mkdirSync(sessionPath, { recursive: true });

  const { version } =
    await baileys.fetchLatestBaileysVersion();

  // IMPORTANT:
  // Use the same SQLite database as startBot.
  // Never delete the session directory here.

  const { state, saveCreds } =
    await useSQLiteAuthState(
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
    browser: baileys.Browsers.ubuntu("Chrome"),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 15000,
    markOnlineOnConnect: false
  });

  pairingSockets.set(phoneNumber, tempSock);

  tempSock.ev.on("creds.update", saveCreds);

  let codeSent = false;
  let finished = false;
  let requestTimer = null;

  const cleanup = () => {
    if (requestTimer) {
      clearTimeout(requestTimer);
      requestTimer = null;
    }

    if (pairingSockets.get(phoneNumber) === tempSock) {
      pairingSockets.delete(phoneNumber);
    }
  };

  const stopTemporarySocket = () => {
    try {
      tempSock.ev.removeAllListeners();
      tempSock.end(undefined);
    } catch {}
  };

  tempSock.ev.on("connection.update", async update => {
    const { connection, lastDisconnect } = update;

    if (
      connection === "connecting" &&
      !codeSent &&
      !requestTimer
    ) {
      requestTimer = setTimeout(async () => {
        try {
          const code =
            await tempSock.requestPairingCode(phoneNumber);

          if (finished) return;

          codeSent = true;

          const formatted =
            code.match(/.{1,4}/g)?.join("-") || code;

          await onCode(formatted);

        } catch (err) {
          if (finished) return;

          finished = true;
          cleanup();
          stopTemporarySocket();

          try {
            await onError(err);
          } catch (callbackError) {
            console.error(
              "[PAIRING CALLBACK ERROR]",
              callbackError
            );
          }
        }
      }, 3000);
    }

    if (connection === "open") {
      if (finished) return;

      finished = true;
      cleanup();

      stopTemporarySocket();

      try {
        await onConnected();
      } catch (err) {
        console.error("[PAIR CONNECTED CALLBACK]", err);
      }

      setTimeout(() => {
        startBot(phoneNumber).catch(err => {
          console.error(
            `[PAIR START ERROR] ${phoneNumber}:`,
            err
          );
        });
      }, 2500);
    }

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)
        ?.output?.statusCode;

      cleanup();

      // WhatsApp may close the temporary pairing connection
      // with 515 after successful pairing.
      if (statusCode === 515) {
        if (!finished) {
          finished = true;

          stopTemporarySocket();

          setTimeout(() => {
            startBot(phoneNumber).catch(err => {
              console.error(
                `[PAIR RESTART ERROR] ${phoneNumber}:`,
                err
              );
            });
          }, 5000);
        }

        return;
      }

      if (!finished) {
        finished = true;
        stopTemporarySocket();

        const message = statusCode === 408
          ? "Pairing timed out (408). Request a new code and enter it promptly."
          : `Pairing connection closed (${statusCode || "unknown"}). Please try again.`;

        try {
          await onError(new Error(message));
        } catch (callbackError) {
          console.error(
            "[PAIRING CALLBACK ERROR]",
            callbackError
          );
        }
      }
    }
  });

  return {
    started: true
  };
}

global.pairAccount = pairAccount;

// ======================================================
// DASHBOARD CONTROL TOKENS
// ======================================================

function controlFile(phone) {
  return path.join(
    sessionsDir,
    phone,
    "control.json"
  );
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
}

function issueControlToken(phone) {
  const token = crypto.randomBytes(32).toString("hex");

  fs.mkdirSync(
    path.join(sessionsDir, phone),
    { recursive: true }
  );

  fs.writeFileSync(
    controlFile(phone),
    JSON.stringify({
      tokenHash: hashToken(token),
      createdAt: new Date().toISOString()
    }, null, 2),
    { mode: 0o600 }
  );

  return token;
}

function authorized(req, phone) {
  const header = req.headers.authorization || "";

  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  if (!token || !validPhone(phone)) {
    return false;
  }

  try {
    const saved = JSON.parse(
      fs.readFileSync(controlFile(phone), "utf8")
    );

    const a = Buffer.from(saved.tokenHash || "", "hex");
    const b = Buffer.from(hashToken(token), "hex");

    return (
      a.length === b.length &&
      crypto.timingSafeEqual(a, b)
    );
  } catch {
    return false;
  }
}

// ======================================================
// DASHBOARD STATS
// ======================================================

app.get("/api/stats", (req, res) => {
  const mem = process.memoryUsage();

  const heap = mem.heapUsed / 1024 / 1024;
  const rss = mem.rss / 1024 / 1024;
  const external = mem.external / 1024 / 1024;

  res.json({
    success: true,
    connected: activeSockets.size,
    sessions: activeSockets.size,
    pairing: pairingSockets.size,
    starting: startingSockets.size,
    status: "online",
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    memory: Math.round(heap * 100) / 100,
    rss: Math.round(rss * 100) / 100,
    external: Math.round(external * 100) / 100,
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    timestamp: new Date().toISOString()
  });
});

// ======================================================
// DASHBOARD HEALTH
// ======================================================

app.get("/api/health", (req, res) => {
  const mem = process.memoryUsage();

  res.json({
    success: true,
    healthy: true,
    service: "Alpha XMD API",
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),

    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
      rss: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
      external: Math.round(mem.external / 1024 / 1024 * 100) / 100
    },

    connections: {
      active: activeSockets.size,
      pairing: pairingSockets.size,
      starting: startingSockets.size,
      reconnecting: reconnectTimers.size
    },

    runtime: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch
    },

    timestamp: new Date().toISOString()
  });
});

// ======================================================
// DASHBOARD STATUS
// ======================================================

app.get("/api/status", (req, res) => {
  const phone = req.query.phoneNumber;

  if (!validPhone(phone)) {
    return res.status(400).json({
      connected: false
    });
  }

  return res.json({
    connected: activeSockets.has(phone)
  });
});

// ======================================================
// DASHBOARD PAIRING
// ======================================================

app.post(
  "/api/pair",
  rateLimiter,
  async (req, res) => {
    const { phoneNumber } = req.body || {};

    if (!validPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid number format."
      });
    }

    if (activeSockets.has(phoneNumber)) {
      return res.json({
        success: true,
        alreadyPaired: true,
        needsControlToken: true
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
        error: "This account is already registered. Use its saved dashboard access token."
      });
    }

    try {
      let controlToken = null;

      if (!existingControl) {
        controlToken = issueControlToken(phoneNumber);
      }

      await pairAccount(phoneNumber, {
        onCode: code => {
          if (res.headersSent) return;

          res.json({
            success: true,
            phoneNumber,
            code,
            controlToken
          });
        },

        onConnected: () => {
          console.log(
            `✅ Dashboard pairing completed for ${phoneNumber}`
          );
        },

        onError: err => {
          console.error(
            `[DASHBOARD PAIR ERROR] ${phoneNumber}:`,
            err.message
          );

          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: err.message
            });
          }
        }
      });

    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: err.message
        });
      }
    }
  }
);

// ======================================================
// DASHBOARD DISCONNECT
// ======================================================

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
    clearReconnectTimer(phoneNumber);

    const pairingSocket = pairingSockets.get(phoneNumber);

    if (pairingSocket) {
      pairingSockets.delete(phoneNumber);

      try {
        pairingSocket.end(undefined);
      } catch {}
    }

    const sock = activeSockets.get(phoneNumber);

    if (sock) {
      sock._manualDisconnect = true;
      activeSockets.delete(phoneNumber);

      try {
        await sock.logout();
      } catch {}

      try {
        sock.end(undefined);
      } catch {}
    }

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
      message: "Bot disconnected and session deleted."
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Could not disconnect this account."
    });
  }
});

// ======================================================
// DASHBOARD SETTINGS - GET
// ======================================================

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

// ======================================================
// DASHBOARD SETTINGS - POST
// ======================================================

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
    const previous = settingsCache.get(phoneNumber) || {};

    const merged = {
      ...previous,
      ...cleanSettings
    };

    if (
      cleanSettings.chreact &&
      typeof cleanSettings.chreact === "object"
    ) {
      merged.chreact = {
        ...(previous.chreact || {}),
        ...cleanSettings.chreact
      };
    }

    fs.writeFileSync(
      path.join(dir, "settings.json"),
      JSON.stringify(merged, null, 2),
      { mode: 0o600 }
    );

    settingsCache.set(phoneNumber, merged);

    res.json({
      success: true
    });

  } catch {
    res.status(500).json({
      success: false,
      error: "Could not save settings."
    });
  }
});

// ======================================================
// SERVER STARTUP
// ======================================================

(async () => {
  try {
    console.log(
      "🚀 Starting Alpha XMD Server (SQLite Mode)..."
    );

    baileys = await import("@whiskeysockets/baileys");

    const PORT =
      process.env.PORT ||
      process.env.SERVER_PORT ||
      3000;

    app.listen(PORT, async () => {
      console.log(
        `🌐 Internal API running on port ${PORT}`
      );

      // NGROK

      try {
        const ngrok = require("@ngrok/ngrok");

        if (!NGROK_AUTHTOKEN) {
          throw new Error(
            "NGROK_AUTHTOKEN is not set in the hosting environment variables."
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

      } catch (err) {
        console.log("⚠️ Ngrok Error:", err.message);
      }

      // RESTORE SAVED SQLITE SESSIONS

      try {
        const dirs = fs.readdirSync(sessionsDir);

        const sessions = dirs.filter(d =>
          /^\d{10,15}$/.test(d)
        );

        console.log(
          `📂 Found ${sessions.length} SQLite session(s):`,
          sessions.join(", ")
        );

        for (const phone of sessions) {
          await startBot(phone);
          await delay(3000);
        }

      } catch (err) {
        console.log(
          "❌ Error loading SQLite sessions:",
          err.message
        );
      }

      // INTERNAL HEALTH CHECK

      setInterval(() => {
        require("http")
          .get(`http://localhost:${PORT}/api/health`, () => {})
          .on("error", () => {});
      }, 10 * 60 * 1000);

      // MEMORY MONITOR

      setInterval(() => {
        const mem = process.memoryUsage();

        const heap = (
          mem.heapUsed / 1024 / 1024
        ).toFixed(1);

        const rss = (
          mem.rss / 1024 / 1024
        ).toFixed(1);

        const external = (
          mem.external / 1024 / 1024
        ).toFixed(1);

        console.log(
          `📊 Memory | RSS: ${rss} MB | ` +
          `Heap: ${heap} MB | ` +
          `External: ${external} MB | ` +
          `Active: ${activeSockets.size} | ` +
          `Pairing: ${pairingSockets.size}`
        );

        if (mem.rss > 220 * 1024 * 1024) {
          console.log(
            "⚠️ RSS memory is above 220 MB. Check the hosting memory limit."
          );
        }
      }, 60000);
    });

  } catch (err) {
    console.error(
      "❌ FATAL STARTUP ERROR:",
      err?.stack || err
    );

    process.exitCode = 1;
  }
})();