// © 2026 Alpha - FULL SERIALIZE FIX (PRO 🔥)

const getContentType = (content) => {
    if (!content) return undefined;
    const keys = Object.keys(content);
    return keys.find(k => (k === 'conversation' || k.endsWith('Message')) && k !== 'senderKeyDistributionMessage');
};

// Wrapper messages that hide the real content (view-once, ephemeral, etc.)
const WRAPPERS = [
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'documentWithCaptionMessage'
];

const unwrap = (message, info = {}) => {
    let cur = message;

    for (let i = 0; i < 5 && cur; i++) {
        let inner = null;

        for (const w of WRAPPERS) {
            if (cur[w]?.message) {
                inner = cur[w].message;
                if (w.startsWith('viewOnce')) info.viewOnce = true;
                break;
            }
        }

        if (!inner) break;
        cur = inner;
    }

    return cur;
};

// Baileys exposes downloadMediaMessage as a standalone function, NOT as sock.downloadMediaMessage.
// It is an ES module, so it is loaded once with a dynamic import.
let baileysDownload;

const download = async (sock, msg) => {
    if (!baileysDownload) {
        baileysDownload = (await import('@whiskeysockets/baileys')).downloadMediaMessage;
    }

    return baileysDownload(
        msg,
        'buffer',
        {},
        { reuploadRequest: sock.updateMediaMessage }
    );
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
            // Unwrap ephemeral / view-once wrappers
            const info = {};
            m.message = unwrap(m.message, info);

            m.mtype = getContentType(m.message);
            m.msg = m.message[m.mtype];
            m.viewOnce = !!(info.viewOnce || m.msg?.viewOnce);

            // ✅ MENTIONS (used by .getpp @user, .getid, .steal ...)
            m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

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
            // Unwrap so quoted view-once / ephemeral media is detected correctly
            const qInfo = {};
            const quoted = unwrap(m.msg.contextInfo.quotedMessage, qInfo);
            const type = getContentType(quoted);
            const quotedSender = m.msg.contextInfo.participant;

            m.quoted = {
                message: quoted,
                mtype: type,
                msg: quoted?.[type],
                sender: quotedSender,
                key: {
                    id: m.msg.contextInfo.stanzaId,
                    remoteJid: m.chat,
                    participant: quotedSender
                }
            };

            // ✅ VIEW-ONCE FLAG (the wrapper is removed above, so remember it)
            m.quoted.viewOnce = !!(qInfo.viewOnce || m.quoted.msg?.viewOnce);

            // ✅ QUOTED TEXT
            m.quoted.text =
                m.quoted.msg?.caption ||
                m.quoted.msg?.text ||
                (typeof quoted?.conversation === 'string' ? quoted.conversation : '') ||
                '';

            // ✅ MIME TYPE
            m.quoted.mimetype = m.quoted.msg?.mimetype || '';

            // ✅ DOWNLOAD FUNCTION
            m.quoted.download = async () => {
                return await download(sock, {
                    key: m.quoted.key,
                    message: m.quoted.message
                });
            };
        }

        // ================= MAIN DOWNLOAD =================
        m.download = async () => {
            return await download(sock, m);
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