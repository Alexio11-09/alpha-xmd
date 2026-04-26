// © 2026 Alpha - GENERAL COMMANDS (ALL 5 IN ONE FILE)

const os = require('os');
const config = require("../../settings/config");   // correct path for plugins/general/

const R = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ⏱️ RUNTIME (used by menu, alive, info)
function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

// 🌍 COUNTRY DETECTOR (used by menu)
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
    // ==================== 1. MENU (ADVANCED) ====================
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
│ • .3d
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

    // ==================== 2. PING (FUNNY + LATENCY) ====================
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
    }
];