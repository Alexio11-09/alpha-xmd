// © 2026 Alpha

module.exports = {
    command: "status",
    description: "Show bot status",
    category: "owner",
    owner: true,

    execute: async (sock, m, { reply, settings }) => {
        try {

            // 🔥 USE LIVE SETTINGS (no file read)
            const s = settings;

            let text = `⚙️ *BOT STATUS*\n\n` +
                `👁️ Auto Read: ${s.autoread ? "ON" : "OFF"}\n` +
                `⌨️ Typing: ${s.typing ? "ON" : "OFF"}\n` +
                `❤️ Auto React: ${s.autoreact ? "ON" : "OFF"}\n` +
                `🛡️ Anti Delete: ${s.antidelete ? "ON" : "OFF"}\n` +
                `🤖 Mode: ${(s.mode || "public").toUpperCase()}\n\n` +
                `⚡ Bot: ACTIVE`;

            reply(text);

        } catch (err) {
            console.log("Status error:", err);
            reply("❌ Failed to get status");
        }
    }
};