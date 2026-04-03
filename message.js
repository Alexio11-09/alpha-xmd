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

const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return {
            autoread: false,
            typing: false,
            antidelete: false,
            autoreact: false,
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
                if (fs.lstatSync(full).isDirectory()) load(full);
                else if (file.endsWith('.js')) {
                    try {
                        delete require.cache[require.resolve(full)];
                        const plugin = require(full);

                        if (!plugin.command || !plugin.execute) return;

                        const cmds = Array.isArray(plugin.command)
                            ? plugin.command
                            : [plugin.command];

                        cmds.forEach(cmd => this.plugins.set(cmd, plugin));

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
        if (m.key && m.key.remoteJid === 'status@broadcast') return;

        const settings = loadSettings();

        const body = m.text || '';
        const prefix = '.';
        const isCmd = body.startsWith(prefix);

        const command = isCmd ? body.slice(1).split(" ")[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        const sender = m.sender;

        // 🔥 FIXED OWNER SYSTEM (IMPORTANT)
        const isCreator = config.owner.some(num => sender.includes(num));

        // 🔒 MODE FIX (PUBLIC WORKS FOR EVERYONE)
        if (settings.mode === "self" && !isCreator) return;

        // 👁️ AUTO READ
        if (settings.autoread) {
            await sock.readMessages([m.key]);
        }

        // ⌨️ TYPING
        if (settings.typing) {
            await sock.sendPresenceUpdate('composing', m.chat);
        }

        // ❤️ AUTO REACT
        if (settings.autoreact) {
            await sock.sendMessage(m.chat, {
                react: { text: "🔥", key: m.key }
            });
        }

        // 🔥 CHANNEL FORWARD STYLE (UNCHANGED ✅)
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

        const send = (msg) => sock.sendMessage(m.chat, { ...msg, ...ctx }, { quoted: m });
        const reply = (text) => send({ text });

        // 🔥 EXECUTE COMMANDS
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

        // 🔥 DEFAULT MENU (BACKUP)
        if (command === "menu") {
            return reply(`
╔═══〔 ${config.settings.title} MENU 〕═══⬣
║
║ ⚡ .ping
║ 🎵 .play
║ 🎥 .video
║ ⚙️ .toggle
║ 🔄 .update
║
╚══════════════════⬣
`);
        }

    } catch (err) {
        console.log(err);
    }
};