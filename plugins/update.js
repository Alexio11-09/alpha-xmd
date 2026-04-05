// © 2026 Alpha (FINAL AUTO-RESTART FIX)

const { updateBot } = require("../library/updater");
const { spawn } = require("child_process");

module.exports = {
    command: "update",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await reply("🔄 Updating bot...");

            await updateBot();

            await reply("✅ Updated successfully!\n♻️ Restarting bot...");

            // 🔥 START NEW BOT PROCESS
            const child = spawn("node", ["index.js"], {
                detached: true,
                stdio: "inherit"
            });

            child.unref(); // let it run independently

            // 🔥 STOP OLD PROCESS
            process.exit(0);

        } catch (err) {
            console.log("Update error:", err);
            reply("❌ Update failed:\n" + err.message);
        }
    }
};