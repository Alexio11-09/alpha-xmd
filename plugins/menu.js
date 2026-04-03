// © 2026 Alpha

const config = require("../settings/config");

module.exports = {
    command: "menu",
    description: "Show bot menu",
    category: "general",

    execute: async (sock, m, { send }) => {
        try {

            const menu = `
╔═══〔 ${config.settings.title} 〕═══⬣
║
║ ⚡ *GENERAL*
║ • .ping
║ • .menu
║
║ 🎧 *DOWNLOADER*
║ • .play <song>
║ • .video <video>
║
║ ⚙️ *SETTINGS*
║ • .toggle autoread
║ • .toggle typing
║ • .toggle react
║
║ 👑 *OWNER*
║ • .update
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