// © 2026 Alpha

const config = require('./settings/config');
const fs = require('fs');
const path = require("path");

let jidNormalizedUser, getContentType;

const loadBaileysUtils = async () => {
    const baileys = await import('@whiskeysockets/baileys');
    jidNormalizedUser = baileys.jidNormalizedUser;
    getContentType = baileys.getContentType;
};

const settingsPath = './database/settings.json';

// 🛡️ STORE
const store = {};

// 🔧 LOAD SETTINGS
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return {
            autoread: false,
            typing: false,
            antidelete: false,
            autoreact: false,
            antidelete_mode: "chat",
            whitelist: [],
            ignore_admins: false,
            delete_tracker: {},
            warn_delete: false,
            warn_limit: 3,
            kick_limit: 6,
            mode: "public"
        };
    }
};

// 💾 SAVE SETTINGS
const saveSettings = (data) => {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
};

// 🔌 PLUGIN LOADER
class PluginLoader {
    constructor() {
        this.plugins = new Map();
        this.pluginsDir = path.join(__dirname, 'plugins');
        this.loadPlugins();
    }

    loadPlugins() {
        if (!fs.existsSync(this.pluginsDir)) return;

        const load = (dir) => {
            for (let file of fs.readdirSync(dir)) {
                let full = path.join(dir, file);

                if (fs.lstatSync(full).isDirectory()) {
                    load(full);
                } else if (file.endsWith('.js')) {
                    try {
                        delete require.cache[require.resolve(full)];
                        const plugin = require(full);

                        if (!plugin.command || !plugin.execute) continue;

                        const cmds = Array.isArray(plugin.command)
                            ? plugin.command
                            : [plugin.command];

                        cmds.forEach(cmd => this.plugins.set(cmd.toLowerCase(), plugin));

                    } catch (e) {
                        console.log("Plugin load error:", e.message);
                    }
                }
            }
        };

        load(this.pluginsDir);
    }

    async execute(command, sock, m, context) {
        const plugin = this.plugins.get(command);
        if (!plugin) return false;

        try {
            if (plugin.owner && !context.isCreator) {
                return context.reply(config.message.owner);
            }

            if (plugin.group && !m.isGroup) {
                return context.reply(config.message.group);
            }

            await plugin.execute(sock, m, context);
            return true;

        } catch (err) {
            console.log("Plugin exec error:", err);
            context.reply("❌ Command error");
            return true;
        }
    }
}

const plugins = new PluginLoader();

// 📩 MAIN HANDLER
module.exports = async (sock, m) => {
    try {
        if (!jidNormalizedUser) await loadBaileysUtils();

        if (!m.message) return;
        if (m.key?.remoteJid === 'status@broadcast') return;

        const settings = loadSettings();
        const prefix = '.';

        const body =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            '';

        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        const sender = m.sender || "";

        const senderJid = sender.split(":")[0];
        const botJid = (sock.user?.id || "").split(":")[0];
        const isCreator = senderJid === botJid;

        if (settings.mode === "self" && !isCreator) return;

        // 💾 STORE MESSAGE
        if (m.key?.id) {
            store[m.key.id] = {
                message: m.message,
                key: m.key,
                sender: m.sender,
                isGroup: m.isGroup
            };

            setTimeout(() => delete store[m.key.id], 10 * 60 * 1000);
        }

        // ⚙️ AUTO FEATURES
        if (settings.autoread) await sock.readMessages([m.key]);
        if (settings.typing) await sock.sendPresenceUpdate('composing', m.chat);
        if (settings.autoreact) {
            await sock.sendMessage(m.chat, {
                react: { text: "🔥", key: m.key }
            });
        }

        const ctx = {
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.newsletter.id + "@newsletter",
                    newsletterName: config.newsletter.name
                },
                externalAdReply: {
                    title: config.settings.title,
                    body: config.settings.description,
                    thumbnailUrl: config.thumbUrl,
                    sourceUrl: "https://whatsapp.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        };

        const send = (msg) =>
            sock.sendMessage(m.chat, { ...msg, ...ctx }, { quoted: m });

        const reply = (text) => send({ text });

        // 🔥 COMMANDS
        if (isCmd) {
            const done = await plugins.execute(command, sock, m, {
                args,
                text,
                reply,
                send,
                command,
                isCreator,
                settings,
                saveSettings,
                config,
                prefix
            });

            if (done) return;
        }

    } catch (err) {
        console.log(err);
    }
};

// 🛡️ ANTIDELETE V5 (CLEAN + FILTERED)
module.exports.handleDelete = async (sock, update) => {
    try {
        const settings = loadSettings();
        if (!settings.antidelete) return;

        const key = update?.messages?.[0]?.key || update?.keys?.[0];
        if (!key?.id) return;

        const data = store[key.id];
        if (!data) return;

        const from = data.key.remoteJid;
        const sender = data.sender || data.key.participant || data.key.remoteJid;

        const senderJid = sender.split(":")[0];
        const botJid = sock.user.id.split(":")[0];

        // 🚫 IGNORE OWNER / BOT
        if (senderJid === botJid) return;

        const ownerNumbers = config.owner || [];
        if (ownerNumbers.includes(senderJid.replace("@s.whatsapp.net", ""))) return;

        const whitelist = settings.whitelist || [];
        if (whitelist.includes(senderJid.replace("@s.whatsapp.net", ""))) return;

        // 👥 IGNORE ADMINS
        if (settings.ignore_admins && data.isGroup) {
            const meta = await sock.groupMetadata(from);
            const admins = meta.participants
                .filter(p => p.admin)
                .map(p => p.id.split("@")[0]);

            if (admins.includes(senderJid.split("@")[0])) return;
        }

        const user = senderJid.split("@")[0];
        const tag = `@${user}`;
        const mention = [sender];

        const caption = `🛡️ *ANTI DELETE*\n👤 ${tag}`;

        const sendChat = settings.antidelete_mode === "chat" || settings.antidelete_mode === "both";
        const sendDM = settings.antidelete_mode === "dm" || settings.antidelete_mode === "both";

        const msg = data.message;
        const text = msg?.conversation || msg?.extendedTextMessage?.text;

        if (text) {
            const content = { text: `${caption}\n\n${text}`, mentions: mention };

            if (sendChat) await sock.sendMessage(from, content);
            if (sendDM) await sock.sendMessage(sock.user.id, content);
        }

    } catch (err) {
        console.log("Antidelete error:", err);
    }
};