// © 2026 Alpha - LYRICS 🔥

const axios = require("axios");

module.exports = {
    command: "lyrics",
    description: "Get song lyrics",
    category: "tools",

    execute: async (sock, m, { args, reply }) => {
        try {
            const query = args.join(" ");

            if (!query) {
                return reply("❌ Usage: .lyrics song name");
            }

            reply("🎤 Fetching lyrics...");

            const res = await axios.get(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(query)}`);

            if (!res.data || !res.data.lyrics) {
                return reply("❌ Lyrics not found");
            }

            const data = res.data;

            reply(
`🎵 *${data.title}*
👤 ${data.artist}

${data.lyrics.substring(0, 3000)}`
            );

        } catch (err) {
            console.log("Lyrics error:", err.message);
            reply("❌ Failed to fetch lyrics");
        }
    }
};