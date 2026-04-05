// © 2026 Alpha - SMART TRANSLATE 🔥

const axios = require("axios");

module.exports = {
    command: "translate",
    description: "Translate text",
    category: "tools",

    execute: async (sock, m, { args, reply }) => {
        try {
            const input = args.join(" ");

            if (!input) {
                return reply("❌ Usage:\n.translate hello | fr\n.translate es|en hola");
            }

            let from = "en";
            let to, text;

            // 🔥 MODE 1: hello | fr
            if (input.includes("|") && !input.includes(" ")) {
                return reply("❌ Invalid format");
            }

            if (input.includes("|") && input.split("|").length === 2) {
                const [query, lang] = input.split("|").map(v => v.trim());
                text = query;
                to = lang;
            }

            // 🔥 MODE 2: es|en hello
            if (input.includes(" ")) {
                const first = input.split(" ")[0];

                if (first.includes("|")) {
                    const [f, t] = first.split("|");
                    from = f;
                    to = t;
                    text = input.split(" ").slice(1).join(" ");
                }
            }

            if (!text || !to) {
                return reply("❌ Invalid format\nExample:\n.translate hello | fr\n.translate es|en hola");
            }

            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

            const res = await axios.get(url);

            const translated = res.data?.responseData?.translatedText;

            if (!translated) return reply("❌ Translation failed");

            reply(`🌍 *Translation*\n\n📝 ${text}\n➡️ ${translated}`);

        } catch (err) {
            console.log("Translate error:", err.message);
            reply("❌ Failed to translate");
        }
    }
};