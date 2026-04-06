// © 2026 Alpha - FINAL MESSAGE HANDLER (STABLE 💯 + AUTOREACT UPGRADE)

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

            } catch (e) {
                console.log("❌ Command load error:", file);
            }
        }
    }
};

loadCommands(path.join(__dirname, "plugins"));

// 🔥 FINAL CLEAN FUNCTION (NO ERRORS EVER)
const clean = (jid) => {
    try {
        if (!jid) return "";

        jid = jid.toString();

        if (jid.includes("@")) {
            return jid.split("@")[0];
        }

        return jid;

    } catch {
        return "";
    }
};

module.exports = async (sock, m) => {
    try {

        // 🔥 LOAD SETTINGS ON EVERY MESSAGE
        const settings = JSON.parse(fs.readFileSync("./database/settings.json"));

        // 😈 MULTI EMOJI AUTOREACT (SAFE ADDITION)
        if (settings.autoreact && m.key && m.message) {
            try {
                const emojis = [
                    "😂","🔥","❤️","😎","💀","🥶","😈","✨","🤖","⚡",
                    "😍","😹","🙌","💯","🎉","😏","🤍","😜","🧠","🥵"
                ];

                const emoji = emojis[Math.floor(Math.random() * emojis.length)];

                await sock.sendMessage(m.chat, {
                    react: {
                        text: emoji,
                        key: m.key
                    }
                });

            } catch (e) {
                console.log("Autoreact error:", e);
            }
        }

        // 🔒 DON'T BREAK NON-COMMAND MESSAGES
        if (!m.text) return;

        const prefix = ".";
        if (!m.text.startsWith(prefix)) return;

        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.find(cmd => cmd.command === commandName);
        if (!command) return;

        // 🔥 OWNER FIX
        const isOwner = clean(m.sender) === clean(config.owner);

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
            isOwner
        };

        // 🔥 OWNER PROTECTION
        if (command.category === "owner" && !isOwner) {
            return reply("❌ Owner only command");
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