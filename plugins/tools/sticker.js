// 🔥 SIMPLE WORKING STICKER (NO EXIF)

const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    command: "sticker",
    category: "tools",

    execute: async (sock, m, { reply }) => {
        try {
            let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let mediaMsg = quoted || m.message;

            const isImage = mediaMsg?.imageMessage;
            const isVideo = mediaMsg?.videoMessage;

            if (!isImage && !isVideo) {
                return reply("📩 Reply to image/video");
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

            const input = path.join(__dirname, isImage ? "in.jpg" : "in.mp4");
            const output = path.join(__dirname, "out.webp");

            fs.writeFileSync(input, buffer);

            // 🔥 CONVERT
            await new Promise((resolve, reject) => {
                ffmpeg(input)
                    .outputOptions([
                        "-vcodec", "libwebp",
                        "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15",
                        "-loop", "0",
                        "-preset", "default",
                        "-an"
                    ])
                    .toFormat("webp")
                    .save(output)
                    .on("end", resolve)
                    .on("error", reject);
            });

            const sticker = fs.readFileSync(output);

            await sock.sendMessage(m.chat, { sticker }, { quoted: m });

            fs.unlinkSync(input);
            fs.unlinkSync(output);

        } catch (err) {
            console.log("STICKER ERROR:", err);
            reply("❌ Sticker failed");
        }
    }
};