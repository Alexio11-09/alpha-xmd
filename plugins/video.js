const yts = require('yt-search');
const axios = require('axios');

module.exports = {
    command: 'video',

    execute: async (sock, m, { text, reply, send }) => {
        try {
            if (!text) return reply("🎥 Use: .video name");

            const search = await yts(text);
            if (!search.videos.length) return reply("❌ No video found");

            const vid = search.videos[0];

            const res = await axios.get(`https://api.douxx.tech/api/youtube/video?url=${vid.url}`);

            if (!res.data?.result) return reply("❌ Failed");

            const data = res.data.result;

            await send({
                image: { url: data.thumbnail },
                caption: `🎬 ${data.title}`
            });

            await send({
                video: { url: data.download },
                mimetype: "video/mp4"
            });

        } catch (err) {
            reply("❌ Error downloading video");
        }
    }
};