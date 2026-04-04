// © 2026 Alpha (FIXED FINAL)

const {
    proto,
    getContentType
} = require("@whiskeysockets/baileys");

const smsg = async (sock, m) => {
    if (!m) return m;

    try {
        // BASIC
        m.id = m.key?.id;
        m.chat = m.key?.remoteJid;
        m.fromMe = m.key?.fromMe;
        m.isGroup = m.chat?.endsWith('@g.us');

        // 🔥 SENDER FIX (VERY IMPORTANT)
        m.sender = m.fromMe
            ? sock.user.id
            : (m.key.participant || m.chat);

        // MESSAGE TYPE
        if (m.message) {
            m.mtype = getContentType(m.message);
            m.msg = m.message[m.mtype];

            // 🔥 TEXT FIX (THIS WAS BREAKING YOUR BOT)
            m.text =
                m.message.conversation ||
                m.msg?.caption ||
                m.msg?.text ||
                '';
        }

        // SIMPLE REPLY
        m.reply = (text) => {
            return sock.sendMessage(m.chat, { text }, { quoted: m });
        };

    } catch (err) {
        console.log("Serialize error:", err);
    }

    return m;
};

module.exports = { smsg };