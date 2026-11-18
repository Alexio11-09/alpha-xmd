// © 2026 Alpha - FULL SERIALIZE FIX (PRO 🔥)

const getContentType = (content) => {
    if (!content) return undefined;
    const keys = Object.keys(content);
    return keys.find(k => (k === 'conversation' || k.endsWith('Message')) && k !== 'senderKeyDistributionMessage');
};

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
            // Unwrap ephemeral or viewOnce messages if present
            if (m.message.ephemeralMessage) {
                m.message = m.message.ephemeralMessage.message;
            } else if (m.message.viewOnceMessage) {
                m.message = m.message.viewOnceMessage.message;
            } else if (m.message.viewOnceMessageV2) {
                m.message = m.message.viewOnceMessageV2.message;
            }

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
            const quotedSender = m.msg.contextInfo.participant;

            m.quoted = {
                message: quoted,
                mtype: type,
                msg: quoted[type],
                sender: quotedSender,
                key: {
                    id: m.msg.contextInfo.stanzaId,
                    remoteJid: m.chat,
                    participant: quotedSender
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

            // ✅ DOWNLOAD FUNCTION
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
