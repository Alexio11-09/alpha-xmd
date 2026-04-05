// © 2026 Alpha - PREMIUM MENU (WITH TOOLS 😈)

const config = require("../settings/config");
const moment = require("moment-timezone");
const fs = require("fs");

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

            // 👤 USER
            const name = m.pushName || "User";

            // ⏱️ UPTIME
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const mnt = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);

            // 📅 TIME
            const time = moment().tz("Africa/Harare").format("HH:mm:ss");
            const date = moment().tz("Africa/Harare").format("DD/MM/YYYY");

            // 🔥 STATUS FORMAT
            const ON = "ON ✅";
            const OFF = "OFF ❌";

            let text = `╭─〔 ${config.settings.title} 〕\n`;
            text += `│ 👤 User: ${name}\n`;
            text += `│ ⏱️ Uptime: ${h}h ${mnt}m ${s}s\n`;
            text += `│ 🕒 Time: ${time}\n`;
            text += `│ 📅 Date: ${date}\n│\n`;

            // ⚡ GENERAL
            text += `│ ⚡ GENERAL\n`;
            text += `│ • .alive\n`;
            text += `│ • .ping\n│\n`;

            // 🎧 DOWNLOADER
            text += `│ 🎧 DOWNLOADER\n`;
            text += `│ • .play\n`;
            text += `│ • .video\n│\n`;

            // 🛠️ TOOLS (NEW 🔥)
            text += `│ 🛠️ TOOLS\n`;
            text += `│ • .calc\n`;
            text += `│ • .short\n`;
            text += `│ • .translate\n`;
            text += `│ • .sticker\n`;
            text += `│ • .qr\n`;
            text += `│ • .google\n│\n`;

            // 👥 GROUP
            text += `│ 👥 GROUP\n`;
            text += `│ • .tagall\n│\n`;

            // 👑 OWNER
            text += `│ 👑 OWNER\n`;
            text += `│ • .mode\n`;
            text += `│ • .status\n`;
            text += `│ • .update\n`;
            text += `│ • .restart\n│\n`;

            // ⚙️ SETTINGS (LIVE)
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
            text += `│ • .toggle autoread\n`;
            text += `│ • .toggle typing\n`;
            text += `│ • .toggle react\n`;
            text += `│ • .toggle antidelete\n`;
            text += `│ • .toggle antidelete chat/dm/both\n`;
            text += `│\n`;

            text += `╰─⚡ Powered by Alpha-XMD`;

            await send({ text });

        } catch (err) {
            console.log("Menu error:", err);
        }
    }
};