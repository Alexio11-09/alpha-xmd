// © 2026 Alpha - FIXED STICKER

const fs = require("fs");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    command: "sticker",
    description: "Convert image to sticker",
    category: "tools",

    execute: async (sock, m, { reply }) => {
        try {

            let msg = m.message;

            // 🔥 CHECK REPLIED MESSAGE
            let quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

            let mediaMsg = quoted || msg;

            let mime =
                mediaMsg?.imageMessage?.mimetype ||
                mediaMsg?.videoMessage?.mimetype;

            if (!mime) {
                return reply("📩 Reply to an image/video with .sticker");
            }

            // 🔥 DOWNLOAD MEDIA
            const stream = await downloadContentFromMessage(
                mediaMsg.imageMessage || mediaMsg.videoMessage,
                "image"
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 🔥 SEND STICKER
            await sock.sendMessage(m.chat, {
                sticker: buffer
            }, { quoted: m });

        } catch (err) {
            console.log("Sticker error:", err);
            reply("❌ Failed to create sticker");
        }
    }
};