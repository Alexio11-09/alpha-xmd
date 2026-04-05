// © 2026 Alpha - PREMIUM MENU 😈

const config = require("../settings/config");
const moment = require("moment-timezone");

module.exports = {
    command: "menu",
    description: "Show bot menu",
    category: "general",

    execute: async (sock, m, { send }) => {
        try {

            // 👤 USER INFO
            const name = m.pushName || "User";

            // ⏱️ UPTIME
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            // 📅 TIME
            const time = moment().tz("Africa/Harare").format("HH:mm:ss");
            const date = moment().tz("Africa/Harare").format("DD/MM/YYYY");

            let text = `╭─〔 ${config.settings.title} 〕\n`;
            text += `│ 👤 User: ${name}\n`;
            text += `│ ⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s\n`;
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

            // 👥 GROUP
            text += `│ 👥 GROUP\n`;
            text += `│ • .tagall\n│\n`;

            // 👑 OWNER
            text += `│ 👑 OWNER\n`;
            text += `│ • .mode\n`;
            text += `│ • .status\n`;
            text += `│ • .update\n`;
            text += `│ • .restart\n│\n`;

            // ⚙️ SETTINGS
            text += `│ ⚙️ SETTINGS\n`;
            text += `│ • .toggle autoread\n`;
            text += `│ • .toggle typing\n`;
            text += `│ • .toggle react\n`;
            text += `│ • .toggle antidelete\n`;
            text += `│ • .toggle antidelete chat/dm/both\n`;
            text += `│ • .toggle ignoreadmins\n`;
            text += `│\n`;

            text += `╰─⚡ Powered by Alpha-XMD`;

            await send({ text });

        } catch (err) {
            console.log("Menu error:", err);
        }
    }
};