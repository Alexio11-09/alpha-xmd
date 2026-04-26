// © 2026 Alpha - GENERAL COMMANDS (ALL 7 IN ONE FILE)

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

    // ==================== 7. PAIR (PUBLIC SESSION GENERATOR) ====================
    {
        command: "pair",
        aliases: ["pairing", "session"],
        category: "general",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a phone number!\n\n📌 Example: .pair 263786641436");

            // Clean the number
            const number = args[0].replace(/[^0-9]/g, "");
            if (number.length < 10) return reply("❌ Invalid phone number. Use the full country code (no +).");

            // Global rate‑limit (15 seconds)
            if (global.__pairLastRequest && Date.now() - global.__pairLastRequest < 15000) {
                return reply("⏳ The pairing service is busy. Please wait 15 seconds before trying again.");
            }
            global.__pairLastRequest = Date.now();

            reply(`🔐 Requesting pairing code for +${number}...\nThis may take a few seconds.`);

            try {
                // Dynamically import Baileys
                const baileys = await import('@whiskeysockets/baileys');
                const { makeWASocket, Browsers, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;

                // Temporary auth directory – unique per request to allow concurrent usage
                const tempDir = path.join(os.tmpdir(), `alpha_pair_${number}_${Date.now()}`);
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                const { state } = await useMultiFileAuthState(tempDir);
                const { version } = await fetchLatestBaileysVersion();

                // Create a throw‑away socket
                const tempSock = makeWASocket({
                    auth: state,
                    version,
                    browser: Browsers.macOS('Chrome'),
                    logger: require('pino')({ level: 'silent' }),
                    printQRInTerminal: false
                });

                let pairingCode = null;
                const timeoutMs = 45000;

                // Wait for connection and request code
                await new Promise((resolve, reject) => {
                    const timer = setTimeout(() => {
                        tempSock.end();
                        reject(new Error("Pairing timed out. WhatsApp may be slow – try again in a minute."));
                    }, timeoutMs);

                    tempSock.ev.on('connection.update', async (update) => {
                        const { connection, lastDisconnect } = update;
                        if (connection === 'open') {
                            try {
                                pairingCode = await tempSock.requestPairingCode(number);
                                clearTimeout(timer);
                                tempSock.end();
                                resolve();
                            } catch (err) {
                                clearTimeout(timer);
                                tempSock.end();
                                reject(err);
                            }
                        } else if (connection === 'close') {
                            clearTimeout(timer);
                            tempSock.end();
                            if (lastDisconnect?.error) {
                                reject(lastDisconnect.error instanceof Error ? lastDisconnect.error : new Error(lastDisconnect.error));
                            } else {
                                reject(new Error("Connection closed before pairing"));
                            }
                        }
                    });
                });

                // Clean temporary folder
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}

                if (!pairingCode) throw new Error("Failed to obtain pairing code");

                reply(
                    `✅ *Pairing Code Ready*\n\n` +
                    `📞 *Number:* +${number}\n` +
                    `🔢 *Code:* *${pairingCode}*\n\n` +
                    `⏱️ Expires in 60 seconds.\n` +
                    `📱 Open WhatsApp → Linked devices → Link with phone number → Enter this code.`
                );

            } catch (err) {
                console.error("Pairing error:", err);
                // Clean temp folder just in case
                try { const leftover = path.join(os.tmpdir(), `alpha_pair_${number}_${Date.now()}`); fs.rmSync(leftover, { recursive: true, force: true }); } catch {}
                reply(`❌ Failed to generate pairing code: ${err.message || String(err)}`);
            }
        }
    }
];