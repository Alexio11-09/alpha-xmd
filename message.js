const config = require('./settings/config');
const fs = require('fs');
const path = require("path");

let jidNormalizedUser, getContentType, isPnUser;

// 🔥 LOAD BAILEYS UTILS
const loadBaileysUtils = async () => {
    const baileys = await import('@whiskeysockets/baileys');
    jidNormalizedUser = baileys.jidNormalizedUser;
    getContentType = baileys.getContentType;
    isPnUser = baileys.isPnUser;
};

// 🔥 LOAD SETTINGS (SAFE)
const settingsPath = './database/settings.json';
let settings = {};

const loadSettings = () => {
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        settings = {
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
        this.categories = new Map();
        this.pluginsDir = path.join(__dirname, 'plugins');

        this.defaultCategories = {
            general: "⚡ GENERAL",
            downloader: "📥 DOWNLOADER",
            group: "👥 GROUP",
            owner: "👑 OWNER",
            tools: "🛠️ TOOLS"
        };

        this.loadPlugins();
    }

    loadPlugins() {
        if (!fs.existsSync(this.pluginsDir)) return;

        const files = fs.readdirSync(this.pluginsDir);

        this.plugins.clear();
        this.categories.clear();

        for (const file of files) {
            const full = path.join(this.pluginsDir, file);

            if (fs.lstatSync(full).isDirectory()) {
                const subFiles = fs.readdirSync(full);
                for (const sub of subFiles) {
                    if (!sub.endsWith('.js')) continue;
                    this.loadPluginFile(path.join(full, sub));
                }
            } else if (file.endsWith('.js')) {
                this.loadPluginFile(full);
            }
        }
    }

    loadPluginFile(filePath) {
        try {
            delete require.cache[require.resolve(filePath)];
            const plugin = require(filePath);

            if (!plugin.command || !plugin.execute) return;

            const commands = Array.isArray(plugin.command)
                ? plugin.command
                : [plugin.command];

            for (const cmd of commands) {
                this.plugins.set(cmd, plugin);

                const cat = plugin.category || 'general';
                if (!this.categories.has(cat)) this.categories.set(cat, []);
                this.categories.get(cat).push(cmd);
            }
        } catch (err) {
            console.log('Plugin error:', err.message);
        }
    }

    async execute(command, sock, m, context) {
        const plugin = this.plugins.get(command);
        if (!plugin) return false;

        try {
            if (plugin.owner && !context.isCreator) return true;
            if (plugin.group && !m.isGroup) return true;
            if (plugin.admin && !context.isAdmins) return true;

            await plugin.execute(sock, m, context);
            return true;
        } catch (err) {
            console.log("Exec error:", err);
            return true;
        }
    }

    menu() {
        let text = "";

        for (let [cat, cmds] of this.categories) {
            text += `\n╭─ ${this.defaultCategories[cat] || cat}\n`;
            text += cmds.map(c => `• ${c}`).join("\n");
            text += "\n╰────────────\n";
        }

        return text;
    }

    count() {
        return this.plugins.size;
    }
}

const plugins = new PluginLoader();

// 🔥 MAIN EXPORT
module.exports = async (sock, m) => {
    try {
        if (!jidNormalizedUser) await loadBaileysUtils();

        loadSettings();

        const body = m.text || '';
        const prefix = '.';
        const isCmd = body.startsWith(prefix);

        const command = isCmd
            ? body.slice(1).trim().split(" ")[0].toLowerCase()
            : '';

        const args = body.trim().split(/ +/).slice(1);

        const sender = m.sender;
        const botNumber = await sock.decodeJid(sock.user.id);

        const isCreator = sender === botNumber;

        // 🔒 MODE SYSTEM
        if (settings.mode === "self" && !m.fromMe) return;

        // 👁️ AUTO READ
        if (settings.autoread) {
            await sock.readMessages([m.key]);
        }

        // ⌨️ AUTO TYPING
        if (settings.typing) {
            await sock.sendPresenceUpdate('composing', m.chat);
        }

        // ❤️ AUTO REACT
        if (settings.autoreact) {
            await sock.sendMessage(m.chat, {
                react: { text: "🔥", key: m.key }
            });
        }

        // 🔥 UNIVERSAL CONTEXT (CHANNEL TAG)
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

        const reply = (text) => sock.sendMessage(m.chat, {
            text,
            ...ctx
        }, { quoted: m });

        // 🔥 EXECUTE PLUGINS
        const done = await plugins.execute(command, sock, m, {
            args,
            reply,
            command,
            isCreator
        });

        if (done) return;

        // 🔥 DEFAULT COMMANDS
        switch (command) {

            case 'menu': {
                const menu = `👑 ${config.settings.title}\n\n` +
                    `⚡ Commands: ${plugins.count()}\n` +
                    plugins.menu();

                await sock.sendMessage(m.chat, {
                    image: { url: config.thumbUrl },
                    caption: menu,
                    ...ctx
                }, { quoted: m });
                break;
            }

            case 'ping': {
                const start = Date.now();
                const speed = Date.now() - start;
                reply(`🏓 Pong: ${speed}ms`);
                break;
            }
        }

    } catch (err) {
        console.log(err);
    }
};