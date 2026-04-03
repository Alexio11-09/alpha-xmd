// © 2026 Alpha

const { updateBot } = require("../../library/updater");

module.exports = {
    command: "update",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            reply("🔄 Updating bot...");

            await updateBot();

            reply("✅ Updated! Restarting...");
            process.exit(0);

        } catch (err) {
            reply("❌ Update failed:\n" + err);
        }
    }
};