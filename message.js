// © 2026 Alpha - FINAL MESSAGE HANDLER (PUBLIC + BRANDING + ANTIBADWORD + ANTILINK)

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

// 🔥 BAD WORD FILTER (GLOBAL + GROUP)
const bwPath = './database/badwords.json';
const globalBwPath = './database/badwords_global.json';
try {
    if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
    if (!fs.existsSync(bwPath)) fs.writeFileSync(bwPath, '{}');
    if (!fs.existsSync(globalBwPath)) fs.writeFileSync(globalBwPath, '[]');
} catch {}
const loadGlobalBadWords = () => {
    try {
        const data = fs.readFileSync(globalBwPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};
const getGroupBadWordsConfig = (chatId) => {
    try {
        const data = JSON.parse(fs.readFileSync(bwPath));
        return data[chatId] || { enabled: false, words: [] };
    } catch {
        return { enabled: false, words: [] };
    }
};
const containsBadWord = (text, chatId) => {
    const cfg = getGroupBadWordsConfig(chatId);
    if (!cfg.enabled) return false;
    const globalWords = loadGlobalBadWords();
    const groupWords = cfg.words || [];
    const allWords = [...globalWords, ...groupWords];
    const lowerText = text.toLowerCase();
    return allWords.some(word => lowerText.includes(word.toLowerCase()));
};

// 🔥 LINK DETECTION
const containsLink = (text) => {
    const urlRegex = /https?:\/\/[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+/gi;
    return urlRegex.test(text);
};

// 🔥 GROUP SETTINGS READER (for antilink/welcome/goodbye)
const dbPath = './database/groupSettings.json';
try {
    if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
    fs.writeFileSync(dbPath, '{}', { flag: 'a' });
} catch {
    // fallback handled later
}
const getGroupSettings = (chatId) => {
    try {
        const all = JSON.parse(fs.readFileSync(dbPath));
        return all[chatId] || {};
    } catch {
        return {};
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

// ==================== FUNNY DENIAL MESSAGES ====================
const denyMessages = {
    owner: [
        "😂 Nice try, but only the bot owner can do that. You're still a prince, not the king! 👑",
        "🤴 Sorry, this command is reserved for the royal highness. Maybe one day you'll inherit the throne.",
        "🏰 The owner's chamber is locked to you. Come back when you own this place.",
        "👑 You must be the chosen one. Right now, you're just a humble user. Try again when you level up!",
        "😎 This is a VIP area. Your name isn't on the list… wait, there is no list. Only the owner gets in!"
    ],
    admin: [
        "🚫 Access denied. You need a shiny admin badge to use this. No badge, no entry!",
        "👮‍♂️ This area is for VIPs only. You're on the guest list… just kidding, you're not.",
        "🎫 You must be this tall to ride. Actually, you just need to be an admin.",
        "😎 Cool command, but only admins can flex with it.",
        "🙅‍♂️ Stop right there! Only admins can open this door. Try again when you get promoted.",
        "🧢 Nope, only admins wear the big hat. Come back with a bigger hat."
    ],
    group: [
        "👥 This command only works in groups. You're in a private chat, lonely soul!",
        "🗣️ You need an audience for this. Step into a group and try again.",
        "🏟️ This action requires a crowd. Move to a group chat to use it.",
        "🤷 You're all alone here. Invite some friends and come back to a group!"
    ],
    botAdmin: [
        "🤖 I'd love to help, but I'm not an admin here. Ask the group owner to promote me first!",
        "😢 I feel powerless without admin rights. Please give me the crown 👑",
        "🛑 I can't do that until someone makes me admin. I promise I'll be responsible.",
        "⚡ I need admin powers to execute that. Currently I'm just a humble servant.",
        "😭 I tried, but I got blocked by the WhatsApp bouncer. Make me admin to unlock this."
    ],
    banned: [
        "🚫 You've been banished! Wait… you're banned. Contact the owner if you think this is a mistake.",
        "🔒 You're locked out of the bot. The owner holds the key – go ask nicely.",
        "😬 Banned users aren't allowed to play. You're temporarily in bot jail."
    ]
};
function randomDeny(type) {
    const msgs = denyMessages[type];
    return msgs[Math.floor(Math.random() * msgs.length)];
}

// ==================== RANDOM REACTION EMOJIS ====================
const reactionEmojis = ["😂", "❤️", "🔥", "👍", "🎉", "🤔", "😮", "💯", "👀", "🥳", "⚡", "😎"];
async function reactRandom(sock, msg) {
    try {
        const emoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: emoji, key: msg.key }
        });
    } catch {}
}

// ==================== FUNNY ERROR MESSAGES ====================
const funnyErrors = [
    "🤖 Beep boop… something glitched. Try again, human.",
    "💥 I broke a bit. Don't worry, I'll reboot my sense of humor.",
    "😵 My bad. A wild bug appeared. Try that command again.",
    "😬 I tried, but the universe said NO. One more time?",
    "👾 Error 404: Dignity not found. But seriously, try again."
];

// ==================== BAD WORD & LINK WARNINGS ====================
const badWordWarnings = [
    "🤬 Watch your language, @user! That word is banned here.",
    "🚫 Oops! @user said a no‑no word. Keep it clean.",
    "🧼 Language! @user, we don't use that word in this group.",
    "😡 Hey @user, the bad‑word filter caught that. Be nice!",
    "👮‍♂️ @user, you've been warned. That word is not allowed."
];

const antilinkWarnings = {
    delete: [
        "🔗 Links are not allowed here, @user. Your message was deleted.",
        "🚫 @user, no links allowed. Keep the chat clean!",
        "⚠️ @user, links are forbidden. Message removed."
    ],
    warn: [
        "⚠️ @user, please do not send links. This is a warning.",
        "🔗 @user, links are not permitted in this group. Be careful!",
        "🚫 @user, you've been warned about posting links."
    ],
    kick: [
        "👢 @user has been kicked for sending links.",
        "🚪 @user was removed for violating the no‑link rule.",
        "🦵 @user got the boot – links are a no‑go."
    ]
};

// ==================== MAIN MESSAGE HANDLER ====================
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
        const reply = (text, extra = {}) => {
            try {
                return sock.sendMessage(m.chat, { text, contextInfo, ...extra }, { quoted: m });
            } catch {
                return sock.sendMessage(m.chat, { text, ...extra }, { quoted: m });
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

        // ================== NON-COMMAND MESSAGE FILTERS ==================
        const prefix = config.prefix || ".";
        if (!m.text.startsWith(prefix)) {

            // --- ANTIBADWORD ---
            if (m.isGroup && m.text && containsBadWord(m.text, m.chat)) {
                if (m.isBotAdmin) {
                    try { await sock.sendMessage(m.chat, { delete: m.key }); } catch {}
                }
                const warning = badWordWarnings[Math.floor(Math.random() * badWordWarnings.length)]
                    .replace('@user', `@${m.sender.split('@')[0]}`);
                try {
                    await sock.sendMessage(m.chat, { text: warning, contextInfo, mentions: [m.sender] }, { quoted: m });
                } catch {
                    await sock.sendMessage(m.chat, { text: warning, mentions: [m.sender] });
                }
                return;
            }

            // --- ANTILINK ---
            if (m.isGroup && m.text) {
                const groupSettings = getGroupSettings(m.chat);
                if (groupSettings.antilink) {
                    const mode = groupSettings.antilinkMode || 'admins';
                    const action = groupSettings.antilinkAction || 'delete';

                    // Determine if sender is allowed based on mode
                    let allowed = false;
                    if (mode === 'owner') {
                        try {
                            const meta = await sock.groupMetadata(m.chat);
                            allowed = (meta.owner === m.sender);
                        } catch { allowed = false; }
                    } else { // admins
                        allowed = m.isAdmin;
                    }

                    if (!allowed && containsLink(m.text)) {
                        // Enforce action
                        if (action === 'delete') {
                            if (m.isBotAdmin) {
                                try { await sock.sendMessage(m.chat, { delete: m.key }); } catch {}
                            } else {
                                // Bot not admin – tag owner to request promotion
                                try {
                                    const meta = await sock.groupMetadata(m.chat);
                                    const ownerId = meta.owner;
                                    const ownerTag = `@${ownerId.split('@')[0]}`;
                                    await sock.sendMessage(m.chat, {
                                        text: `🙏 ${ownerTag} Please make me an admin so I can delete links automatically.`,
                                        mentions: [ownerId],
                                        contextInfo
                                    }, { quoted: m });
                                } catch {}
                            }
                            const warn = antilinkWarnings.delete[Math.floor(Math.random() * antilinkWarnings.delete.length)]
                                .replace('@user', `@${m.sender.split('@')[0]}`);
                            await sock.sendMessage(m.chat, { text: warn, mentions: [m.sender], contextInfo }, { quoted: m });
                        } else if (action === 'warn') {
                            const warn = antilinkWarnings.warn[Math.floor(Math.random() * antilinkWarnings.warn.length)]
                                .replace('@user', `@${m.sender.split('@')[0]}`);
                            await sock.sendMessage(m.chat, { text: warn, mentions: [m.sender], contextInfo }, { quoted: m });
                        } else if (action === 'kick') {
                            if (m.isBotAdmin) {
                                try {
                                    await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
                                    const msg = antilinkWarnings.kick[Math.floor(Math.random() * antilinkWarnings.kick.length)]
                                        .replace('@user', `@${m.sender.split('@')[0]}`);
                                    await sock.sendMessage(m.chat, { text: msg, mentions: [m.sender], contextInfo }, { quoted: m });
                                } catch {}
                            } else {
                                // Not admin – cannot kick, request promotion
                                try {
                                    const meta = await sock.groupMetadata(m.chat);
                                    const ownerId = meta.owner;
                                    await sock.sendMessage(m.chat, {
                                        text: `🙏 @${ownerId.split('@')[0]} Please make me an admin so I can kick link spammers.`,
                                        mentions: [ownerId],
                                        contextInfo
                                    }, { quoted: m });
                                } catch {}
                            }
                        }
                        return; // stop further processing
                    }
                }
            }

            return; // not a command
        }

        // ================== COMMAND PROCESSING ==================
        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.find(cmd => cmd.command === commandName || (cmd.aliases && cmd.aliases.includes(commandName)));
        if (!command) return;

        // React with a random emoji
        await reactRandom(sock, m);

        // Owner system
        const botNumber = clean(sock.user.id);
        const senderNumber = clean(m.sender);
        const isMainOwner = config.owner.includes(senderNumber) || senderNumber === botNumber;
        const tempOwner = isTempOwner(m.sender);
        const isOwner = isMainOwner || tempOwner;

        // Ban check
        if (commandName !== 'unbanuser' && commandName !== 'unban' && isUserBanned(m.sender) && !isOwner) {
            return reply(randomDeny('banned'));
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

        // Denial handlers
        if (command.owner && !isOwner) return reply(randomDeny('owner'));
        if (command.group && !m.isGroup) return reply(randomDeny('group'));
        if (command.admin && !m.isAdmin) return reply(randomDeny('admin'));

        await command.execute(sock, m, context);

    } catch (err) {
        console.log("🔥 MESSAGE ERROR:", err);
        try {
            await sock.sendMessage(m.chat, { text: funnyErrors[Math.floor(Math.random() * funnyErrors.length)] }, { quoted: m });
        } catch {}
    }
};

module.exports.games = games;