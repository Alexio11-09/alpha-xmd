// © 2026 Alpha - PRO STICKER 🔥

const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    command: "sticker",
    description: "Convert image to sticker",
    category: "tools",

    execute: async (sock, m, { reply }) => {
        try {
            let msg = m.message;
            let quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;
            let mediaMsg = quoted || msg;

            let mime =
                mediaMsg?.imageMessage?.mimetype ||
                mediaMsg?.videoMessage?.mimetype;

            if (!mime) {
                return reply("📩 Reply to an image/video with .sticker");
            }

            // 📥 DOWNLOAD
            const stream = await downloadContentFromMessage(
                mediaMsg.imageMessage || mediaMsg.videoMessage,
                "image"
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const input = path.join(__dirname, "input.jpg");
            const output = path.join(__dirname, "output.webp");

            fs.writeFileSync(input, buffer);

            // 🔥 CONVERT TO WEBP
            await new Promise((resolve, reject) => {
                ffmpeg(input)
                    .outputOptions([
                        "-vcodec", "libwebp",
                        "-vf", "scale=512:512:force_original_aspect_ratio=decrease",
                        "-lossless", "1",
                        "-compression_level", "6",
                        "-q:v", "60",
                        "-preset", "default"
                    ])
                    .toFormat("webp")
                    .save(output)
                    .on("end", resolve)
                    .on("error", reject);
            });

            const sticker = fs.readFileSync(output);

            // 😈 SEND WITH METADATA
            await sock.sendMessage(m.chat, {
                sticker: sticker,
                packname: "Alpha-XMD",
                author: "Alpha"
            }, { quoted: m });

            // 🧹 CLEAN FILES
            fs.unlinkSync(input);
            fs.unlinkSync(output);

        } catch (err) {
            console.log("Sticker error:", err);
            reply("❌ Failed to create sticker");
        }
    }
};