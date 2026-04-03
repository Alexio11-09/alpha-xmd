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

    execute: async (sock, m, { reply, send }) => {
        try {
            const start = Date.now();

            await sock.sendMessage(m.chat, {
                react: { text: "⚡", key: m.key }
            });

            const latency = Date.now() - start;
            const uptime = runtime(process.uptime());

            const result = 
`⚡ PING
Speed: ${latency} ms
Uptime: ${uptime}
Bot: ${config.settings.title}`;

            await send({ text: result });

        } catch (err) {
            reply("❌ Failed to check ping");
        }
    }
};