const config = require('./settings/config');
const fs = require('fs');
const path = require("path");
const chalk = require("chalk");

let jidNormalizedUser, getContentType, isPnUser;

const loadBaileysUtils = async () => {
    const baileys = await import('@whiskeysockets/baileys');
    jidNormalizedUser = baileys.jidNormalizedUser;
    getContentType = baileys.getContentType;
    isPnUser = baileys.isPnUser;
};

class PluginLoader {
    constructor() {
        this.plugins = new Map();
        this.categories = new Map();
        this.pluginsDir = path.join(__dirname, 'plugins');

        this.defaultCategories = {
            ai: '🤖 AI MENU',
            downloader: '📥 DOWNLOAD MENU',
            fun: '🎮 FUN MENU',
            general: '⚡ GENERAL MENU',
            group: '👥 GROUP MENU',
            owner: '👑 OWNER MENU',
            other: '📦 OTHER MENU',
            tools: '🛠️ TOOLS MENU',
            video: '🎬 VIDEO MENU'
        };

        this.loadPlugins();
    }

    loadPlugins() {
        if (!fs.existsSync(this.pluginsDir)) {
            fs.mkdirSync(this.pluginsDir, { recursive: true });
            return;
        }

        const pluginFiles = fs.readdirSync(this.pluginsDir)
            .filter(file => file.endsWith('.js') && !file.startsWith('_'));

        this.plugins.clear();
        this.categories.clear();

        Object.keys(this.defaultCategories).forEach(cat => {
            this.categories.set(cat, []);
        });

        for (const file of pluginFiles) {
            try {
                const pluginPath = path.join(this.pluginsDir, file);
                delete require.cache[require.resolve(pluginPath)];

                const plugin = require(pluginPath);

                if (plugin.command && typeof plugin.execute === 'function') {
                    if (!plugin.category) plugin.category = 'general';

                    if (!this.categories.has(plugin.category)) {
                        this.categories.set(plugin.category, []);
                    }

                    this.plugins.set(plugin.command, plugin);
                    this.categories.get(plugin.category).push(plugin.command);
                }

            } catch (err) {
                console.log('❌ Plugin error:', err.message);
            }
        }

        console.log(chalk.green(`✅ Loaded ${this.plugins.size} plugins`));
    }

    async executePlugin(command, sock, m, context) {
        const plugin = this.plugins.get(command);
        if (!plugin) return false;

        try {
            if (plugin.owner && !context.isCreator) return true;
            if (plugin.group && !m.isGroup) return true;
            if (plugin.admin && m.isGroup && !context.isAdmins && !context.isCreator) return true;

            await plugin.execute(sock, m, context);
            return true;

        } catch (err) {
            console.log('❌ Execute error:', err);
            return true;
        }
    }

    getMenuSections() {
        let sections = [];

        for (const [category, commands] of this.categories.entries()) {
            if (!commands.length) continue;

            const title = this.defaultCategories[category] || category;

            const list = commands.map(cmd => {
                const p = this.plugins.get(cmd);
                return `• ${cmd}${p.description ? ` - ${p.description}` : ''}`;
            }).join('\n');

            sections.push(`╭─ ${title}\n${list}\n╰────────────`);
        }

        return sections.join('\n\n');
    }

    getPluginCount() {
        return this.plugins.size;
    }

    reloadPlugins() {
        this.loadPlugins();
    }
}

const pluginLoader = new PluginLoader();

module.exports = async (sock, m, chatUpdate, store) => {
    try {
        if (!jidNormalizedUser) await loadBaileysUtils();

        // 👁️ AUTO READ
        if (config.status.autoRead) {
            await sock.readMessages([m.key]);
        }

        // ⚡ AUTO REACT
        if (config.status.autoReact) {
            const emojis = ["🔥","⚡","💀","👀","😈","✅"];
            const random = emojis[Math.floor(Math.random() * emojis.length)];

            await sock.sendMessage(m.chat, {
                react: { text: random, key: m.key }
            });
        }

        // ⌨️ TYPING EFFECT
        if (config.status.typing) {
            await sock.sendPresenceUpdate("composing", m.chat);
            await new Promise(res => setTimeout(res, 800));
        }

        const body =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.text ||
            '';

        const prefix = config.prefix.find(p => body.startsWith(p)) || '.';
        const isCmd = body.startsWith(prefix);

        const command = isCmd
            ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase()
            : '';

        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        const sender = m.sender;
        const botNumber = await sock.decodeJid(sock.user.id);

        const isCreator = config.owner.includes(sender);

        const groupMetadata = m.isGroup
            ? await sock.groupMetadata(m.chat).catch(() => ({}))
            : {};

        const groupAdmins = m.isGroup
            ? groupMetadata.participants?.filter(p => p.admin).map(p => p.id)
            : [];

        const isAdmins = groupAdmins.includes(sender);

        // 📢 GLOBAL SEND SYSTEM (CHANNEL STYLE)
        const send = async (content) => {
            try {
                return await sock.sendMessage(m.chat, {
                    ...content,
                    contextInfo: {
                        ...(content.contextInfo || {}),
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
                            sourceUrl: config.settings.channel,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

            } catch (err) {
                console.log("⚠️ Forward failed, fallback");

                return await sock.sendMessage(m.chat, {
                    ...content,
                    contextInfo: {
                        externalAdReply: {
                            title: config.settings.title,
                            body: config.settings.description,
                            thumbnailUrl: config.thumbUrl
                        }
                    }
                }, { quoted: m });
            }
        };

        const reply = (txt) => send({ text: txt });

        // 🔥 PLUGIN EXECUTION
        const executed = await pluginLoader.executePlugin(command, sock, m, {
            args,
            text,
            sender,
            isCreator,
            isAdmins,
            prefix,
            reply,
            send,
            config
        });

        if (executed) return;

        // 🔥 BUILT-IN COMMANDS
        switch (command) {

            case 'menu': {
                const uptime = process.uptime().toFixed(0);
                const mode = config.status.public ? 'Public' : 'Self';

                const menu = `
👑 *${config.settings.title}*

⚡ Mode: ${mode}
⏱️ Uptime: ${uptime}s
🧠 Plugins: ${pluginLoader.getPluginCount()}

${pluginLoader.getMenuSections()}
`;

                await send({
                    image: { url: config.thumbUrl },
                    caption: menu
                });
                break;
            }

            case 'reload': {
                if (!isCreator) return reply(config.message.owner);
                pluginLoader.reloadPlugins();
                reply("✅ Plugins reloaded");
                break;
            }
        }

    } catch (err) {
        console.log('❌ Main error:', err);
    }
};

// 🔥 HOT RELOAD
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    delete require.cache[file];
    require(file);
});