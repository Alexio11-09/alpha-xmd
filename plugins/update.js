const { execSync } = require("child_process");
const fs = require("fs");

let autoUpdateInterval = null;
let lastCommit = null;

module.exports = {
    command: 'update',
    description: 'Advanced update system',
    category: 'owner',
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        try {
            const sub = args[0];

            await sock.sendMessage(m.chat, { 
                react: { text: "⚡", key: m.key } 
            });

            // ===============================
            // 🔥 SMART UPDATE FUNCTION
            // ===============================
            const runUpdate = async (notify = true) => {
                try {
                    const current = execSync("git rev-parse HEAD").toString().trim();
                    execSync("git fetch origin");
                    const latest = execSync("git rev-parse origin/main").toString().trim();

                    if (current === latest) {
                        if (notify) reply("✅ Already up to date");
                        return false;
                    }

                    // 💾 BACKUP
                    const backupName = `backup-${Date.now()}.zip`;
                    execSync(`zip -r ${backupName} . -x "node_modules/*"`, { stdio: "ignore" });

                    if (notify) reply("💾 Backup created");

                    // 🔄 UPDATE
                    execSync("git reset --hard origin/main", { stdio: "inherit" });

                    if (notify) reply("📦 Installing packages...");
                    execSync("npm install", { stdio: "inherit" });

                    // 📢 NOTIFY
                    if (notify) {
                        await sock.sendMessage(m.chat, {
                            text: "✅ Bot updated successfully 🚀"
                        });
                    }

                    return true;

                } catch (err) {
                    console.log("Update error:", err);
                    if (notify) reply("❌ Update failed:\n" + err.message);
                    return false;
                }
            };

            // ===============================
            // 🔄 MANUAL UPDATE
            // ===============================
            if (!sub) {
                const updated = await runUpdate(true);
                if (updated) {
                    reply("♻️ Restarting...");
                    process.exit();
                }
            }

            // ===============================
            // 📜 LOG
            // ===============================
            if (sub === "log") {
                const log = execSync("git log -5 --pretty=format:'%h - %an: %s'").toString();
                return reply(`📜 Last Updates:\n\n${log}`);
            }

            // ===============================
            // 🔙 ROLLBACK
            // ===============================
            if (sub === "rollback") {
                reply("⏪ Rolling back...");
                execSync("git reset --hard HEAD~1", { stdio: "inherit" });
                execSync("npm install", { stdio: "inherit" });
                reply("♻️ Restarting...");
                process.exit();
            }

            // ===============================
            // 🤖 AUTO UPDATE (SMART)
            // ===============================
            if (sub === "auto") {
                const state = args[1];

                if (state === "on") {
                    if (autoUpdateInterval) {
                        return reply("⚠️ Auto update already running");
                    }

                    reply("🤖 Smart auto-update ON (checks every 10 mins)");

                    autoUpdateInterval = setInterval(async () => {
                        console.log("🔍 Checking for updates...");

                        const updated = await runUpdate(false);

                        if (updated) {
                            console.log("✅ Auto update applied");

                            await sock.sendMessage(m.chat, {
                                text: "🤖 Auto update applied successfully 🚀"
                            });

                            process.exit();
                        }

                    }, 10 * 60 * 1000);
                }

                else if (state === "off") {
                    if (!autoUpdateInterval) {
                        return reply("⚠️ Auto update not running");
                    }

                    clearInterval(autoUpdateInterval);
                    autoUpdateInterval = null;

                    reply("🛑 Auto update OFF");
                }

                else {
                    reply("Usage:\n.update auto on\n.update auto off");
                }
            }

        } catch (err) {
            console.log(err);
            reply("❌ System error:\n" + err.message);
        }
    }
};