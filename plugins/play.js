// © 2026 Alpha

const yts = require('yt-search');
const axios = require('axios');
const config = require("../settings/config");

module.exports = {
    command: 'play',
    description: 'Download YouTube audio (MP3)',
    category: 'downloader',

    execute: async (sock, m, { text, reply, send }) => {
        try {
            if (!text) {
                return reply("🎧 Use: .play song name");
            }

            // 🎶 Start reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "🎶", key: m.key } 
            });

            // 🔍 SEARCH
            const search = await yts(text);
            if (!search.videos.length) {
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return reply("❌ No song found");
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
                    { timeout: 10000 }
                );

                if (res1.data?.status && res1.data?.audio) {
                    data = {
                        title: res1.data.title,
                        thumbnail: res1.data.thumbnail,
                        audio: res1.data.audio
                    };
                }
            } catch {}

            // 🔥 API 2 (BACKUP)
            if (!data) {
                try {
                    const res2 = await axios.get(
                        `https://api.douxx.tech/api/youtube/audio?url=${encodeURIComponent(vid.url)}`,
                        { timeout: 10000 }
                    );

                    if (res2.data?.result) {
                        data = {
                            title: res2.data.result.title,
                            thumbnail: res2.data.result.thumbnail,
                            audio: res2.data.result.download
                        };
                    }
                } catch {}
            }

            // 🔥 API 3 (LAST)
            if (!data) {
                try {
                    const res3 = await axios.get(
                        `https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${encodeURIComponent(vid.url)}`,
                        { timeout: 10000 }
                    );

                    if (res3.data?.result) {
                        data = {
                            title: res3.data.result.title,
                            thumbnail: res3.data.result.thumbnail,
                            audio: res3.data.result.link
                        };
                    }
                } catch {}
            }

            if (!data || !data.audio) {
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return reply("⚠️ All audio servers failed. Try again later.");
            }

            const title = data.title || vid.title;

            // 📸 PREVIEW
            await send({
                image: { url: data.thumbnail || vid.thumbnail },
                caption: `🎵 *${title}*\n\n⬇️ Downloading audio...\n\n👑 ${config.settings.title}`
            });

            // 🎧 SEND REAL AUDIO FILE
            await send({
                audio: { url: data.audio },
                mimetype: "audio/mpeg",
                fileName: title.replace(/[^a-zA-Z0-9]/g, "_") + ".mp3",
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: "Now playing 🎧",
                        thumbnailUrl: data.thumbnail || vid.thumbnail,
                        mediaType: 1
                    }
                }
            });

            // ✅ Done
            await sock.sendMessage(m.chat, { 
                react: { text: "✅", key: m.key } 
            });

        } catch (err) {
            console.log("Play error:", err);

            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });

            reply("❌ Failed to download audio");
        }
    }
};