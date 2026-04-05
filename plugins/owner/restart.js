// © 2026 Alpha (Pterodactyl Restart System)

module.exports = {
    command: "restart",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await reply("♻️ Restarting bot...");

            // 🔥 FORCE PANEL RESTART
            setTimeout(() => {
                process.exit(1);
            }, 2000);

        } catch (err) {
            console.log("Restart error:", err);
            reply("❌ Restart failed");
        }
    }
};