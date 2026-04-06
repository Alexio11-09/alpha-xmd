// © 2026 Alpha - DOWNLOADER (WORKING APIs 🔥)

const axios = require("axios");

module.exports = [

    // 🎵 PLAY (YouTube Search + Audio)
    {
        command: "play",
        category: "downloader",

        execute: async (sock, m, { args, reply, send }) => {
            try {
                if (!args[0]) return reply("❌ Give song name");

                const query = args.join(" ");

                const res = await axios.get(`https://ytsearcher.vercel.app/api/search?q=${encodeURIComponent(query)}`);
                const video = res.data[0];

                if (!video) return reply("❌ No results");

                await send({
                    image: { url: video.thumbnail },
                    caption: `🎵 ${video.title}\n⏳ Downloading...`
                });

                const dl = `https://ytmp3.cc/api/button/mp3?url=${video.url}`;

                await sock.sendMessage(m.chat, {
                    audio: { url: dl },
                    mimetype: "audio/mpeg"
                }, { quoted: m });

            } catch (err) {
                console.log(err);
                reply("❌ Play failed");
            }
        }
    },

    // 🎧 YTMP3
    {
        command: "ytmp3",
        category: "downloader",

        execute: async (sock, m, { args, reply }) => {
            try {
                if (!args[0]) return reply("❌ Give YouTube link");

                const dl = `https://ytmp3.cc/api/button/mp3?url=${args[0]}`;

                await sock.sendMessage(m.chat, {
                    audio: { url: dl },
                    mimetype: "audio/mpeg"
                }, { quoted: m });

            } catch {
                reply("❌ Failed");
            }
        }
    },

    // 🎬 YTMP4
    {
        command: "ytmp4",
        category: "downloader",

        execute: async (sock, m, { args, reply }) => {
            try {
                if (!args[0]) return reply("❌ Give YouTube link");

                const dl = `https://ytmp3.cc/api/button/videos/${args[0]}`;

                await sock.sendMessage(m.chat, {
                    video: { url: dl },
                    caption: "🎬 Downloading..."
                }, { quoted: m });

            } catch {
                reply("❌ Failed");
            }
        }
    }

];