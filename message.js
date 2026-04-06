// © 2026 Alpha - CLEAN MESSAGE HANDLER

const fs = require("fs");
const path = require("path");
const config = require("./settings/config");

// 🔥 LOAD COMMANDS
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

            } catch (err) {
                console.log("❌ Failed to load:", file);
            }
        }
    }
};

loadCommands(path.join(__dirname, "plugins"));

// 🔥 CLEAN NUMBER FUNCTION (VERY IMPORTANT)
const clean = (jid) => {
    if (!jid) return "";

    try {
        return jid.toString().split("@")[0];
    } catch {
        return "";
    }
};

module.exports = async (sock, m) => {
    try {
        if (!m.text) return;

        const prefix = ".";
        if (!m.text.startsWith(prefix)) return;

        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.find(cmd => cmd.command === commandName);
        if (!command) return;

        // ✅ OWNER FIX (SAFE)
        const isOwner = clean(m.sender) === clean(config.owner);

        // 🔥 HELPERS
        const reply = (text) =>
            sock.sendMessage(m.chat, { text }, { quoted: m });

        const send = (data) =>
            sock.sendMessage(m.chat, data, { quoted: m });

        // 🔥 CONTEXT (WE WILL EXPAND LATER)
        const context = {
            args,
            reply,
            send,
            isOwner
        };

        // 🔒 OWNER PROTECTION
        if (command.owner && !isOwner) {
            return reply("❌ Owner only command");
        }

        // 🚀 EXECUTE COMMAND
        await command.execute(sock, m, context);

    } catch (err) {
        console.log("🔥 MESSAGE ERROR:", err);
        await sock.sendMessage(
            m.chat,
            { text: "❌ Error occurred" },
            { quoted: m }
        );
    }
};