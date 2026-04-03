// © 2026 Alpha

const { updateBot } = require("../../library/updater");

module.exports = {
    command: "update",
    description: "Update bot from GitHub",
    category: "owner",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await reply("🔄 *Updating bot...*\nPlease wait...");

            // 🔥 RUN UPDATER
            const result = await updateBot();

            if (!result) {
                return reply("❌ Update failed (no response)");
            }

            await reply("✅ *Update completed!*\nRestarting bot...");

            // 🔄 RESTART BOT (IMPORTANT FOR PANEL)
            process.exit(0);

        } catch (err) {
            console.log("Update error:", err);
            reply("❌ Update failed:\n" + err.message);
        }
    }
};