// © 2026 Alpha

const yts = require('yt-search');
const axios = require('axios');
const config = require("../settings/config");

module.exports = {
    command: 'video',

    execute: async (sock, m, { text, reply, send }) => {
        try {
            if (!text) return reply("🎥 Use: .video name");

            await sock.sendMessage(m.chat, {
                react: { text: "🎬", key: m.key }
            });

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

            // 🔥 API 1 (BEST)
            try {
                videoUrl = `https://api.vevioz.com/api/button/mp4/${encodeURIComponent(vid.url)}`;
            } catch {}

            // 🔥 API 2 (BACKUP)
            if (!videoUrl) {
                try {
                    const res = await axios.get(
                        `https://api.douxx.tech/api/youtube/video?url=${encodeURIComponent(vid.url)}`,
                        { timeout: 15000 }
                    );

                    if (res.data?.result?.download) {
                        videoUrl = res.data.result.download;
                    }
                } catch {}
            }

            if (!videoUrl) {
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return reply("⚠️ Video servers failed. Try again later.");
            }

            const title = vid.title;
            const filename = title.replace(/[^a-zA-Z0-9]/g, "_") + ".mp4";

            await send({
                image: { url: vid.thumbnail },
                caption: `🎬 *${title}*\n\n⬇️ Downloading...\n\n👑 ${config.settings.title}`
            });

            await send({
                video: { url: videoUrl },
                mimetype: "video/mp4",
                fileName: filename,
                caption: `✅ Done\n\n🎬 ${title}`
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