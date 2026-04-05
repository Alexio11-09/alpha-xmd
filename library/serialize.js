// © 2026 Alpha (ULTRA FIXED SERIALIZER 💯)

const { getContentType } = require("@whiskeysockets/baileys");

const smsg = async (sock, m) => {
    if (!m) return m;

    try {
        m.id = m.key?.id;
        m.chat = m.key?.remoteJid;
        m.fromMe = m.key?.fromMe;

        // 🔥 GROUP CHECK
        m.isGroup = m.chat?.endsWith('@g.us');

        // 🔥 FIXED SENDER (MAIN FIX)
        if (m.fromMe) {
            m.sender = sock.user.id;
        } else if (m.isGroup) {
            m.sender =
                m.key.participant ||
                m.participant ||
                m.message?.senderKeyDistributionMessage?.groupId ||
                "";
        } else {
            m.sender = m.chat;
        }

        // 🔥 CLEAN SENDER FORMAT
        if (m.sender) {
            m.sender = m.sender.includes(":")
                ? m.sender.split(":")[0] + "@s.whatsapp.net"
                : m.sender;
        }

        // 🔥 MESSAGE PARSE
        if (m.message) {
            m.mtype = getContentType(m.message);
            m.msg = m.message[m.mtype];

            m.text =
                m.message.conversation ||
                m.msg?.caption ||
                m.msg?.text ||
                "";
        }

        // 🔥 MENTION SUPPORT
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

        // 🔥 QUOTED SUPPORT
        if (m.msg?.contextInfo?.quotedMessage) {
            let quoted = m.msg.contextInfo;
            m.quoted = {
                sender: quoted.participant,
                text:
                    quoted.quotedMessage?.conversation ||
                    quoted.quotedMessage?.extendedTextMessage?.text ||
                    ""
            };
        }

        // 🔥 REPLY
        m.reply = (text) => {
            return sock.sendMessage(m.chat, { text }, { quoted: m });
        };

    } catch (err) {
        console.log("Serialize error:", err);
    }

    return m;
};

module.exports = { smsg };