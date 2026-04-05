// © 2026 Alpha - QR GENERATOR 📷

const QRCode = require("qrcode");

module.exports = {
    command: "qr",
    description: "Generate QR code",
    category: "tools",

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args.length) {
                return reply("📷 Usage: .qr hello world");
            }

            const text = args.join(" ");

            // 🔥 GENERATE QR
            const qrBuffer = await QRCode.toBuffer(text);

            // ✅ SEND IMAGE
            await sock.sendMessage(m.chat, {
                image: qrBuffer,
                caption: `📷 QR for:\n${text}`
            }, { quoted: m });

        } catch (err) {
            console.log("QR error:", err);
            reply("❌ Failed to generate QR");
        }
    }
};