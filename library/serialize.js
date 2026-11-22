// © 2026 Alpha - FULL SERIALIZE FIX (PRO 🔥 + INTERACTIVE LIST SUPPORT)

const getContentType = (content) => {
    if (!content) return undefined;
    const keys = Object.keys(content);
    return keys.find(k => (k === 'conversation' || k.endsWith('Message')) && k !== 'senderKeyDistributionMessage');
};

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
            const info = {};
            m.message = unwrap(m.message, info);

            m.mtype = getContentType(m.message);
            m.msg = m.message[m.mtype];
            m.viewOnce = !!(info.viewOnce || m.msg?.viewOnce);

            m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

            // ✅ EXTRACT INTERACTIVE LIST / BUTTON CLICK IDs
            let interactiveId = '';
            try {
                if (m.msg?.nativeFlowResponseMessage?.paramsJson) {
                    interactiveId = JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id || '';
                }
            } catch {}

            // ✅ TEXT
            m.text =
                m.message?.conversation ||
                m.msg?.caption ||
                m.msg?.text ||
                m.msg?.selectedButtonId ||
                m.msg?.singleSelectReply?.selectedRowId ||
                interactiveId ||
                '';
        }

        // ================= QUOTED FIX =================
        if (m.msg?.contextInfo?.quotedMessage) {
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

            m.quoted.viewOnce = !!(qInfo.viewOnce || m.quoted.msg?.viewOnce);

            m.quoted.text =
                m.quoted.msg?.caption ||
                m.quoted.msg?.text ||
                (typeof quoted?.conversation === 'string' ? quoted.conversation : '') ||
                '';

            m.quoted.mimetype = m.quoted.msg?.mimetype || '';

            m.quoted.download = async () => {
                return await download(sock, {
                    key: m.quoted.key,
                    message: m.quoted.message
                });
            };
        }

        m.download = async () => {
            return await download(sock, m);
        };

        m.reply = (text) => {
            return sock.sendMessage(m.chat, { text }, { quoted: m });
        };

    } catch (err) {
        console.log("Serialize error:", err);
    }

    return m;
};

module.exports = { smsg };
