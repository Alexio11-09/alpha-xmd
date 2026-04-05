// © 2026 Alpha - FINAL CLEAN MENU (COMMAND GUIDE)

const config = require("../settings/config");

module.exports = {
    command: "menu",
    description: "Show bot menu",
    category: "general",

    execute: async (sock, m, { send }) => {
        try {

            let text = `╭─〔 ${config.settings.title} 〕\n│\n`;

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
            text += `│ • .update\n│\n`;

            // ⚙️ SETTINGS (REAL COMMAND GUIDE 🔥)
            text += `│ ⚙️ SETTINGS\n`;
            text += `│ • .toggle autoread on/off\n`;
            text += `│ • .toggle typing on/off\n`;
            text += `│ • .toggle react on/off\n`;
            text += `│ • .toggle antidelete on/off\n`;
            text += `│ • .toggle antidelete chat/dm/both\n`;
            text += `│ • .toggle ignoreadmins on/off\n`;
            text += `│\n`;

            text += `╰─⚡ Powered by Alpha-XMD`;

            await send({ text });

        } catch (err) {
            console.log("Menu error:", err);
        }
    }
};