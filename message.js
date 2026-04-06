// © 2026 Alpha - FINAL MESSAGE HANDLER (STABLE 💯)

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

                // ✅ SUPPORT MULTIPLE EXPORTS
                if (Array.isArray(cmd)) {
                    commands.push(...cmd);
                } else if (cmd.command) {
                    commands.push(cmd);
                }

            } catch (err) {
                console.log("❌ Failed to load:", file);
            }
        }
    }
};

loadCommands(path.join(__dirname, "plugins"));

// 🔥 CLEAN NUMBER FUNCTION
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

        // ✅ OWNER FIX (ARRAY SUPPORT)
        const isOwner = config.owner.includes(clean(m.sender));

        // 🔥 HELPERS
        const reply = (text) =>
            sock.sendMessage(m.chat, { text }, { quoted: m });

        const send = (data) =>
            sock.sendMessage(m.chat, data, { quoted: m });

        // 🔥 CONTEXT
        const context = {
            args,
            reply,
            send,
            isOwner,
            isGroup: m.isGroup,
            isAdmin: m.isAdmin,
            isBotAdmin: m.isBotAdmin
        };

        // 🔒 OWNER PROTECTION
        if (command.owner && !isOwner) {
            return reply(config.message.owner);
        }

        // 🔒 GROUP ONLY
        if (command.group && !m.isGroup) {
            return reply(config.message.group);
        }

        // 🔒 ADMIN ONLY
        if (command.admin && !m.isAdmin) {
            return reply(config.message.admin);
        }

        // 🔒 BOT ADMIN REQUIRED
        if (command.botAdmin && !m.isBotAdmin) {
            return reply("❌ Bot needs admin rights.");
        }

        // 🚀 EXECUTE
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