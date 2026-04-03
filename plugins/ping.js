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

    execute: async (sock, m, { reply }) => {
        try {
            const start = Date.now();

            // ⚡ reaction start
            await sock.sendMessage(m.chat, {
                react: { text: "⚡", key: m.key }
            });

            // send initial message
            const msg = await sock.sendMessage(m.chat, {
                text: "🏓 *Pinging server...*"
            }, { quoted: m });

            const latency = Date.now() - start;
            const uptime = runtime(process.uptime());

            // smarter speed indicator
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

            // edit message (safer fallback)
            try {
                await sock.sendMessage(m.chat, {
                    text: result,
                    edit: msg.key,
                    contextInfo: {
                        mentionedJid: [m.sender],
                        externalAdReply: {
                            title: config.settings.title,
                            body: "Real-time speed check ⚡",
                            thumbnailUrl: config.thumbUrl,
                            mediaType: 1
                        }
                    }
                });
            } catch {
                // fallback if edit fails
                await sock.sendMessage(m.chat, {
                    text: result
                }, { quoted: m });
            }

            // ✅ done reaction
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