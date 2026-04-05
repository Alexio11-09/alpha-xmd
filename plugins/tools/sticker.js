// © 2026 Alpha - FINAL STICKER (AUTO TRIM + EXIF)

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { writeExif } = require("../../library/exif");

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

            // ❌ No media
            if (!isImage && !isVideo) {
                return reply("📩 Reply to image/video with .sticker");
            }

            // ⏱️ Inform if long video (but don’t block)
            if (isVideo) {
                const duration = mediaMsg.videoMessage.seconds || 0;

                if (duration > 10) {
                    await reply("⏱️ Video too long, trimming to 10s...");
                }
            }

            // 📥 Download media
            const stream = await downloadContentFromMessage(
                isImage ? isImage : isVideo,
                isImage ? "image" : "video"
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 🔥 Convert + add EXIF (your system auto handles trimming)
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

            // 📤 Send sticker
            await sock.sendMessage(
                m.chat,
                { sticker },
                { quoted: m }
            );

        } catch (err) {
            console.log("STICKER ERROR:", err);
            reply("❌ Failed to create sticker");
        }
    }
};