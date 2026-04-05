// © 2026 Alpha - CLEAN STICKER USING EXIF SYSTEM 🔥

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { writeExif } = require("../../lib/exif");

module.exports = {
    command: "sticker",
    description: "Convert image/video to sticker",
    category: "tools",

    execute: async (sock, m, { reply }) => {
        try {
            let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let mediaMsg = quoted || m.message;

            const isImage = mediaMsg?.imageMessage;
            const isVideo = mediaMsg?.videoMessage;

            if (!isImage && !isVideo) {
                return reply("📩 Reply to image/video with .sticker");
            }

            // ⏱️ LIMIT VIDEO
            if (isVideo) {
                const duration = mediaMsg.videoMessage.seconds || 0;
                if (duration > 10) {
                    return reply("❌ Video too long (max 10 sec)");
                }
            }

            // 📥 DOWNLOAD
            const stream = await downloadContentFromMessage(
                isImage ? isImage : isVideo,
                isImage ? "image" : "video"
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 🔥 USE YOUR EXIF SYSTEM
            const sticker = await writeExif(
                {
                    mimetype: isImage ? "image/jpeg" : "video/mp4",
                    data: buffer
                },
                {
                    packname: "Alpha-XMD",
                    author: "Alpha",
                    categories: ["🔥"]
                }
            );

            // 📤 SEND
            await sock.sendMessage(m.chat, {
                sticker
            }, { quoted: m });

        } catch (err) {
            console.log("STICKER ERROR:", err);
            reply("❌ Failed to create sticker");
        }
    }
};