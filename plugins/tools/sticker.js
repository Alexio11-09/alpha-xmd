// © 2026 Alpha - FINAL STICKER (IMAGE + VIDEO + EXIF 🔥)

const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { addExif } = require("../../lib/exif");

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    command: "sticker",
    description: "Convert image/video to sticker",
    category: "tools",

    execute: async (sock, m, { reply }) => {
        try {
            let msg = m.message;
            let quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;
            let mediaMsg = quoted || msg;

            const isImage = !!mediaMsg?.imageMessage;
            const isVideo = !!mediaMsg?.videoMessage;

            if (!isImage && !isVideo) {
                return reply("📩 Reply to image/video with .sticker");
            }

            // ⏱️ LIMIT VIDEO LENGTH
            if (isVideo) {
                const duration = mediaMsg.videoMessage.seconds || 0;
                if (duration > 10) {
                    return reply("❌ Video too long (max 10 sec)");
                }
            }

            // 📥 DOWNLOAD
            const stream = await downloadContentFromMessage(
                isImage ? mediaMsg.imageMessage : mediaMsg.videoMessage,
                isImage ? "image" : "video"
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const input = path.join(__dirname, isImage ? "input.jpg" : "input.mp4");
            const output = path.join(__dirname, "output.webp");

            fs.writeFileSync(input, buffer);

            // 🔥 CONVERT
            await new Promise((resolve, reject) => {
                let command = ffmpeg(input);

                if (isImage) {
                    command
                        .outputOptions([
                            "-vcodec", "libwebp",
                            "-vf", "scale=512:512:force_original_aspect_ratio=decrease",
                            "-lossless", "1",
                            "-compression_level", "6",
                            "-q:v", "60"
                        ]);
                }

                if (isVideo) {
                    command
                        .outputOptions([
                            "-vcodec", "libwebp",
                            "-vf",
                            "scale=512:512:force_original_aspect_ratio=decrease,fps=15",
                            "-loop", "0",
                            "-ss", "00:00:00",
                            "-t", "00:00:10",
                            "-preset", "default",
                            "-an",
                            "-vsync", "0"
                        ]);
                }

                command
                    .toFormat("webp")
                    .save(output)
                    .on("end", resolve)
                    .on("error", reject);
            });

            // 😈 ADD PACK METADATA
            await addExif(output, "Alpha-XMD", "Alpha");

            const sticker = fs.readFileSync(output);

            await sock.sendMessage(m.chat, {
                sticker
            }, { quoted: m });

            // 🧹 CLEAN
            fs.unlinkSync(input);
            fs.unlinkSync(output);

        } catch (err) {
            console.log("Sticker error:", err);
            reply("❌ Failed to create sticker");
        }
    }
};