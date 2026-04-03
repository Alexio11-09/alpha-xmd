const fs = require('fs');
const settingsPath = './database/settings.json';

module.exports = {
    command: "status",
    category: "owner",
    owner: true,

    execute: async (sock, m, { reply }) => {
        let s = JSON.parse(fs.readFileSync(settingsPath));

        let text = `⚙️ *BOT STATUS*\n\n` +
        `👁️ Auto Read: ${s.autoread ? "ON" : "OFF"}\n` +
        `⌨️ Typing: ${s.typing ? "ON" : "OFF"}\n` +
        `❤️ Auto React: ${s.autoreact ? "ON" : "OFF"}\n` +
        `🛡️ Anti Delete: ${s.antidelete ? "ON" : "OFF"}\n` +
        `🤖 Mode: ${s.mode.toUpperCase()}`;

        reply(text);
    }
};