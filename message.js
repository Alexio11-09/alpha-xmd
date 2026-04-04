// © 2026 Alpha

const config = require('./settings/config');
const fs = require('fs');
const path = require("path");

const settingsPath = './database/settings.json';

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

        const files = fs.readdirSync(this.pluginsDir);
        for (let file of files) {
            if (!file.endsWith('.js')) continue;

            const plugin = require(`./plugins/${file}`);

            const cmds = Array.isArray(plugin.command)
                ? plugin.command
                : [plugin.command];

            cmds.forEach(cmd => this.plugins.set(cmd, plugin));
        }
    }

    async execute(command, sock, m, ctx) {
        const plugin = this.plugins.get(command);
        if (!plugin) return false;

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

        // ✅ OWNER FIX (FINAL)
        const sender = (m.sender || "").replace(/\D/g, '');
        const isCreator = config.owner.includes(sender);

        if (settings.mode === "self" && !isCreator) return;

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
                    mediaType: 1
                }
            }
        };

        const send = (msg) =>
            sock.sendMessage(m.chat, { ...msg, ...ctx }, { quoted: m });

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