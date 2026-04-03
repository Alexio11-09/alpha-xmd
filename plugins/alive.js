const config = require("../settings/config");
const os = require("os");

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

module.exports = {
    command: 'alive',
    description: 'Check bot status',
    category: 'general',

    execute: async (sock, m, { reply, send }) => {
        try {
            const start = Date.now();

            await sock.sendMessage(m.chat, {
                react: { text: "⚡", key: m.key }
            });

            const uptime = runtime(process.uptime());

            const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const ramTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

            const speed = Date.now() - start;

            let statusIcon = "🟢";
            if (speed > 500) statusIcon = "🟡";
            if (speed > 1000) statusIcon = "🔴";

            const aliveText = 
`╔═══〔 🤖 ${config.settings.title} 〕═══⬣
║ 👤 User: ${m.pushName || "User"}
║ ${statusIcon} Status: ONLINE
║ ⏱ Uptime: ${uptime}
║ 🚀 Speed: ${speed} ms
║ 💾 RAM: ${ramUsed}MB / ${ramTotal}GB
╚════════════════════⬣

👑 Owner: Alpha
📢 Channel: https://whatsapp.com/channel/120363423969349257

> ${config.settings.footer}`;

            await send({
                image: { url: config.thumbUrl },
                caption: aliveText
            });

            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key }
            });

        } catch (err) {
            console.error("Alive error:", err);

            await sock.sendMessage(m.chat, {
                react: { text: "❌", key: m.key }
            });

            reply("❌ Failed to fetch status");
        }
    }
};