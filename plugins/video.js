// © 2026 Alpha

const yts = require('yt-search');
const axios = require('axios');
const config = require("../settings/config");

module.exports = {
    command: 'video',
    description: 'Download YouTube video',
    category: 'downloader',

    execute: async (sock, m, { text, reply, send }) => {
        try {
            if (!text) return reply("🎥 Use: .video name");

            // 🎬 reaction
            await sock.sendMessage(m.chat, {
                react: { text: "🎬", key: m.key }
            });

            // 🔍 search
            const search = await yts(text);
            if (!search.videos.length) {
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return reply("❌ No video found");
            }

            const vid = search.videos[0];

            await sock.sendMessage(m.chat, {
                react: { text: "⬇️", key: m.key }
            });

            let videoUrl = null;

            // 🔥 WORKING API (REAL DOWNLOAD)
            try {
                const res = await axios.get(
                    `https://api.lolhuman.xyz/api/ytvideo?apikey=GataDios&url=${encodeURIComponent(vid.url)}`,
                    { timeout: 15000 }
                );

                if (res.data?.result?.link) {
                    videoUrl = res.data.result.link;
                }

            } catch (e) {
                console.log("API error:", e.message);
            }

            if (!videoUrl) {
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return reply("⚠️ Failed to fetch video. Try another one.");
            }

            const title = vid.title;
            const filename = title.replace(/[^a-zA-Z0-9]/g, "_") + ".mp4";

            // 📸 preview
            await send({
                image: { url: vid.thumbnail },
                caption: `🎬 *${title}*\n\n⬇️ Downloading video...\n\n👑 ${config.settings.title}`
            });

            // 🎥 send video
            await send({
                video: { url: videoUrl },
                mimetype: "video/mp4",
                fileName: filename,
                caption: `✅ Done\n\n🎬 ${title}\n\n👑 ${config.settings.title}`
            });

            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key }
            });

        } catch (err) {
            console.log("Video error:", err);

            await sock.sendMessage(m.chat, {
                react: { text: "❌", key: m.key }
            });

            reply("❌ Error downloading video");
        }
    }
};