const config = require('./settings/config');
const fs = require('fs');
const path = require("path");

let jidNormalizedUser, getContentType;

// 🔥 LOAD BAILEYS UTILS
const loadBaileysUtils = async () => {
    const baileys = await import('@whiskeysockets/baileys');
    jidNormalizedUser = baileys.jidNormalizedUser;
    getContentType = baileys.getContentType;
};

// 🔥 SETTINGS PATH
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

// 🔥 PLUGIN LOADER
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
            if (plugin.owner && !context.isCreator) return true;
            if (plugin.group && !m.isGroup) return true;

            await plugin.execute(sock, m, context);
            return true;

        } catch (err) {
            console.log("Plugin exec error:", err);
            return true;
        }
    }

    // 🔥 GET ALL COMMANDS (FOR MENU)
    getAllCommands() {
        let cmds = [];

        for (let [name, plugin] of this.plugins) {
            cmds.push({
                command: name,
                category: plugin.category || "misc"
            });
        }

        return cmds;
    }
}

const plugins = new PluginLoader();

// 🔥 MAIN HANDLER
module.exports = async (sock, m) => {
    try {
        if (!jidNormalizedUser) await loadBaileysUtils();

        const settings = loadSettings();

        const body = m.text || '';
        const prefix = '.';
        const isCmd = body.startsWith(prefix);

        const command = isCmd ? body.slice(1).split(" ")[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);

        const sender = m.sender;
        const botNumber = await sock.decodeJid(sock.user.id);
        const isCreator = sender === botNumber;

        // 🔒 MODE
        if (settings.mode === "self" && !m.fromMe) return;

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

        // 🔥 UNIVERSAL CONTEXT (CHANNEL FORWARD)
        const ctx = {
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.newsletter.id + "@newsletter",
                    newsletterName: config.newsletter.name
                }
            }
        };

        // ✅ REPLY SYSTEM (APPLIED TO ALL COMMANDS)
        const reply = (text, extra = {}) =>
            sock.sendMessage(m.chat, {
                text,
                ...ctx,
                ...extra
            }, { quoted: m });

        const send = reply;

        // 🔥 EXECUTE PLUGIN
        const done = await plugins.execute(command, sock, m, {
            args,
            reply,
            send,
            command,
            isCreator,
            config
        });

        if (done) return;

        // =============================
        // 🔥 DEFAULT COMMANDS
        // =============================

        // 🏓 PING
        if (command === "ping") {
            return reply("🏓 Pong!");
        }

        // 📜 MENU (FIXED PROPERLY)
        if (command === "menu") {
            const all = plugins.getAllCommands();

            if (!all.length) {
                return reply("❌ No commands loaded");
            }

            // GROUP BY CATEGORY
            let grouped = {};
            all.forEach(cmd => {
                if (!grouped[cmd.category]) grouped[cmd.category] = [];
                grouped[cmd.category].push(cmd.command);
            });

            let text = 
`╔═══〔 🤖 ${config.settings.title} 〕═══⬣
║ 👑 Owner: Alpha
║ ⚡ Prefix: .
╚════════════════════⬣\n\n`;

            for (let cat in grouped) {
                text += `╭─〔 ${cat.toUpperCase()} 〕\n`;
                grouped[cat].forEach(c => {
                    text += `│ ➤ .${c}\n`;
                });
                text += `╰──────────────\n\n`;
            }

            text += `> ${config.settings.footer}`;

            return sock.sendMessage(m.chat, {
                image: { url: config.thumbUrl },
                caption: text,
                ...ctx
            }, { quoted: m });
        }

    } catch (err) {
        console.log(err);
    }
};