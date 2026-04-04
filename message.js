// © 2026 Alpha (FINAL FIXED)

const config = require('./settings/config');
const fs = require('fs');
const path = require("path");

const settingsPath = './database/settings.json';

// 🔥 LOAD SETTINGS
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return {
            autoread: false,
            typing: false,
            autoreact: false,
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

        const files = fs.readdirSync(this.pluginsDir);
        for (let file of files) {
            if (!file.endsWith('.js')) continue;

            const plugin = require(`./plugins/${file}`);

            if (!plugin.command || !plugin.execute) continue;

            const cmds = Array.isArray(plugin.command)
                ? plugin.command
                : [plugin.command];

            cmds.forEach(cmd => this.plugins.set(cmd, plugin));
        }
    }

    async execute(command, sock, m, ctx) {
        const plugin = this.plugins.get(command);
        if (!plugin) return false;

        // 🔥 OWNER CHECK (FINAL)
        if (plugin.owner && !ctx.isCreator) {
            return ctx.reply(config.message.owner);
        }

        if (plugin.group && !m.isGroup) {
            return ctx.reply(config.message.group);
        }

        await plugin.execute(sock, m, ctx);
        return true;
    }
}

const plugins = new PluginLoader();

// 🚀 MAIN EXPORT
module.exports = async (sock, m) => {
    try {
        if (!m.message) return;
        if (m.key.remoteJid === 'status@broadcast') return;

        const settings = loadSettings();

        const body = m.text || '';
        const prefix = '.';

        if (!body.startsWith(prefix)) return;

        const command = body.slice(1).split(" ")[0].toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        // 🔥 FINAL OWNER FIX (100%)
        const sender = m.sender || "";
        const senderNumber = sender.replace(/\D/g, '');

        const isCreator =
            config.owner.includes(senderNumber) ||
            (config.ownerJid && config.ownerJid.includes(sender));

        // 🔒 MODE
        if (settings.mode === "self" && !isCreator) return;

        const send = (msg) =>
            sock.sendMessage(m.chat, msg, { quoted: m });

        const reply = (text) => send({ text });

        const done = await plugins.execute(command, sock, m, {
            args,
            text,
            reply,
            send,
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