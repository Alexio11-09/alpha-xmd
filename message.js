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
            log_jid: "",
            mode: "public"
        };
    }
};

const saveSettings = (data) => {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
};

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

        // 💾 SAVE MESSAGE
        if (m.key?.id) {
            store[m.key.id] = {
                message: m.message,
                key: m.key,
                sender: m.sender,
                isGroup: m.isGroup
            };

            setTimeout(() => {
                delete store[m.key.id];
            }, 10 * 60 * 1000);
        }

        // AUTO FEATURES
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

        // COMMANDS
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

// 🛡️ ANTIDELETE V2
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

        const tag = `@${sender.split("@")[0]}`;
        const mention = [sender];

        const caption = `🛡️ *ANTI DELETE*\n\n👤 ${tag}`;

        const sendChat = settings.antidelete_mode === "chat" || settings.antidelete_mode === "both";
        const sendDM = settings.antidelete_mode === "dm" || settings.antidelete_mode === "both";

        const logJid = settings.log_jid || null;

        const msg = data.message;

        const sendTo = async (jid, content) => {
            await sock.sendMessage(jid, content);
        };

        const text = msg?.conversation || msg?.extendedTextMessage?.text;
        const image = msg?.imageMessage;
        const video = msg?.videoMessage;
        const audio = msg?.audioMessage;

        if (text) {
            const content = { text: `${caption}\n\n${text}`, mentions: mention };
            if (sendChat) await sendTo(from, content);
            if (sendDM) await sendTo(sock.user.id, content);
            if (logJid) await sendTo(logJid, content);
        }

        else if (image) {
            const content = { image: image, caption, mentions: mention };
            if (sendChat) await sendTo(from, content);
            if (sendDM) await sendTo(sock.user.id, content);
            if (logJid) await sendTo(logJid, content);
        }

        else if (video) {
            const content = { video: video, caption, mentions: mention };
            if (sendChat) await sendTo(from, content);
            if (sendDM) await sendTo(sock.user.id, content);
            if (logJid) await sendTo(logJid, content);
        }

        else if (audio) {
            const content = { audio: audio, mimetype: "audio/mp4", ptt: true };
            if (sendChat) await sendTo(from, content);
            if (sendDM) await sendTo(sock.user.id, content);
            if (logJid) await sendTo(logJid, content);
        }

        else {
            const content = { text: `${caption}\n\n[Unsupported message]`, mentions: mention };
            if (sendChat) await sendTo(from, content);
            if (sendDM) await sendTo(sock.user.id, content);
            if (logJid) await sendTo(logJid, content);
        }

    } catch (err) {
        console.log("Antidelete v2 error:", err);
    }
};