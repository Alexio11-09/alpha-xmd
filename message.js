// © 2026 Alpha - FINAL MESSAGE HANDLER (PUBLIC + BRANDING 💯)

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

                if (Array.isArray(cmd)) {
                    commands.push(...cmd);
                } else if (cmd.command) {
                    commands.push(cmd);
                }

            } catch (err) {
                console.log("❌ Failed to load:", file);
                console.log("   Error:", err.message);
                console.log("   Stack:", err.stack);
            }
        }
    }
};

loadCommands(path.join(__dirname, "plugins"));
console.log("📦 Total commands loaded:", commands.length);
console.log("📋 Commands:", commands.map(c => c.command).join(", "));

// 🔥 CLEAN NUMBER
const clean = (jid) => {
    if (!jid) return "";
    try {
        return jid.toString().replace(/[^0-9]/g, "");
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

        // 🔥 OWNER SYSTEM
        const botNumber = clean(sock.user.id);
        const senderNumber = clean(m.sender);

        const isOwner =
            config.owner.includes(senderNumber) ||
            senderNumber === botNumber;

        // 🔥 CHANNEL BRANDING
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.newsletter.id + "@newsletter",
                newsletterName: config.newsletter.name
            }
        };

        // 🔥 HELPERS
        const reply = (text) =>
            sock.sendMessage(
                m.chat,
                { text, contextInfo },
                { quoted: m }
            );

        const send = (data) =>
            sock.sendMessage(
                m.chat,
                { ...data, contextInfo },
                { quoted: m }
            );

        // ✅ UPDATED CONTEXT (THIS FIXES YOUR ERROR)
        const context = {
            args,
            reply,
            send,
            isOwner,
            isGroup: m.isGroup,
            isAdmin: m.isAdmin,
            isBotAdmin: m.isBotAdmin,
            config,     // 🔥 FIX
            prefix      // 🔥 FIX
        };

        // 🔒 OWNER ONLY
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