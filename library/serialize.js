// © 2026 Alpha - FULL SERIALIZE FIX (PRO 🔥)

const { getContentType } = require("@whiskeysockets/baileys");

const smsg = async (sock, m) => {
    if (!m) return m;

    try {
        m.id = m.key?.id;
        m.chat = m.key?.remoteJid;
        m.fromMe = m.key?.fromMe;
        m.isGroup = m.chat?.endsWith('@g.us');

        // ✅ SENDER
        m.sender = m.fromMe
            ? sock.user.id
            : (m.key?.participant || m.chat);

        // ✅ MESSAGE TYPE
        if (m.message) {
            m.mtype = getContentType(m.message);
            m.msg = m.message[m.mtype];

            // ✅ TEXT
            m.text =
                m.message?.conversation ||
                m.msg?.caption ||
                m.msg?.text ||
                m.msg?.selectedButtonId ||
                m.msg?.singleSelectReply?.selectedRowId ||
                '';
        }

        // ================= QUOTED FIX =================
        if (m.msg?.contextInfo?.quotedMessage) {
            const quoted = m.msg.contextInfo.quotedMessage;
            const type = getContentType(quoted);

            m.quoted = {
                message: quoted,
                mtype: type,
                msg: quoted[type],
                key: {
                    id: m.msg.contextInfo.stanzaId,
                    remoteJid: m.chat
                }
            };

            // ✅ QUOTED TEXT
            m.quoted.text =
                m.quoted.msg?.caption ||
                m.quoted.msg?.text ||
                '';

            // ✅ MIME TYPE
            m.quoted.mimetype =
                m.quoted.msg?.mimetype ||
                m.quoted.msg?.fileSha256 ||
                '';

            // ✅ DOWNLOAD FUNCTION (VERY IMPORTANT)
            m.quoted.download = async () => {
                return await sock.downloadMediaMessage({
                    key: m.quoted.key,
                    message: m.quoted.message
                });
            };
        }

        // ================= MAIN DOWNLOAD =================
        m.download = async () => {
            return await sock.downloadMediaMessage(m);
        };

        // ✅ REPLY
        m.reply = (text) => {
            return sock.sendMessage(m.chat, { text }, { quoted: m });
        };

    } catch (err) {
        console.log("Serialize error:", err);
    }

    return m;
};

module.exports = { smsg };