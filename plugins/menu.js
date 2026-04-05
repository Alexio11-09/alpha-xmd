// © 2026 Alpha - PREMIUM AUTO MENU 😈

const config = require("../settings/config");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

const settingsPath = "./database/settings.json";

// 🔧 LOAD SETTINGS
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return {};
    }
};

module.exports = {
    command: "menu",
    description: "Show bot menu",
    category: "general",

    execute: async (sock, m, { send }) => {
        try {

            const settings = loadSettings();

            const name = m.pushName || "User";

            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const mnt = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);

            const time = moment().tz("Africa/Harare").format("HH:mm:ss");
            const date = moment().tz("Africa/Harare").format("DD/MM/YYYY");

            const ON = "ON ✅";
            const OFF = "OFF ❌";

            let text = `╭─〔 ${config.settings.title} 〕\n`;
            text += `│ 👤 User: ${name}\n`;
            text += `│ ⏱️ Uptime: ${h}h ${mnt}m ${s}s\n`;
            text += `│ 🕒 Time: ${time}\n`;
            text += `│ 📅 Date: ${date}\n│\n`;

            // 🔥 AUTO LOAD COMMANDS
            const pluginsPath = path.join(__dirname, "../plugins");
            let categories = {};

            const loadCommands = (dir) => {
                const files = fs.readdirSync(dir);

                for (let file of files) {
                    const fullPath = path.join(dir, file);

                    if (fs.lstatSync(fullPath).isDirectory()) {
                        loadCommands(fullPath);
                    } else if (file.endsWith(".js")) {
                        try {
                            const cmd = require(fullPath);

                            if (!cmd.command) continue;

                            const category = cmd.category || "other";

                            if (!categories[category]) {
                                categories[category] = [];
                            }

                            categories[category].push(cmd.command);

                        } catch (e) {
                            console.log("Menu load error:", file);
                        }
                    }
                }
            };

            loadCommands(pluginsPath);

            // 🔥 DISPLAY CATEGORIES
            const emojis = {
                general: "⚡",
                downloader: "🎧",
                tools: "🛠️",
                group: "👥",
                owner: "👑",
                other: "📦"
            };

            for (let cat in categories) {
                text += `│ ${emojis[cat] || "📂"} ${cat.toUpperCase()}\n`;

                categories[cat].forEach(cmd => {
                    text += `│ • .${cmd}\n`;
                });

                text += `│\n`;
            }

            // ⚙️ SETTINGS
            text += `│ ⚙️ SETTINGS\n`;
            text += `│ • Autoread: ${settings.autoread ? ON : OFF}\n`;
            text += `│ • Typing: ${settings.typing ? ON : OFF}\n`;
            text += `│ • React: ${settings.autoreact ? ON : OFF}\n`;
            text += `│ • Antidelete: ${
                settings.antidelete
                    ? `ON (${settings.antidelete_mode || "chat"}) ✅`
                    : OFF
            }\n`;
            text += `│ • Ignore Admins: ${settings.ignore_admins ? ON : OFF}\n`;
            text += `│\n`;

            // 📘 HOW TO USE
            text += `│ 📘 HOW TO USE\n`;
            text += `│ • .toggle autoread on/off\n`;
            text += `│ • .toggle typing on/off\n`;
            text += `│ • .toggle react on/off\n`;
            text += `│ • .toggle antidelete on/off\n`;
            text += `│ • .toggle antidelete chat/dm/both\n`;
            text += `│\n`;

            text += `╰─⚡ Powered by Alpha-XMD`;

            await send({ text });

        } catch (err) {
            console.log("Menu error:", err);
        }
    }
};