// © 2026 Alpha - STICKER MAKER 🖼️

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
    command: "sticker",
    description: "Convert image/video to sticker",
    category: "tools",

    execute: async (sock, m, { reply }) => {
        try {

            let quoted = m.quoted ? m.quoted : m;

            const mime = (quoted.msg || quoted).mimetype || "";

            if (!/image|video/.test(mime)) {
                return reply("🖼️ Reply to an image/video with .sticker");
            }

            // ⬇️ DOWNLOAD MEDIA
            const stream = await downloadContentFromMessage(quoted.msg || quoted, mime.split("/")[0]);
            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 📁 TEMP FILES
            const input = path.join(__dirname, `../temp_${Date.now()}.jpg`);
            const output = path.join(__dirname, `../sticker_${Date.now()}.webp`);

            fs.writeFileSync(input, buffer);

            // 🎞️ CONVERT TO WEBP (STICKER)
            exec(`ffmpeg -i ${input} -vcodec libwebp -filter:v fps=15 -lossless 1 -compression_level 6 -q:v 80 -preset default -loop 0 -an -vsync 0 ${output}`, async (err) => {

                fs.unlinkSync(input);

                if (err) {
                    console.log("FFmpeg error:", err);
                    return reply("❌ Failed to create sticker");
                }

                const sticker = fs.readFileSync(output);

                await sock.sendMessage(m.chat, {
                    sticker: sticker
                }, { quoted: m });

                fs.unlinkSync(output);
            });

        } catch (err) {
            console.log("Sticker error:", err);
            reply("❌ Error creating sticker");
        }
    }
};