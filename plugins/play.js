const yts = require('yt-search');
const axios = require('axios');

module.exports = {
    command: 'play',

    execute: async (sock, m, { text, reply, send, config }) => {
        try {
            if (!text) return reply("🎧 Use: .play song name");

            const search = await yts(text);
            if (!search.videos.length) return reply("❌ No song found");

            const vid = search.videos[0];

            const res = await axios.get(`https://api.douxx.tech/api/youtube/audio?url=${vid.url}`);

            if (!res.data?.result) return reply("❌ Failed");

            const data = res.data.result;

            await send({
                image: { url: data.thumbnail },
                caption: `🎵 ${data.title}`
            });

            await send({
                audio: { url: data.download },
                mimetype: "audio/mpeg"
            });

        } catch (err) {
            reply("❌ Error downloading audio");
        }
    }
};