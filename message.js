// © 2026 Alpha - FINAL MESSAGE HANDLER (PUBLIC + BRANDING 💯)

const fs = require("fs");
const path = require("path");
const config = require("./settings/config");

// 🔥 CLEAN NUMBER
const clean = (jid) => {
    if (!jid) return "";
    try {
        return jid.toString().replace(/[^0-9]/g, "");
    } catch {
        return "";
    }
};

// 🔥 CHECK IF USER IS BANNED
const isUserBanned = (sender) => {
    try {
        const banPath = './database/banned.json';
        if (!fs.existsSync(banPath)) {
            if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
            fs.writeFileSync(banPath, '{}');
            return false;
        }
        const banned = JSON.parse(fs.readFileSync(banPath));
        const senderNum = clean(sender);
        return banned[senderNum] ? true : false;
    } catch {
        return false;
    }
};

// 🔥 CHECK IF USER IS TEMP OWNER
const isTempOwner = (sender) => {
    try {
        const ownerPath = './database/owners.json';
        if (!fs.existsSync(ownerPath)) {
            if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
            fs.writeFileSync(ownerPath, JSON.stringify({ tempOwners: [] }, null, 2));
            return false;
        }
        const owners = JSON.parse(fs.readFileSync(ownerPath));
        const senderNum = clean(sender);
        return owners.tempOwners && owners.tempOwners.includes(senderNum);
    } catch {
        return false;
    }
};

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
                console.log(`❌ Failed to load ${file}:`, err.message);
            }
        }
    }
};

loadCommands(path.join(__dirname, "plugins"));
console.log(`📦 Total commands loaded: ${commands.length}`);

// 🔥 GAME STORAGE
const games = {
    tictactoe: {},
    guess: {},
    quiz: {},
    riddle: {}
};

module.exports = async (sock, m) => {
    try {
        // 🔥 CHANNEL BRANDING
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.newsletter.id + "@newsletter",
                newsletterName: config.newsletter.name
            }
        };

        const reply = (text) => {
            try {
                return sock.sendMessage(m.chat, { text, contextInfo }, { quoted: m });
            } catch {
                return sock.sendMessage(m.chat, { text }, { quoted: m });
            }
        };

        const send = (data) => {
            try {
                return sock.sendMessage(m.chat, { ...data, contextInfo }, { quoted: m });
            } catch {
                return sock.sendMessage(m.chat, data, { quoted: m });
            }
        };

        if (!m.text) return;

        const prefix = config.prefix || ".";
        if (!m.text.startsWith(prefix)) return;

        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.find(cmd => cmd.command === commandName || (cmd.aliases && cmd.aliases.includes(commandName)));
        if (!command) return;

        // 🔥 OWNER SYSTEM
        const botNumber = clean(sock.user.id);
        const senderNumber = clean(m.sender);
        const isMainOwner = config.owner.includes(senderNumber) || senderNumber === botNumber;
        const tempOwner = isTempOwner(m.sender);
        const isOwner = isMainOwner || tempOwner;

        // 🔥 BAN CHECK
        if (commandName !== 'unbanuser' && commandName !== 'unban' && isUserBanned(m.sender) && !isOwner) {
            return reply("🚫 *You are banned from using this bot!*");
        }

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

        if (command.owner && !isOwner) return reply("❌ Owner only!");
        if (command.group && !m.isGroup) return reply("❌ Group only!");
        if (command.admin && !m.isAdmin) return reply("❌ Admin only!");

        await command.execute(sock, m, context);

    } catch (err) {
        console.log("🔥 MESSAGE ERROR:", err);
        try {
            await sock.sendMessage(m.chat, { text: "❌ Error occurred" }, { quoted: m });
        } catch {}
    }
};

module.exports.games = games;