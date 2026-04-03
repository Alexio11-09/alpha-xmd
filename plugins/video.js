const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    command: 'video',
    description: 'Fast YouTube video downloader',
    category: 'downloader',

    execute: async (sock, m, { text, prefix, reply, send, config }) => {
        try {
            if (!text) {
                return reply(`🎥 Usage: ${prefix}video <name/url>\nEx: ${prefix}video drake - gods plan`);
            }

            await sock.sendMessage(m.chat, {
                react: { text: "⚡", key: m.key }
            });

            let videoUrl = text;
            let videoInfo = null;

            // 🔍 SEARCH IF NOT LINK
            if (!text.startsWith('http')) {
                const search = await yts(text);

                if (!search.videos.length) {
                    await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                    return reply("❌ No videos found");
                }

                videoInfo = search.videos[0];
                videoUrl = videoInfo.url;
            }

            // ❌ VALIDATION
            if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return reply("❌ Invalid YouTube link");
            }

            await sock.sendMessage(m.chat, {
                react: { text: "⬇️", key: m.key }
            });

            let data = null;

            // 🔥 API 1
            try {
                const res1 = await axios.get(
                    `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`,
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

            // 🔥 API 2
            if (!data) {
                try {
                    const res2 = await axios.get(
                        `https://api.douxx.tech/api/youtube/video?url=${encodeURIComponent(videoUrl)}`,
                        { timeout: 15000 }
                    );

                    if (res2.data?.result?.download) {
                        data = {
                            title: res2.data.result.title,
                            thumbnail: res2.data.result.thumbnail,
                            video: res2.data.result.download
                        };
                    }
                } catch {}
            }

            // 🔥 API 3
            if (!data) {
                try {
                    const res3 = await axios.get(
                        `https://api.lolhuman.xyz/api/youtube?apikey=GataDios&url=${encodeURIComponent(videoUrl)}`,
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
                return reply("⚠️ All download servers failed. Try again later.");
            }

            const title = data.title || videoInfo?.title || "Video";
            const filename = title.replace(/[^a-zA-Z0-9]/g, "_") + ".mp4";

            // 📸 PREVIEW (GLOBAL SYSTEM)
            await send({
                image: { url: data.thumbnail || videoInfo?.thumbnail },
                caption: `🎬 *${title}*\n⬇️ Downloading video...\n\n👑 ${config.settings.title}`
            });

            // 🎥 SEND VIDEO (GLOBAL SYSTEM)
            await send({
                video: { url: data.video },
                mimetype: 'video/mp4',
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

            reply("❌ Download failed. Try again.");
        }
    }
};