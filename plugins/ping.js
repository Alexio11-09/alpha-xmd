const config = require("../settings/config");

function runtime(seconds) {
    seconds = Number(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

module.exports = {
    command: 'ping',
    description: 'Check bot speed',
    category: 'general',

    execute: async (sock, m, { reply, send }) => {
        try {
            const start = Date.now();

            await sock.sendMessage(m.chat, {
                react: { text: "⚡", key: m.key }
            });

            const latency = Date.now() - start;
            const uptime = runtime(process.uptime());

            let speedIcon = "🐢";
            if (latency < 100) speedIcon = "⚡";
            else if (latency < 300) speedIcon = "🚀";

            const result = 
`╔═══〔 ⚡ PING STATUS 〕═══⬣
║ 🏓 Pong Response
║ ${speedIcon} Speed: ${latency} ms
║ ⏱ Uptime: ${uptime}
║ 🤖 Bot: ${config.settings.title}
╚══════════════════⬣`;

            await send({ text: result });

            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key }
            });

        } catch (err) {
            console.error("Ping error:", err);

            await sock.sendMessage(m.chat, {
                react: { text: "❌", key: m.key }
            });

            reply("❌ Failed to check ping");
        }
    }
};