// © 2026 Alpha - LINK SHORTENER 🔗

const axios = require("axios");

module.exports = {
    command: "short",
    description: "Shorten a URL",
    category: "tools",

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args[0]) {
                return reply("🔗 Usage: .short https://example.com");
            }

            const url = args[0];

            // 🔒 BASIC VALIDATION
            if (!url.startsWith("http")) {
                return reply("❌ Enter a valid URL (start with http/https)");
            }

            // 🌐 API REQUEST
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);

            if (!res.data) {
                return reply("❌ Failed to shorten link");
            }

            // ✅ RESULT
            reply(`🔗 Shortened Link:\n${res.data}`);

        } catch (err) {
            console.log("Short error:", err);
            reply("❌ Error shortening link");
        }
    }
};