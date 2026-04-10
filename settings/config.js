// © 2026 Alpha. All Rights Reserved.

const fs = require('fs')

const config = {

    // 🔥 OWNER (PRIMARY)
    owner: ["263786641436"], // your number

    botNumber: "263786641436",

    // 🔐 PAIR NAME
    setPair: "ALPHA-XMD",

    // 🖼️ THUMBNAIL
    thumbUrl: "https://files.catbox.moe/soc5w1.jpg",

    // 📁 SESSION FOLDER
    session: "sessions",

    // ⚙️ BOT MODE
    mode: "public", // public / self

    // 🤖 AUTO FEATURES
    auto: {
        read: false,
        typing: false,
        react: false,
        antidelete: false
    },

    // 📊 STATUS SETTINGS
    status: {
        public: true,
        terminal: true,
        reactsw: false
    },

    // 💬 MESSAGES
    message: {
        owner: "❌Hey you fool this command is for the bot owner only.",
        group: "❌Hey stop that, this command works in groups only.",
        admin: "❌Hey hey hey,first become an admin here and use this command ok.",
        private: "❌ Don't be dumb,this command is for private chat."
    },

    // 🎨 BOT UI
    settings: {
        title: "ALPHA-XMD BOT",
        description: "Custom WhatsApp Bot by Alpha",
        footer: "⚡ Powered by Alpha-XMD"
    },

    // 📢 CHANNEL / NEWSLETTER
    newsletter: {
        name: "ALPHA_XMD_UPDATES",
        id: "120363406868236363"
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