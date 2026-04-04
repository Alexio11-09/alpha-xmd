// © 2026 Alpha (FINAL FIX)

const { getContentType } = require("@whiskeysockets/baileys");

const smsg = async (sock, m) => {
    if (!m) return m;

    try {
        m.id = m.key?.id;
        m.chat = m.key?.remoteJid;
        m.fromMe = m.key?.fromMe;
        m.isGroup = m.chat?.endsWith('@g.us');

        // 🔥 SENDER FIX
        m.sender = m.fromMe
            ? sock.user.id
            : (m.key.participant || m.chat);

        if (m.message) {
            m.mtype = getContentType(m.message);
            m.msg = m.message[m.mtype];

            // 🔥 TEXT FIX
            m.text =
                m.message.conversation ||
                m.msg?.caption ||
                m.msg?.text ||
                '';
        }

        m.reply = (text) => {
            return sock.sendMessage(m.chat, { text }, { quoted: m });
        };

    } catch (err) {
        console.log("Serialize error:", err);
    }

    return m;
};

module.exports = { smsg };