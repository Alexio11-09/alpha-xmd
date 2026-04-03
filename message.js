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

// 🔥 SAVE SETTINGS
const saveSettings = (data) => {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
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
        const text = args.join(" ");

        const sender = m.sender;
        const botNumber = await sock.decodeJid(sock.user.id);
        const isCreator = sender === botNumber;

        if (settings.mode === "self" && !m.fromMe) return;

        if (settings.autoread) await sock.readMessages([m.key]);
        if (settings.typing) await sock.sendPresenceUpdate('composing', m.chat);

        if (settings.autoreact) {
            await sock.sendMessage(m.chat, {
                react: { text: "🔥", key: m.key }
            });
        }

        // 🔥 FIXED SEND FUNCTION (MAIN FIX)
        const send = (msg) => sock.sendMessage(m.chat, msg, { quoted: m });

        const reply = (text) => send({ text });

        // 🔥 EXECUTE
        const done = await plugins.execute(command, sock, m, {
            args,
            text, // 🔥 IMPORTANT FIX
            reply,
            send,
            command,
            isCreator,
            settings,
            saveSettings,
            config
        });

        if (done) return;

    } catch (err) {
        console.log(err);
    }
};