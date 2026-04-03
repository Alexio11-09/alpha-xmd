const { execSync } = require("child_process");

module.exports = {
    command: 'update',
    description: 'Update bot from GitHub',
    category: 'owner',
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            await sock.sendMessage(m.chat, { 
                react: { text: "⚡", key: m.key } 
            });

            reply("🔄 Updating from GitHub repo...");

            // 🔥 force latest version from YOUR repo
            execSync("git fetch origin", { stdio: "inherit" });
            execSync("git reset --hard origin/main", { stdio: "inherit" });

            reply("📦 Installing dependencies...");
            execSync("npm install", { stdio: "inherit" });

            reply("♻️ Restarting bot...");
            
            process.exit();

        } catch (err) {
            console.log(err);
            reply("❌ Update failed:\n" + err.message);
        }
    }
};