// © 2026 Alpha - TRANSLATE 🌍

const axios = require("axios");

module.exports = {
    command: "translate",
    description: "Translate text",
    category: "tools",

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args.length) {
                return reply("🌍 Usage: .translate hello | fr");
            }

            // 🔥 JOIN INPUT
            const input = args.join(" ");

            // 🔥 SPLIT TEXT | LANG
            let [text, lang] = input.split("|").map(v => v.trim());

            if (!text) return reply("❌ Enter text to translate");
            if (!lang) lang = "en"; // default to English

            // 🌐 API
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`;

            const res = await axios.get(url);

            const translated = res.data?.responseData?.translatedText;

            if (!translated) {
                return reply("❌ Failed to translate");
            }

            // ✅ RESULT
            reply(`🌍 *Translation*\n\n📝 ${text}\n➡️ ${translated}`);

        } catch (err) {
            console.log("Translate error:", err);
            reply("❌ Error translating text");
        }
    }
};