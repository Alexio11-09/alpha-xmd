// © 2026 Alpha

const { updateBot } = require("../library/updater");

module.exports = {
    command: "update",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await reply("🔄 Updating bot...");

            await updateBot();

            await reply("✅ Updated! Restarting...");

            setTimeout(() => process.exit(0), 2000);

        } catch (err) {
            reply("❌ Update failed:\n" + err.message);
        }
    }
};