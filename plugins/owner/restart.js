// © 2026 Alpha (FIXED + GUARANTEED LOAD)

module.exports = {
    command: "restart",
    description: "Restart the bot",
    category: "owner",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await reply("♻️ Restarting bot...");

            setTimeout(() => {
                process.exit(1);
            }, 2000);

        } catch (err) {
            console.log("Restart error:", err);
            reply("❌ Restart failed");
        }
    }
};