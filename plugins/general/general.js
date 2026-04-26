// © 2026 Alpha - GENERAL COMMANDS (ALL 7, INTERACTIVE PAIR)

const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require("../../settings/config");

const R = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ⏱️ RUNTIME
function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

// 🌍 COUNTRY DETECTOR
const getCountry = (jid) => {
    if (!jid) return "Unknown 🌍";
    try {
        const PhoneNumber = require('awesome-phonenumber');
        let number = jid.replace(/[^0-9]/g, '');
        const pn = PhoneNumber('+' + number);
        if (pn.getRegionCode()) {
            const country = pn.getCountry();
            const flag = pn.getRegionCode().toUpperCase().replace(/./g, char =>
                String.fromCodePoint(char.charCodeAt(0) + 127397)
            );
            return `${country} ${flag}`;
        }
        return "Unknown 🌍";
    } catch (err) {
        return "Unknown 🌍";
    }
};

module.exports = [
    // ==================== 1. MENU ====================
    {
        command: "menu",
        aliases: ["help", "commands"],
        category: "general",
        execute: async (sock, m, { send }) => {
            try {
                const now = new Date();
                const time = now.toLocaleTimeString();
                const date = now.toLocaleDateString();
                const pushname = m.pushName || "User";
                const uptime = runtime(process.uptime());
                const country = getCountry((m.sender || "").replace(/[^0-9]/g, ""));

                const menu = `
╭───〔 ${config.settings.title} 〕───⬣

👤 *User:* ${pushname}
🌍 *Country:* ${country}
🕒 *Time:* ${time}
📅 *Date:* ${date}
⚡ *Uptime:* ${uptime}

╰────────────⬣

╭───〔 📊 GENERAL 〕───⬣
│ • .menu
│ • .ping
│ • .alive
│ • .info
│ • .owner
│ • .repo
│ • .pair
╰────────────⬣

╭───〔 👑 OWNER 〕───⬣
│ • .update
│ • .restart
│ • .shutdown
│ • .eval
│ • .bc
│ • .bcgc
│ • .join
│ • .leave
│ • .block
│ • .unblock
│ • .blocklist
│ • .pm
│ • .banuser
│ • .unbanuser
│ • .banlist
│ • .addowner
│ • .delowner
│ • .owners
╰────────────⬣

╭───〔 👥 GROUP 〕───⬣
│ • .tagall
│ • .kick
│ • .add
│ • .promote
│ • .demote
│ • .mute
│ • .unmute
│ • .hidetag
│ • .groupinfo
│ • .grouplink
│ • .revokelink
│ • .welcome on/off
│ • .goodbye on/off
│ • .antilink
│ • .poll
│ • .listadmin
│ • .tagadmin
│ • .vcf
│ • .promoteall
│ • .demoteall
│ • .kickall
│ • .approveall
│ • .kickinactive
│ • .antibadword
│ • .antiforeign
│ • .antibot
╰────────────⬣

╭───〔 📥 DOWNLOADER 〕───⬣
│ • .play
│ • .tiktok
│ • .fb
│ • .ig
│ • .mediafire
│ • .twitter
│ • .apk
│ • .movie
│ • .wallpaper
│ • .gitclone
│ • .img
╰────────────⬣

╭───〔 ⚙️ SETTINGS 〕───⬣
│ • .autoread on/off
│ • .autotyping on/off
│ • .autorecording on/off
│ • .autoreact on/off
│ • .antidelete on/off
│ • .antiedit on/off
│ • .autoviewstatus on/off
│ • .autoreactstatus on/off
│ • .autostatus
│ • .setpp
│ • .setbio
│ • .setname
│ • .setprefix
│ • .resetprefix
╰────────────⬣

╭───〔 🛠️ TOOLS 〕───⬣
│ • .calc
│ • .qr
│ • .tts
│ • .time
│ • .sticker
│ • .toimg
│ • .tomp3
│ • .removebg
│ • .getpp
│ • .getid
│ • .getlink
│ • .translate
│ • .weather
│ • .lyrics
│ • .vv
╰────────────⬣

╭───〔 🎮 GAMES 〕───⬣
│ • .tictactoe
│ • .guess
│ • .quiz
│ • .riddle
│ • .truth
│ • .dare
╰────────────⬣

╭───〔 🎌 ANIME 〕───⬣
│ • .waifu
│ • .neko
│ • .shinobu
│ • .megumin
│ • .aizen
│ • .animequote
│ • .anime
│ • .manga
│ • .topanime
│ • .topmanga
│ • .character
│ • .randomanime
│ • .seasonal
│ • .hentai 🔞
│ • .hentaigif 🔞
╰────────────⬣

╭───〔 🤖 AI 〕───⬣
│ • .ai
│ • .imagine
╰────────────⬣

╭───〔 🎉 FUN 〕───⬣
│ • .joke
│ • .quote
│ • .fact
│ • .flip
│ • .roll
│ • .8ball
│ • .rps
│ • .ship
│ • .hug
│ • .compliment
╰────────────⬣

╭───〔 🎨 LOGO 〕───⬣
│ • .hacker
│ • .neon
│ • .fire
│ • .gold
│ • .logo
│ • .glitch
│ • .avenger
│ • .pubg
│ • .naruto
│ • .matrix
│ • .graffiti
│ • .1000d
│ • .rainbow
╰────────────⬣

${config.settings.footer}
`;

                await send({
                    image: { url: config.thumbUrl },
                    caption: menu
                });

            } catch (err) {
                console.log("Menu error:", err);
                await sock.sendMessage(m.chat, { text: "❌ Menu failed to load" }, { quoted: m });
            }
        }
    },

    // ==================== 2. PING ====================
    {
        command: "ping",
        aliases: ["p"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const latency = m.messageTimestamp ? (Date.now() - (m.messageTimestamp * 1000)) : '??';
            const pings = [
                `🏓 Pong! ${latency}ms — faster than your WiFi on a good day.`,
                `⚡ ${latency}ms — I'm basically speed.`,
                `📡 ${latency}ms — the connection is so good I can hear you thinking.`,
                `🛰️ ${latency}ms — signal came from Mars, apparently.`,
                `🤖 ${latency}ms — beep boop, I'm alive!`
            ];
            reply(R(pings));
        }
    },

    // ==================== 3. ALIVE ====================
    {
        command: "alive",
        aliases: ["online", "test"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const uptime = runtime(process.uptime());
            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const ping = m.messageTimestamp ? (Date.now() - (m.messageTimestamp * 1000)) : '??';

            const quotes = [
                `✅ I'm alive and kicking! ⏳ Uptime: ${uptime} | 🧠 RAM: ${memory}MB | 📡 Ping: ${ping}ms`,
                `🟢 Reporting for duty! Uptime: ${uptime} | Ping: ${ping}ms | RAM: ${memory}MB`,
                `💪 Still breathing, human. Uptime: ${uptime} | Ping: ${ping}ms`,
                `🤖 Beep boop… I'm online! Uptime: ${uptime} | Memory: ${memory}MB`,
                `🏃‍♂️ Running like a champ. Uptime: ${uptime} | Ping: ${ping}ms`
            ];

            reply(R(quotes));
        }
    },

    // ==================== 4. BOT INFO ====================
    {
        command: "info",
        aliases: ["botinfo", "status"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const uptime = runtime(process.uptime());
            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const platform = os.platform();
            const hostname = os.hostname();
            const nodeVersion = process.version;
            const botName = config.settings?.title || 'Alpha Bot';
            const owner = config.owner?.[0] || 'Unknown';
            const ownerJid = owner.includes('@') ? owner : owner + '@s.whatsapp.net';

            const infos = [
                `📊 *${botName} Info*\n\n` +
                `⏳ Uptime: ${uptime}\n` +
                `🧠 Memory: ${memory} MB\n` +
                `💻 Platform: ${platform}\n` +
                `🖥️ Host: ${hostname}\n` +
                `🔧 Node.js: ${nodeVersion}\n` +
                `👑 Owner: @${owner}`,

                `🤖 *Bot Status*\n\n` +
                `🟢 Status: Online\n` +
                `⏱️ Running: ${uptime}\n` +
                `📡 Ping: Fast\n` +
                `🧠 RAM: ${memory}MB\n` +
                `👤 Owner: @${owner}`,

                `📋 *Technical Info*\n\n` +
                `⚡ Uptime: ${uptime}\n` +
                `💾 Memory: ${memory}MB\n` +
                `🖥️ OS: ${platform}\n` +
                `🔢 Node: ${nodeVersion}\n` +
                `👑 @${owner}`
            ];

            reply(R(infos), { mentions: [ownerJid] });
        }
    },

    // ==================== 5. OWNER CONTACT ====================
    {
        command: "owner",
        aliases: ["creator", "dev"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const ownerNumber = config.owner?.[0] || 'Unknown';
            const ownerName = config.settings?.title?.split(' ')[0] || 'Alpha';
            const ownerJid = ownerNumber.includes('@') ? ownerNumber : ownerNumber + '@s.whatsapp.net';

            const messages = [
                `👑 *Owner:* @${ownerNumber}\n👤 *Name:* ${ownerName}\n\n💬 Tap the mention to send a DM. I'm happy to help!`,
                `🤴 *The Boss*\n📞 @${ownerNumber}\n👤 ${ownerName}\n\nMessage me directly for business or support!`,
                `🫅 *Contact the King*\n👤 ${ownerName}\n📱 @${ownerNumber}\n\nSlide into my DMs anytime.`,
                `👤 *Bot Creator*\n${ownerName}\n📞 @${ownerNumber}\n\nReach out for collaborations or issues.`
            ];

            reply(R(messages), { mentions: [ownerJid] });
        }
    },

    // ==================== 6. REPO ====================
    {
        command: "repo",
        aliases: ["source", "github", "sc"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const repoLink = "https://GitHub.com/Alexio11-09/alpha-xmd";
            const ownerName = "Alpha";
            const ownerContact = "wa.me/263786641436";
            const botName = config.settings?.title || "Alpha Bot";

            const texts = [
                `📂 *${botName} – Source Code*\n\n` +
                `🔗 *Repo:* ${repoLink}\n` +
                `👤 *Owner:* ${ownerName}\n` +
                `📞 *Contact:* ${ownerContact}\n\n` +
                `⭐ Star the project & fork freely!`,

                `🧬 *Open Source Bot*\n\n` +
                `💻 *Repo:* ${repoLink}\n` +
                `👑 *Dev:* ${ownerName}\n` +
                `📱 *WhatsApp:* ${ownerContact}\n\n` +
                `🤖 Build your own version with this code.`,

                `⚡ *Alpha XMD Repository*\n\n` +
                `🔗 ${repoLink}\n` +
                `👤 *Maintainer:* ${ownerName}\n` +
                `📞 ${ownerContact}\n\n` +
                `📥 Clone, modify, deploy.`
            ];

            reply(texts[Math.floor(Math.random() * texts.length)]);
        }
    },

    // ==================== 7. PAIR (INTERACTIVE) ====================
    {
        command: "pair",
        aliases: ["pairing", "session"],
        category: "general",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a phone number!\n\n📌 Example: .pair 263786641436");

            const number = args[0].replace(/[^0-9]/g, "");
            if (number.length < 10) return reply("❌ Invalid phone number. Use full country code (no +).");

            // Already a pending session?
            const pairSessionKey = m.chat + m.sender;
            if (global.pairSessions && global.pairSessions[pairSessionKey]) {
                return reply("⚠️ You already have a pending pairing request. Reply with *1* for QR or *2* for code.");
            }

            if (!global.pairSessions) global.pairSessions = {};
            global.pairSessions[pairSessionKey] = number;

            return reply(
                `🔐 *Pairing for +${number}*\n\n` +
                `Reply with:\n` +
                `*1.* 📷 QR Code\n` +
                `*2.* 🔢 Pairing Code\n\n` +
                `⌛ Reply in 2 minutes.`
            );
        }
    }
];