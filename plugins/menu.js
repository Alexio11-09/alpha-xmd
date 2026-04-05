// © 2026 Alpha - CLEAN PREMIUM MENU

const config = require("../settings/config");
const path = require("path");
const fs = require("fs");

const settingsPath = './database/settings.json';

// 🔧 LOAD SETTINGS
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return {
            autoread: false,
            typing: false,
            autoreact: false,
            antidelete: false,
            antidelete_mode: "chat",
            ignore_admins: false
        };
    }
};

module.exports = {
    command: "menu",
    description: "Show bot menu",
    category: "general",

    execute: async (sock, m, { send }) => {
        try {
            const settings = loadSettings();

            const pluginsDir = path.join(__dirname);
            let grouped = {};

            // 🔁 LOAD COMMANDS
            const load = (dir) => {
                for (let file of fs.readdirSync(dir)) {
                    let full = path.join(dir, file);

                    if (fs.lstatSync(full).isDirectory()) {
                        load(full);
                    } else if (file.endsWith(".js") && file !== "menu.js") {
                        try {
                            delete require.cache[require.resolve(full)];
                            const plugin = require(full);
                            if (!plugin.command) continue;

                            const cmds = Array.isArray(plugin.command)
                                ? plugin.command
                                : [plugin.command];

                            const cat = (plugin.category || "general").toLowerCase();

                            if (!grouped[cat]) grouped[cat] = [];

                            cmds.forEach(cmd => {
                                if (!grouped[cat].includes(cmd)) {
                                    grouped[cat].push(cmd);
                                }
                            });

                        } catch {}
                    }
                }
            };

            load(pluginsDir);

            const order = ["general", "downloader", "group", "owner"];

            const format = (arr) =>
                arr && arr.length
                    ? arr.map(c => `│ • ${c}`).join("\n")
                    : "│ • -";

            const ON = "ON ✅";
            const OFF = "OFF ❌";

            // 🧾 MENU TEXT
            let text = `╭─〔 ${config.settings.title} 〕\n│\n`;

            for (let cat of order) {
                if (grouped[cat]) {
                    text += `│ ${getIcon(cat)} ${cat.toUpperCase()}\n`;
                    text += format(grouped[cat]) + "\n│\n";
                    delete grouped[cat];
                }
            }

            // ⚙️ SETTINGS (CLEAN STYLE)
            text += `│ ⚙️ SETTINGS\n`;
            text += `│ • Autoread: ${settings.autoread ? ON : OFF}\n`;
            text += `│ • Typing: ${settings.typing ? ON : OFF}\n`;
            text += `│ • React: ${settings.autoreact ? ON : OFF}\n`;
            text += `│ • Antidelete: ${
                settings.antidelete
                    ? `ON ✅ (${settings.antidelete_mode.toUpperCase()})`
                    : OFF
            }\n`;
            text += `│ • Ignore Admins: ${settings.ignore_admins ? ON : OFF}\n`;
            text += `│\n`;

            text += `╰─${config.settings.footer}`;

            await send({ text });

        } catch (err) {
            console.log("Menu error:", err);
        }
    }
};

// 🎯 ICONS
function getIcon(cat) {
    switch (cat) {
        case "general": return "⚡";
        case "downloader": return "🎧";
        case "group": return "👥";
        case "owner": return "👑";
        default: return "🔹";
    }
}