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
            if (!text) {
                return reply("🎥 Use: .video name");
            }

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

            let data = null;

            // 🔥 API 1 (FAST)
            try {
                const res1 = await axios.get(
                    `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(vid.url)}`,
                    { timeout: 15000 }
                );

                if (res1.data?.status && res1.data?.video) {
                    data = {
                        title: res1.data.title,
                        thumbnail: res1.data.thumbnail,
                        video: res1.data.video
                    };
                }
            } catch {}

            // 🔥 API 2 (BACKUP)
            if (!data) {
                try {
                    const res2 = await axios.get(
                        `https://api.douxx.tech/api/youtube/video?url=${encodeURIComponent(vid.url)}`,
                        { timeout: 15000 }
                    );

                    if (res2.data?.result) {
                        data = {
                            title: res2.data.result.title,
                            thumbnail: res2.data.result.thumbnail,
                            video: res2.data.result.download
                        };
                    }
                } catch {}
            }

            // 🔥 API 3 (LAST)
            if (!data) {
                try {
                    const res3 = await axios.get(
                        `https://api.lolhuman.xyz/api/youtube?apikey=GataDios&url=${encodeURIComponent(vid.url)}`,
                        { timeout: 15000 }
                    );

                    if (res3.data?.result?.link) {
                        data = {
                            title: res3.data.result.title,
                            thumbnail: res3.data.result.thumbnail,
                            video: res3.data.result.link
                        };
                    }
                } catch {}
            }

            if (!data || !data.video) {
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return reply("⚠️ All video servers failed. Try again later.");
            }

            const title = data.title || vid.title;
            const filename = title.replace(/[^a-zA-Z0-9]/g, "_") + ".mp4";

            // 📸 PREVIEW
            await send({
                image: { url: data.thumbnail || vid.thumbnail },
                caption: `🎬 *${title}*\n\n⬇️ Downloading video...\n\n👑 ${config.settings.title}`
            });

            // 🎥 SEND VIDEO
            await send({
                video: { url: data.video },
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