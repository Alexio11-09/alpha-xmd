// © 2026 Alpha. All Rights Reserved.

const fs = require('fs')

const config = {
    // ✅ PUT YOUR REAL NUMBER HERE (IMPORTANT)
    owner: ["263786641436"],

    botNumber: "263786641436",

    setPair: "ALPHA-XMD",

    thumbUrl: "https://files.catbox.moe/soc5w1.jpg",

    session: "sessions",

    status: {
        public: true,
        terminal: true,
        reactsw: false
    },

    auto: {
        read: false,
        typing: false,
        react: false,
        antidelete: false
    },

    message: {
        owner: "❌ This command is for the bot owner only.",
        group: "❌ This command works in groups only.",
        admin: "❌ Admin only command.",
        private: "❌ This command is for private chat."
    },

    settings: {
        title: "ALPHA-XMD BOT",
        description: "Custom WhatsApp Bot by Alpha",
        footer: "⚡ Powered by Alpha-XMD"
    },

    newsletter: {
        name: "ALPHA-XMD BOT",
        id: "120363423969349257"
    }
}

module.exports = config;

// 🔄 HOT RELOAD
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(__filename + ' updated!')
  delete require.cache[file]
  require(file)
})