// © 2026 Alpha - CLEAN MESSAGE HANDLER (FIXED 💯)

const fs = require("fs");
const path = require("path");
const config = require("./settings/config");

// 🔥 LOAD ALL COMMANDS
const commands = [];

const loadCommands = (dir) => {
    const files = fs.readdirSync(dir);

    for (let file of files) {
        const fullPath = path.join(dir, file);

        if (fs.lstatSync(fullPath).isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith(".js")) {
            try {
                delete require.cache[require.resolve(fullPath)];
                const cmd = require(fullPath);

                if (cmd.command) {
                    commands.push(cmd);
                }

            } catch (e) {
                console.log("❌ Command load error:", file);
            }
        }
    }
};

loadCommands(path.join(__dirname, "plugins"));

// 🔥 CLEAN FUNCTION
const clean = (jid) => jid?.split("@")[0];

module.exports = async (sock, m) => {
    try {
        if (!m.text) return;

        const prefix = ".";

        if (!m.text.startsWith(prefix)) return;

        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.find(cmd => cmd.command === commandName);
        if (!command) return;

        // 🔥 FIX OWNER CHECK
        const isOwner = clean(m.sender) === clean(config.owner);

        // 🔥 HELPER FUNCTIONS
        const reply = (text) => sock.sendMessage(m.chat, { text }, { quoted: m });

        const send = (data) => sock.sendMessage(m.chat, data, { quoted: m });

        // 🔥 CONTEXT OBJECT
        const context = {
            args,
            reply,
            send,
            isOwner
        };

        // 🔥 OWNER PROTECTION (OPTIONAL)
        if (command.category === "owner" && !isOwner) {
            return reply("❌ Owner only command");
        }

        // 🚀 EXECUTE COMMAND
        await command.execute(sock, m, context);

    } catch (err) {
        console.log("🔥 MESSAGE ERROR:", err);
        await sock.sendMessage(m.chat, { text: "❌ Error occurred" }, { quoted: m });
    }
};