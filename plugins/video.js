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

            // 🎬 Start reaction
            await sock.sendMessage(m.chat, {
                react: { text: "🎬", key: m.key }
            });

            // 🔍 SEARCH
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

            // 🔥 PRIMARY API (VERY RELIABLE)
            try {
                const res = await axios.get(
                    `https://api.vevioz.com/api/button/mp4/${encodeURIComponent(vid.url)}`,
                    { timeout: 15000 }
                );

                if (res.data) {
                    videoUrl = `https://api.vevioz.com/api/button/mp4/${encodeURIComponent(vid.url)}`;
                }
            } catch {}

            // 🔥 BACKUP API
            if (!videoUrl) {
                try {
                    const res2 = await axios.get(
                        `https://api.douxx.tech/api/youtube/video?url=${encodeURIComponent(vid.url)}`,
                        { timeout: 15000 }
                    );

                    if (res2.data?.result?.download) {
                        videoUrl = res2.data.result.download;
                    }
                } catch {}
            }

            if (!videoUrl) {
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return reply("⚠️ Video server failed. Try again later.");
            }

            const title = vid.title;
            const filename = title.replace(/[^a-zA-Z0-9]/g, "_") + ".mp4";

            // 📸 PREVIEW
            await send({
                image: { url: vid.thumbnail },
                caption: `🎬 *${title}*\n\n⬇️ Downloading video...\n\n👑 ${config.settings.title}`
            });

            // 🎥 SEND VIDEO
            await send({
                video: { url: videoUrl },
                mimetype: "video/mp4",
                fileName: filename,
                caption: `✅ Done\n\n🎬 ${title}\n\n👑 ${config.settings.title}`
            });

            // ✅ Done
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