const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    command: 'video',
    description: 'YouTube video downloader',
    category: 'download',

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args[0]) {
                return reply("🎥 Use: .video <name/link>");
            }

            await sock.sendMessage(m.chat, {
                react: { text: "⚡", key: m.key }
            });

            let query = args.join(" ");
            let videoUrl = query;
            let videoInfo = null;

            // 🔍 SEARCH IF NOT LINK
            if (!query.startsWith('http')) {
                const search = await yts(query);

                if (!search.videos.length) {
                    await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                    return reply("❌ No results found");
                }

                videoInfo = search.videos[0];
                videoUrl = videoInfo.url;
            }

            // ❌ VALIDATE LINK
            if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
                return reply("❌ Invalid YouTube link");
            }

            await sock.sendMessage(m.chat, {
                react: { text: "⬇️", key: m.key }
            });

            let data = null;

            // 🔥 API 1 (BEST)
            try {
                const res = await axios.get(
                    `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`,
                    { timeout: 15000 }
                );

                if (res.data?.status && res.data?.video) {
                    data = {
                        title: res.data.title,
                        thumbnail: res.data.thumbnail,
                        video: res.data.video
                    };
                }
            } catch {}

            // 🔥 API 2 (FALLBACK)
            if (!data) {
                try {
                    const res = await axios.get(
                        `https://api.douxx.tech/api/youtube/video?url=${encodeURIComponent(videoUrl)}`,
                        { timeout: 15000 }
                    );

                    if (res.data?.result?.download) {
                        data = {
                            title: res.data.result.title,
                            thumbnail: res.data.result.thumbnail,
                            video: res.data.result.download
                        };
                    }
                } catch {}
            }

            if (!data || !data.video) {
                await sock.sendMessage(m.chat, {
                    react: { text: "❌", key: m.key }
                });
                return reply("⚠️ Download failed. Try again later.");
            }

            const title = data.title || videoInfo?.title || "Video";

            // 📸 SEND PREVIEW
            await sock.sendMessage(m.chat, {
                image: { url: data.thumbnail || videoInfo?.thumbnail },
                caption: `🎬 *${title}*\n⬇️ Downloading...`
            }, { quoted: m });

            // 🎥 SEND VIDEO
            await sock.sendMessage(m.chat, {
                video: { url: data.video },
                mimetype: 'video/mp4',
                caption: `✅ Done\n\n🎬 ${title}`
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key }
            });

        } catch (err) {
            console.log("Video error:", err);

            await sock.sendMessage(m.chat, {
                react: { text: "❌", key: m.key }
            });

            reply("❌ Download failed");
        }
    }
};