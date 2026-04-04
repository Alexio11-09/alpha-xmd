const { updateBot } = require("../library/updater");

module.exports = {
    command: "update",
    owner: true,

    execute: async (sock, m, { reply, isCreator }) => {
        if (!isCreator) return reply("❌ Owner only");

        try {
            await reply("🔄 Updating bot...");

            await updateBot();

            await reply("✅ Updated! Restarting...");
            process.exit(0);

        } catch (err) {
            reply("❌ Update failed:\n" + err.message);
        }
    }
};