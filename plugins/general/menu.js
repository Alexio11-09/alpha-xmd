// © 2026 Alpha - ADVANCED MENU (BRANDED 🔥)

const config = require("../../settings/config");

// ⏱️ RUNTIME
const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    return `${d}d ${h}h ${m}m ${s}s`;
};

// 🌍 SIMPLE COUNTRY DETECTOR
const getCountry = (jid) => {
    if (!jid) return "Unknown";

    if (jid.startsWith("263")) return "Zimbabwe 🇿🇼";
    if (jid.startsWith("234")) return "Nigeria 🇳🇬";
    if (jid.startsWith("27")) return "South Africa 🇿🇦";
    if (jid.startsWith("254")) return "Kenya 🇰🇪";

    return "Unknown 🌍";
};

module.exports = {
    command: "menu",
    description: "Show bot menu",
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

👤 User: ${pushname}
🌍 Country: ${country}

🕒 Time: ${time}
📅 Date: ${date}
⚡ Uptime: ${uptime}

╰────────────⬣

📊 *GENERAL*
• .menu
• .ping
• .alive

⚙️ *SETTINGS*
• .autoread on/off
• .autotyping on/off
• .autorecording on/off
• .autoreact on/off
• .antidelete on/off
• .autoviewstatus on/off
• .autoreactstatus on/off
• .antideletestatus on/off
• .antiedit on/off

📥 *DOWNLOADER*
• .play
• .ytmp3
• .ytmp4
• .tiktok
• .fb
• .ig
• .mediafire

👥 *GROUP*
• .tagall
• .kick
• .add
• .promote
• .demote
• .mute
• .unmute

👑 *OWNER*
• .update
• .restart
• .eval

🛠️ *TOOLS*
• .calc
• .qr
• .tts
• .time
• .sticker
• .toimg
• .tomp3
• .removebg
• .tictactoe
• .guess
• .quiz
• .riddle

🎌 *ANIME*
• .waifu
• .neko
• .animequote

🎨 *LOGO*
• .logo
• .textmaker

🤖 *AI*
• .ai
• .gpt

🎉 *FUN*
• .joke
• .quote
• .truth
• .dare

╰────────────⬣
${config.settings.footer}
`;

            await send({
                image: { url: config.thumbUrl },
                caption: menu
            });

        } catch (err) {
            console.log("Menu error:", err);
            await sock.sendMessage(
                m.chat,
                { text: "❌ Menu failed to load" },
                { quoted: m }
            );
        }
    }
};