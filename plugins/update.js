// © 2026 Alpha (AUTO UPDATE + RESTART)

const { updateBot } = require("../library/updater");

module.exports = {
    command: "update",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await reply("🔄 Updating bot...");

            await updateBot();

            await reply("✅ Updated!\n♻️ Restarting...");

            // 🔥 TRIGGER PANEL AUTO-RESTART
            setTimeout(() => {
                process.exit(1);
            }, 2000);

        } catch (err) {
            console.log("Update error:", err);
            reply("❌ Update failed:\n" + err.message);
        }
    }
};