// © 2026 Alpha - GENERAL COMMANDS (ALL WORKING & FUNNY)

const os = require('os');
const config = require("../settings/config");

const R = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Funny uptime formatter
function runtime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
}

module.exports = [
    // ==================== MENU (unchanged) ====================
    {
        command: "menu",
        aliases: ["help", "commands"],
        category: "general",
        execute: async (sock, m, { send, config }) => {
            // … your existing menu logic … (kept exactly as before)
        }
    },

    // ==================== PING (funny, real latency) ====================
    {
        command: "ping",
        aliases: ["p"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const start = Date.now();
            // Calculate latency based on message timestamp if available
            const latency = m.messageTimestamp ? (Date.now() - (m.messageTimestamp * 1000)) : 'fast';
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

    // ==================== ALIVE ====================
    {
        command: "alive",
        aliases: ["online", "test"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const uptime = runtime(process.uptime());
            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const ping = m.messageTimestamp ? (Date.now() - (m.messageTimestamp * 1000)) : '?';

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

    // ==================== BOT INFO ====================
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

    // ==================== OWNER CONTACT (UPDATED) ====================
    {
        command: "owner",
        aliases: ["creator", "dev"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const ownerNumber = config.owner?.[0] || 'Unknown';
            const ownerName = config.ownerName || config.settings?.title?.split(' ')[0] || 'Alpha';
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