// © 2026 Alpha (SAFE UPDATE FIX)

const { updateBot } = require("../library/updater");

module.exports = {
    command: "update",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await reply("🔄 Updating bot...");

            const result = await updateBot();

            if (result === false) {
                return reply("❌ Update failed");
            }

            await reply("✅ Update complete!\n♻️ Restarting bot...");

            // 🔥 SAFE RESTART DELAY
            setTimeout(() => {
                process.exit(0);
            }, 4000);

        } catch (err) {
            console.log("Update error:", err);
            reply("❌ Update failed:\n" + err.message);
        }
    }
};