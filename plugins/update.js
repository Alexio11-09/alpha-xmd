const { updateBot } = require("../../library/updater");

module.exports = {
    command: "update",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await reply("🔄 Updating...");

            await updateBot();

            await reply("✅ Done! Restarting...");

            setTimeout(() => process.exit(0), 2000);

        } catch (err) {
            reply("❌ Update failed:\n" + err.message);
        }
    }
};