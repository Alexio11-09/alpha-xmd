// © 2026 Alpha - CLEAN MENU (REAL SETTINGS)

const config = require("../settings/config");
const fs = require("fs");
const path = require("path");

const settingsPath = './database/settings.json';

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

            let text = `╭─〔 ${config.settings.title} 〕\n│\n`;

            text += `│ ⚡ GENERAL\n`;
            text += `│ • alive • ping\n│\n`;

            text += `│ 🎧 DOWNLOADER\n`;
            text += `│ • play • video\n│\n`;

            text += `│ 👥 GROUP\n`;
            text += `│ • tagall\n│\n`;

            text += `│ 👑 OWNER\n`;
            text += `│ • mode • status • update\n│\n`;

            const ON = "ON ✅";
            const OFF = "OFF ❌";

            text += `│ ⚙️ SETTINGS\n`;
            text += `│ • Autoread: ${settings.autoread ? ON : OFF}\n`;
            text += `│ • Typing: ${settings.typing ? ON : OFF}\n`;
            text += `│ • React: ${settings.autoreact ? ON : OFF}\n`;
            text += `│ • Antidelete: ${settings.antidelete ? `ON (${settings.antidelete_mode})` : OFF}\n`;
            text += `│ • Ignore Admins: ${settings.ignore_admins ? ON : OFF}\n`;
            text += `│\n`;

            text += `╰─⚡ Powered by Alpha-XMD`;

            await send({ text });

        } catch (err) {
            console.log("Menu error:", err);
        }
    }
};