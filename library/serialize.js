// © 2026 Alpha (STABLE BASE)

const { getContentType } = require("@whiskeysockets/baileys");

const smsg = async (sock, m) => {
    if (!m) return m;

    try {
        m.id = m.key?.id;
        m.chat = m.key?.remoteJid;
        m.fromMe = m.key?.fromMe;
        m.isGroup = m.chat?.endsWith('@g.us');

        // ✅ SAFE SENDER
        m.sender = m.fromMe
            ? sock.user.id
            : (m.key?.participant || m.chat);

        if (m.message) {
            m.mtype = getContentType(m.message);
            m.msg = m.message[m.mtype];

            // ✅ SAFE TEXT (NO BREAKS)
            m.text =
                m.message?.conversation ||
                m.msg?.caption ||
                m.msg?.text ||
                m.msg?.selectedButtonId ||
                m.msg?.singleSelectReply?.selectedRowId ||
                '';
        }

        // ✅ REPLY HELPER
        m.reply = (text) => {
            return sock.sendMessage(m.chat, { text }, { quoted: m });
        };

    } catch (err) {
        console.log("Serialize error:", err);
    }

    return m;
};

module.exports = { smsg };