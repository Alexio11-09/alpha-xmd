// © 2026 Alpha. All Rights Reserved.

const fs = require('fs');

const config = {
    owner: ["2637XXXXXXXX"],
    botNumber: "2637XXXXXXXX",

    botName: "ALPHA-XMD",
    setPair: "ALPHA-XMD",

    prefix: ['.', '!', '/'],

    thumbUrl: "https://files.catbox.moe/soc5w1.jpg",

    session: "sessions",

    status: {
        public: true,
        autoRead: true,
        autoReact: false,
        typing: true,
        terminal: true
    },

    message: {
        owner: "👑 Owner only command.",
        group: "👥 Group only command.",
        admin: "⚠️ Admin only.",
        private: "📩 Private chat only."
    },

    mess: {
        owner: '👑 Owner only!',
        done: '✅ Done!',
        error: '❌ Error!',
        wait: '⏳ Wait...'
    },

    settings: {
        title: "ALPHA-XMD BOT",
        description: "Custom WhatsApp Bot by Alpha",
        author: "Alpha",
        footer: "⚡ Powered by Alpha-XMD",
        channel: "https://whatsapp.com/channel/120363423969349257"
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
    },

    features: {
        antiCall: false,
        autoStatusView: false,
        antiDelete: false
    }
};

module.exports = config;

// 🔄 HOT RELOAD
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' updated!\x1b[0m');
    delete require.cache[file];
    require(file);
});