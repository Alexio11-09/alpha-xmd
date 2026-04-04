// © 2026 Alpha

const fs = require('fs');
const settingsPath = './database/settings.json';

module.exports = {
    command: "status",
    category: "owner", // ✅ shows in menu under OWNER
    owner: true,

    execute: async (sock, m, context) => {
        const { reply, isCreator } = context;

        try {
            // 🔐 OWNER CHECK (extra safety)
            if (!isCreator) {
                return reply("❌ Owner only command");
            }

            let s;

            // 🔥 SAFE READ (no crash if file missing)
            try {
                s = JSON.parse(fs.readFileSync(settingsPath));
            } catch {
                s = {
                    autoread: false,
                    typing: false,
                    autoreact: false,
                    antidelete: false,
                    mode: "public"
                };
            }

            let text = `⚙️ *BOT STATUS*\n\n` +
            `👁️ Auto Read: ${s.autoread ? "ON" : "OFF"}\n` +
            `⌨️ Typing: ${s.typing ? "ON" : "OFF"}\n` +
            `❤️ Auto React: ${s.autoreact ? "ON" : "OFF"}\n` +
            `🛡️ Anti Delete: ${s.antidelete ? "ON" : "OFF"}\n` +
            `🤖 Mode: ${s.mode.toUpperCase()}`;

            reply(text);

        } catch (err) {
            console.log("Status error:", err);
            reply("❌ Failed to get status");
        }
    }
};