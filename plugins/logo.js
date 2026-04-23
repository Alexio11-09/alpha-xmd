// © 2026 Alpha - LOGO COMMANDS (13 WORKING EFFECTS)

const axios = require('axios');
const fs = require('fs');

// Helper function to download and send image
async function sendLogo(sock, m, url, caption) {
    try {
        await sock.sendMessage(m.chat, {
            image: { url: url },
            caption: caption
        }, { quoted: m });
    } catch (err) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            await sock.sendMessage(m.chat, {
                image: buffer,
                caption: caption
            }, { quoted: m });
        } catch {
            throw new Error('Failed to send image');
        }
    }
}

module.exports = [

    // ==================== 1. HACKER ====================
    {
        command: "hacker",
        aliases: ["hack", "anonymous"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a name!\n\n📌 Example: .hacker Alpha");
            const name = encodeURIComponent(args.join(" "));
            reply("🎨 *Generating hacker image...*");
            try {
                const url = `https://api.ephoto360.com/hacker?name=${name}`;
                await sendLogo(sock, m, url, `👨‍💻 *HACKER: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try a shorter name.");
            }
        }
    },

    // ==================== 2. LOGO ====================
    {
        command: "logo",
        aliases: ["logogen", "logodesign"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .logo Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🎨 *Generating logo...*");
            try {
                const url = `https://api.ephoto360.com/logo?text=${text}`;
                await sendLogo(sock, m, url, `✨ *LOGO: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 3. TEXTMAKER ====================
    {
        command: "textmaker",
        aliases: ["textart", "3dtext"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .textmaker Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🎨 *Creating text art...*");
            try {
                const url = `https://api.ephoto360.com/textmaker?text=${text}`;
                await sendLogo(sock, m, url, `📝 *TEXT ART: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 4. GFX (GAMING STYLE) ====================
    {
        command: "gfx",
        aliases: ["gaming", "gametext"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .gfx Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🎮 *Creating gaming text...*");
            try {
                const url = `https://api.ephoto360.com/gfx?text=${text}`;
                await sendLogo(sock, m, url, `🎮 *GFX: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 5. ANONYMOUS MASK ====================
    {
        command: "anonymask",
        aliases: ["mask", "anonymousmask"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a name!\n\n📌 Example: .anonymask Alpha");
            const name = encodeURIComponent(args.join(" "));
            reply("🎭 *Generating anonymous mask...*");
            try {
                const url = `https://api.ephoto360.com/anonymous?name=${name}`;
                await sendLogo(sock, m, url, `🎭 *ANONYMOUS: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try a shorter name.");
            }
        }
    },

    // ==================== 6. NEON ====================
    {
        command: "neon",
        aliases: ["neontext", "neonlight"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .neon Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("💡 *Creating neon text...*");
            try {
                const url = `https://api.ephoto360.com/neon?text=${text}`;
                await sendLogo(sock, m, url, `💡 *NEON: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 7. GLITCH ====================
    {
        command: "glitch",
        aliases: ["glitchtext", "glitcheffect"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .glitch Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🌀 *Creating glitch effect...*");
            try {
                const url = `https://api.ephoto360.com/glitch?text=${text}`;
                await sendLogo(sock, m, url, `🌀 *GLITCH: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 8. FIRE ====================
    {
        command: "fire",
        aliases: ["firetext", "burning"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .fire Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🔥 *Creating fire text...*");
            try {
                const url = `https://api.ephoto360.com/fire?text=${text}`;
                await sendLogo(sock, m, url, `🔥 *FIRE: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 9. MATRIX ====================
    {
        command: "matrix",
        aliases: ["matrixtext", "matrixeffect"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .matrix Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("💚 *Creating Matrix text...*");
            try {
                const url = `https://api.ephoto360.com/matrix?text=${text}`;
                await sendLogo(sock, m, url, `💚 *MATRIX: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 10. GOLD ====================
    {
        command: "gold",
        aliases: ["goldtext", "golden"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .gold Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🌟 *Creating gold text...*");
            try {
                const url = `https://api.ephoto360.com/gold?text=${text}`;
                await sendLogo(sock, m, url, `🌟 *GOLD: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 11. AVENGER ====================
    {
        command: "avenger",
        aliases: ["avengers", "marvel"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .avenger Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🦸 *Creating Avengers logo...*");
            try {
                const url = `https://api.ephoto360.com/avenger?text=${text}`;
                await sendLogo(sock, m, url, `🦸 *AVENGER: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 12. PUBG ====================
    {
        command: "pubg",
        aliases: ["pubgtext", "pubgstyle"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .pubg Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🎯 *Creating PUBG text...*");
            try {
                const url = `https://api.ephoto360.com/pubg?text=${text}`;
                await sendLogo(sock, m, url, `🎯 *PUBG: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    },

    // ==================== 13. NARUTO ====================
    {
        command: "naruto",
        aliases: ["narutotext", "narutostyle"],
        category: "logo",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide text!\n\n📌 Example: .naruto Alpha");
            const text = encodeURIComponent(args.join(" "));
            reply("🍥 *Creating Naruto text...*");
            try {
                const url = `https://api.ephoto360.com/naruto?text=${text}`;
                await sendLogo(sock, m, url, `🍥 *NARUTO: ${args.join(" ")}*`);
            } catch {
                reply("❌ Failed! Try shorter text.");
            }
        }
    }

];