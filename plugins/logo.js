// © 2026 Alpha - LOGO COMMANDS (REAL WORKING APIs)

const axios = require('axios');

// Helper to send image
async function sendLogo(sock, m, url, caption) {
    try {
        await sock.sendMessage(m.chat, {
            image: { url: url },
            caption: caption
        }, { quoted: m });
    } catch {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            await sock.sendMessage(m.chat, {
                image: Buffer.from(response.data),
                caption: caption
            }, { quoted: m });
        } catch {
            throw new Error('Send failed');
        }
    }
}

module.exports = [

    // ==================== 1. NEON TEXT ====================
    {
        command: "neon",
        aliases: ["neontext"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .neon Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("💡 *Creating neon text...*");
            try {
                const url = `https://api.lolhuman.xyz/api/ephoto1/neon?apikey=GataDios&text=${text}`;
                await sendLogo(sock, m, url, `💡 *NEON: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try again.");
            }
        }
    },

    // ==================== 2. FIRE TEXT ====================
    {
        command: "fire",
        aliases: ["firetext", "burning"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .fire Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🔥 *Creating fire text...*");
            try {
                const url = `https://api.lolhuman.xyz/api/ephoto1/fire?apikey=GataDios&text=${text}`;
                await sendLogo(sock, m, url, `🔥 *FIRE: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try again.");
            }
        }
    },

    // ==================== 3. GOLD TEXT ====================
    {
        command: "gold",
        aliases: ["goldtext", "golden"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .gold Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🌟 *Creating gold text...*");
            try {
                const url = `https://api.lolhuman.xyz/api/ephoto1/gold?apikey=GataDios&text=${text}`;
                await sendLogo(sock, m, url, `🌟 *GOLD: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try again.");
            }
        }
    },

    // ==================== 4. AVENGER TEXT ====================
    {
        command: "avenger",
        aliases: ["avengers", "marvel"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .avenger Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🦸 *Creating Avengers text...*");
            try {
                const url = `https://api.lolhuman.xyz/api/ephoto1/avenger?apikey=GataDios&text=${text}`;
                await sendLogo(sock, m, url, `🦸 *AVENGER: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try again.");
            }
        }
    },

    // ==================== 5. HACKER TEXT ====================
    {
        command: "hacker",
        aliases: ["hack", "anonymous"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a name!\n\n📌 Example: .hacker Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("👨‍💻 *Creating hacker text...*");
            try {
                const url = `https://api.lolhuman.xyz/api/ephoto1/anonymous?apikey=GataDios&text=${text}`;
                await sendLogo(sock, m, url, `👨‍💻 *HACKER: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try a shorter name.");
            }
        }
    },

    // ==================== 6. GLITCH TEXT ====================
    {
        command: "glitch",
        aliases: ["glitchtext"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .glitch Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🌀 *Creating glitch text...*");
            try {
                const url = `https://api.lolhuman.xyz/api/ephoto1/glitch?apikey=GataDios&text=${text}`;
                await sendLogo(sock, m, url, `🌀 *GLITCH: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try again.");
            }
        }
    },

    // ==================== 7. TEXTMAKER ====================
    {
        command: "textmaker",
        aliases: ["textart", "3dtext"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .textmaker Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🎨 *Creating text art...*");
            try {
                const url = `https://api.lolhuman.xyz/api/ephoto1/text3d?apikey=GataDios&text=${text}`;
                await sendLogo(sock, m, url, `📝 *TEXT ART: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 8. PUBG TEXT ====================
    {
        command: "pubg",
        aliases: ["pubgtext"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .pubg Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🎯 *Creating PUBG text...*");
            try {
                const url = `https://api.lolhuman.xyz/api/ephoto1/pubg?apikey=GataDios&text=${text}`;
                await sendLogo(sock, m, url, `🎯 *PUBG: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try again.");
            }
        }
    }

];