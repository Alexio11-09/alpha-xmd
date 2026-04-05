// © 2026 Alpha - QR (NO PACKAGE VERSION)

const axios = require("axios");

module.exports = {
    command: "qr",
    description: "Generate QR code",
    category: "tools",

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args.length) {
                return reply("📷 Usage: .qr Hello World");
            }

            const text = args.join(" ");

            // 🌐 API QR Generator
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;

            await sock.sendMessage(m.chat, {
                image: { url },
                caption: `📷 QR Code for:\n${text}`
            });

        } catch (err) {
            console.log("QR error:", err);
            reply("❌ Failed to generate QR");
        }
    }
};