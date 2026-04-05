// © 2026 Alpha - GOOGLE SEARCH 🔍

const axios = require("axios");

module.exports = {
    command: "google",
    description: "Search on Google",
    category: "tools",

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args.length) {
                return reply("🔍 Usage: .google Messi age");
            }

            const query = args.join(" ");

            // 🌐 API (DuckDuckGo Instant Answer API)
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;

            const res = await axios.get(url);

            let text = "";

            // 🧠 TRY MAIN ANSWER
            if (res.data.AbstractText) {
                text = res.data.AbstractText;
            }

            // 🔎 FALLBACK TO RELATED TOPICS
            else if (res.data.RelatedTopics && res.data.RelatedTopics.length > 0) {
                text = res.data.RelatedTopics
                    .slice(0, 3)
                    .map(v => v.Text)
                    .join("\n\n");
            }

            // ❌ NOTHING FOUND
            if (!text) {
                return reply("❌ No results found");
            }

            // ✅ SEND RESULT
            reply(`🔍 *Google Search*\n\n📝 ${query}\n\n${text}`);

        } catch (err) {
            console.log("Google error:", err);
            reply("❌ Error fetching results");
        }
    }
};