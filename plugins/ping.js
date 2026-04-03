// © 2026 Alpha

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

            // react start
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

            // 🔥 FIX: fallback if send is broken
            if (typeof send === "function") {
                await send({ text: result });
            } else {
                await sock.sendMessage(m.chat, { text: result }, { quoted: m });
            }

            // react success
            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key }
            });

        } catch (err) {
            console.error("Ping error:", err);

            await sock.sendMessage(m.chat, {
                react: { text: "❌", key: m.key }
            });

            if (typeof reply === "function") {
                reply("❌ Failed to check ping");
            } else {
                sock.sendMessage(m.chat, { text: "❌ Failed to check ping" }, { quoted: m });
            }
        }
    }
};