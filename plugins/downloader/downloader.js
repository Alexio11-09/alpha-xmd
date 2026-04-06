// © 2026 Alpha - FULL DOWNLOADER (COMBINED 🔥)

const axios = require("axios");

module.exports = [

    // 🎵 PLAY
    {
        command: "play",
        category: "downloader",

        execute: async (sock, m, { args, reply, send }) => {
            try {
                if (!args[0]) return reply("❌ Give song name");

                const query = args.join(" ");

                const res = await axios.get(`https://api.giftedtech.web.id/api/search/youtube?apikey=gifted&q=${encodeURIComponent(query)}`);
                const video = res.data.result[0];

                if (!video) return reply("❌ No results");

                const dl = await axios.get(`https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${video.url}`);
                const data = dl.data.result;

                await send({
                    image: { url: video.thumbnail },
                    caption: `🎵 ${video.title}\n⏳ Sending...`
                });

                await sock.sendMessage(m.chat, {
                    audio: { url: data.download_url },
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
                if (!args[0]) return reply("❌ Give link");

                const res = await axios.get(`https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${args[0]}`);

                await sock.sendMessage(m.chat, {
                    audio: { url: res.data.result.download_url },
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
                if (!args[0]) return reply("❌ Give link");

                const res = await axios.get(`https://api.giftedtech.web.id/api/download/ytmp4?apikey=gifted&url=${args[0]}`);

                await sock.sendMessage(m.chat, {
                    video: { url: res.data.result.download_url },
                    caption: "🎬 Downloading..."
                }, { quoted: m });

            } catch {
                reply("❌ Failed");
            }
        }
    },

    // 🎵 TIKTOK
    {
        command: "tiktok",
        category: "downloader",

        execute: async (sock, m, { args, reply }) => {
            try {
                if (!args[0]) return reply("❌ Give TikTok link");

                const res = await axios.get(`https://api.giftedtech.web.id/api/download/tiktok?apikey=gifted&url=${args[0]}`);

                await sock.sendMessage(m.chat, {
                    video: { url: res.data.result.nowm },
                    caption: "🎵 TikTok Download"
                }, { quoted: m });

            } catch {
                reply("❌ Failed");
            }
        }
    },

    // 📘 FACEBOOK
    {
        command: "fb",
        category: "downloader",

        execute: async (sock, m, { args, reply }) => {
            try {
                if (!args[0]) return reply("❌ Give Facebook link");

                const res = await axios.get(`https://api.giftedtech.web.id/api/download/facebook?apikey=gifted&url=${args[0]}`);

                await sock.sendMessage(m.chat, {
                    video: { url: res.data.result.hd },
                    caption: "📘 Facebook Video"
                }, { quoted: m });

            } catch {
                reply("❌ Failed");
            }
        }
    },

    // 📸 INSTAGRAM
    {
        command: "ig",
        category: "downloader",

        execute: async (sock, m, { args, reply }) => {
            try {
                if (!args[0]) return reply("❌ Give Instagram link");

                const res = await axios.get(`https://api.giftedtech.web.id/api/download/instagram?apikey=gifted&url=${args[0]}`);

                await sock.sendMessage(m.chat, {
                    video: { url: res.data.result[0].url },
                    caption: "📸 Instagram Download"
                }, { quoted: m });

            } catch {
                reply("❌ Failed");
            }
        }
    }

];