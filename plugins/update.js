const { execSync } = require("child_process");
const fs = require("fs");

let autoUpdateInterval = null;

module.exports = {
    command: 'update',
    description: 'Update system',
    category: 'owner',
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        try {
            const sub = args[0];

            await sock.sendMessage(m.chat, { 
                react: { text: "⚡", key: m.key } 
            });

            // ===============================
            // 🔥 NORMAL UPDATE
            // ===============================
            if (!sub) {
                reply("🔄 Updating bot...");

                execSync("git fetch origin", { stdio: "inherit" });
                execSync("git reset --hard origin/main", { stdio: "inherit" });

                reply("📦 Installing packages...");
                execSync("npm install", { stdio: "inherit" });

                reply("♻️ Restarting...");
                process.exit();
            }

            // ===============================
            // 📜 UPDATE LOG
            // ===============================
            if (sub === "log") {
                const log = execSync("git log -5 --pretty=format:'%h - %an: %s'").toString();
                return reply(`📜 Last Updates:\n\n${log}`);
            }

            // ===============================
            // 🔙 ROLLBACK
            // ===============================
            if (sub === "rollback") {
                reply("⏪ Rolling back to previous version...");

                execSync("git reset --hard HEAD~1", { stdio: "inherit" });
                execSync("npm install", { stdio: "inherit" });

                reply("♻️ Restarting after rollback...");
                process.exit();
            }

            // ===============================
            // 🤖 AUTO UPDATE
            // ===============================
            if (sub === "auto") {
                const state = args[1];

                if (state === "on") {
                    if (autoUpdateInterval) {
                        return reply("⚠️ Auto update already running");
                    }

                    reply("🤖 Auto update enabled (every 10 mins)");

                    autoUpdateInterval = setInterval(() => {
                        try {
                            console.log("🔄 Auto updating...");

                            execSync("git fetch origin");
                            execSync("git reset --hard origin/main");
                            execSync("npm install");

                            console.log("✅ Auto update complete");
                        } catch (err) {
                            console.log("Auto update error:", err.message);
                        }
                    }, 10 * 60 * 1000); // 10 mins
                }

                else if (state === "off") {
                    if (!autoUpdateInterval) {
                        return reply("⚠️ Auto update not running");
                    }

                    clearInterval(autoUpdateInterval);
                    autoUpdateInterval = null;

                    reply("🛑 Auto update disabled");
                }

                else {
                    reply("Usage:\n.update auto on\n.update auto off");
                }
            }

        } catch (err) {
            console.log(err);
            reply("❌ Update system error:\n" + err.message);
        }
    }
};