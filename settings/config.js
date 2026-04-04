// © 2026 Alpha. All Rights Reserved.

const fs = require('fs')

const config = {
    // ✅ PUT YOUR REAL NUMBER (NO X)
    owner: ["2637XXXXXXXX"],

    botNumber: "2637XXXXXXXX",

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
        owner: "This command is for the bot owner only.",
        group: "This command works in groups only.",
        admin: "Admin only command.",
        private: "This command is for private chat."
    },

    settings: {
        title: "ALPHA-XMD BOT",
        description: "Custom WhatsApp Bot by Alpha"
    },

    newsletter: {
        name: "ALPHA-XMD BOT",
        id: "120363423969349257"
    }
}

module.exports = config;