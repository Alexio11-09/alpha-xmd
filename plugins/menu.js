// © 2026 Alpha

const config = require("../settings/config");
const path = require("path");
const fs = require("fs");

module.exports = {
    command: "menu",
    description: "Show bot menu",
    category: "general",

    execute: async (sock, m, { send }) => {
        try {
            const pluginsDir = path.join(__dirname);
            const grouped = {
                general: [],
                downloader: [],
                group: [],
                settings: [],
                owner: []
            };

            // 🔥 READ ALL PLUGINS
            const files = fs.readdirSync(pluginsDir);

            for (let file of files) {
                if (!file.endsWith(".js")) continue;
                if (file === "menu.js") continue;

                const plugin = require(path.join(pluginsDir, file));

                if (!plugin.command) continue;

                const cmds = Array.isArray(plugin.command)
                    ? plugin.command
                    : [plugin.command];

                const cat = (plugin.category || "general").toLowerCase();

                if (!grouped[cat]) grouped[cat] = [];

                cmds.forEach(cmd => grouped[cat].push(cmd));
            }

            // 🔥 BUILD MENU (YOUR STYLE)
            const format = (arr) => arr.map(c => `║ • .${c}`).join("\n") || "║ • -";

            const menu = `
╔═══〔 ${config.settings.title} 〕═══⬣
║
║ ⚡ *GENERAL*
${format(grouped.general)}
║
║ 🎧 *DOWNLOADER*
${format(grouped.downloader)}
║
║ 👥 *GROUP*
${format(grouped.group)}
║
║ ⚙️ *SETTINGS*
${format(grouped.settings)}
║
║ 👑 *OWNER*
${format(grouped.owner)}
║
╚══════════════════⬣

${config.settings.footer}
`;

            await send({ text: menu });

        } catch (err) {
            console.log("Menu error:", err);
        }
    }
};