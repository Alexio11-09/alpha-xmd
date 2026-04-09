// © 2026 Alpha - FINAL MESSAGE HANDLER (PUBLIC + BRANDING 💯)

const fs = require("fs");
const path = require("path");
const config = require("./settings/config");

// 🔥 LOAD COMMANDS
const commands = [];

const loadCommands = (dir) => {
    if (!fs.existsSync(dir)) {
        console.log(`❌ Directory not found: ${dir}`);
        return;
    }
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
                console.log("❌ Failed to load:", file, err.message);
            }
        }
    }
};

loadCommands(path.join(__dirname, "plugins"));
console.log(`📦 Total commands loaded: ${commands.length}`);

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
        // 🔥 CHANNEL BRANDING (NEWSLETTER STYLE)
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.newsletter.id + "@newsletter",
                newsletterName: config.newsletter.name
            }
        };

        // 🔥 HELPER WITH BRANDING
        const reply = (text) => {
            try {
                return sock.sendMessage(m.chat, { text, contextInfo }, { quoted: m });
            } catch {
                return sock.sendMessage(m.chat, { text }, { quoted: m });
            }
        };

        if (!m.text) return;

        const prefix = config.prefix || ".";
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

        // 🔥 HELPERS WITH BRANDING
        const send = (data) => {
            try {
                return sock.sendMessage(m.chat, { ...data, contextInfo }, { quoted: m });
            } catch {
                return sock.sendMessage(m.chat, data, { quoted: m });
            }
        };

        // ✅ CONTEXT
        const context = {
            args,
            reply,
            send,
            isOwner,
            isGroup: m.isGroup,
            isAdmin: m.isAdmin,
            isBotAdmin: m.isBotAdmin,
            config,
            prefix
        };

        // 🔒 OWNER ONLY
        if (command.owner && !isOwner) {
            return reply(config.message.owner || "❌ Owner only!");
        }

        // 🔒 GROUP ONLY
        if (command.group && !m.isGroup) {
            return reply(config.message.group || "❌ Group only!");
        }

        // 🔒 ADMIN ONLY
        if (command.admin && !m.isAdmin) {
            return reply(config.message.admin || "❌ Admin only!");
        }

        // 🔒 BOT ADMIN REQUIRED
        if (command.botAdmin && !m.isBotAdmin) {
            return reply("❌ Bot needs admin rights.");
        }

        // 🚀 EXECUTE
        await command.execute(sock, m, context);

    } catch (err) {
        console.log("🔥 MESSAGE ERROR:", err);
        try {
            await sock.sendMessage(m.chat, { text: "❌ Error occurred" }, { quoted: m });
        } catch {}
    }
};