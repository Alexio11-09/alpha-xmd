// © 2026 Alpha. All Rights Reserved.

const fs = require('fs')

const config = {
    owner: "2637XXXXXXXX",
    botNumber: "2637XXXXXXXX",

    setPair: "ALPHA-XMD",

    thumbUrl: "https://files.catbox.moe/soc5w1.jpg",

    session: "sessions",

    status: {
        public: true,
        terminal: true,
        reactsw: false
    },

    // 🔥 ADD THIS (IMPORTANT)
    auto: {
        read: false,
        typing: false
    },

    message: {
        owner: "This command is for the bot owner only.",
        group: "This command works in groups only.",
        admin: "Admin only command.",
        private: "This command is for private chat."
    },

    mess: {
        owner: 'This command is only for the bot owner!',
        done: 'Action completed successfully!',
        error: 'Something went wrong!',
        wait: 'Please wait...'
    },

    settings: {
        title: "ALPHA-XMD BOT",
        packname: 'ALPHA-XMD',
        description: "Custom WhatsApp Bot by Alpha",
        author: 'Alpha',
        footer: "⚡ Powered by Alpha-XMD"
    },

    newsletter: {
        name: "ALPHA-XMD BOT",
        id: "120363423969349257"
    },

    api: {
        baseurl: "https://hector-api.vercel.app/",
        apikey: "hector"
    },

    sticker: {
        packname: "ALPHA-XMD",
        author: "Alpha"
    }
}

module.exports = config;

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' updated!\x1b[0m')
  delete require.cache[file]
  require(file)
})