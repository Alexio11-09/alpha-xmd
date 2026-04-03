const config = require('./settings/config');
const fs = require('fs');
const path = require("path");
const chalk = require("chalk");

const { dechtml, fetchWithTimeout } = require('./library/function');       
const { tempfiles } = require("./library/uploader");
const { fquoted } = require('./library/quoted');     
const Api = require('./library/Api');

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

        const body =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.text ||
            '';

        const prefixes = ['.', '!', '/'];
        const prefix = prefixes.find(p => body.startsWith(p)) || '.';

        const isCmd = body.startsWith(prefix);

        const command = isCmd
            ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase()
            : '';

        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        const sender = m.sender;
        const botNumber = await sock.decodeJid(sock.user.id);

        const isCreator =
            jidNormalizedUser(sender) === jidNormalizedUser(botNumber);

        const groupMetadata = m.isGroup
            ? await sock.groupMetadata(m.chat).catch(() => ({}))
            : {};

        const groupAdmins = m.isGroup
            ? groupMetadata.participants?.filter(p => p.admin).map(p => p.id)
            : [];

        const isAdmins = groupAdmins.includes(sender);

        const reply = (txt) =>
            sock.sendMessage(
                m.chat,
                {
                    text: txt,
                    contextInfo: {
                        externalAdReply: {
                            title: config.settings.title,
                            body: config.settings.description,
                            thumbnailUrl: config.thumbUrl
                        }
                    }
                },
                { quoted: m }
            );

        // 🔥 execute plugin
        const executed = await pluginLoader.executePlugin(command, sock, m, {
            args,
            text,
            sender,
            isCreator,
            isAdmins,
            prefix,
            reply,
            config
        });

        if (executed) return;

        // 🔥 built-in
        switch (command) {

            case 'menu': {
                const uptime = process.uptime().toFixed(0);
                const mode = sock.public ? 'Public' : 'Self';

                const menu = `
👑 *${config.settings.title}*

⚡ Mode: ${mode}
⏱️ Uptime: ${uptime}s
🧠 Plugins: ${pluginLoader.getPluginCount()}

${pluginLoader.getMenuSections()}
`;

                await sock.sendMessage(m.chat, {
                    image: { url: config.thumbUrl },
                    caption: menu
                }, { quoted: m });
                break;
            }

            case 'reload': {
                if (!isCreator) return;
                pluginLoader.reloadPlugins();
                reply("✅ Plugins reloaded");
                break;
            }
        }

    } catch (err) {
        console.log('❌ Main error:', err);
    }
};

// 🔥 Hot reload
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    delete require.cache[file];
    require(file);
});