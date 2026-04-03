// © 2026 Alpha. All Rights Reserved.

const config = require('../settings/config');

const {
    jidNormalizedUser,
    proto,
    getContentType,
    areJidsSameUser
} = require("@whiskeysockets/baileys");

const smsg = async (sock, m, store) => {
    if (!m) return m;

    let M = proto.WebMessageInfo;

    try {

    // 🔥 BASIC INFO
    if (m.key) {
        m.id = m.key.id || '';
        m.from = m.key.remoteJid?.startsWith('status')
            ? jidNormalizedUser(m.key?.participant || m.participant)
            : jidNormalizedUser(m.key.remoteJid);

        m.isBaileys = m.id?.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat?.endsWith('@g.us');

        m.sender = sock.decodeJid(
            m.fromMe && sock.user?.id ||
            m.participant ||
            m.key.participant ||
            m.chat || ''
        );

        if (m.isGroup) {
            m.participant = sock.decodeJid(m.key.participant) || '';
        }
    }

    // 🔥 MESSAGE BODY
    if (m.message) {
        m.mtype = getContentType(m.message);

        m.msg = (m.mtype === 'viewOnceMessage')
            ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
            : m.message[m.mtype];

        m.body =
            m.message?.conversation ||
            m.msg?.caption ||
            m.msg?.text ||
            (m.mtype === 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) ||
            (m.mtype === 'buttonsResponseMessage' && m.msg?.selectedButtonId) ||
            '';

        // 🔥 QUOTED
        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage || null;
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

        if (m.quoted) {
            let type = getContentType(quoted);
            m.quoted = m.quoted[type];

            if (typeof m.quoted === 'string') {
                m.quoted = { text: m.quoted };
            }

            m.quoted.key = {
                remoteJid: m.chat,
                participant: jidNormalizedUser(m.msg?.contextInfo?.participant),
                fromMe: areJidsSameUser(
                    jidNormalizedUser(m.msg?.contextInfo?.participant),
                    jidNormalizedUser(sock?.user?.id)
                ),
                id: m.msg?.contextInfo?.stanzaId,
            };

            m.quoted.mtype = type;
            m.quoted.sender = sock.decodeJid(m.msg?.contextInfo?.participant);

            m.quoted.text =
                m.quoted.text ||
                m.quoted.caption ||
                m.quoted.conversation ||
                '';

            // 🔥 QUICK FUNCTIONS
            m.quoted.delete = () => sock.sendMessage(m.chat, { delete: m.quoted.key });
            m.quoted.download = () => sock.downloadMediaMessage(m.quoted);
        }
    }

    // 🔥 DOWNLOAD
    if (m.msg?.url) {
        m.download = () => sock.downloadMediaMessage(m.msg);
    }

    // 🔥 TEXT
    m.text =
        m.msg?.text ||
        m.msg?.caption ||
        m.message?.conversation ||
        '';

    // 🔥 GLOBAL REPLY SYSTEM (CHANNEL MODE 😈)
    m.reply = (text, chatId = m.chat, options = {}) => {
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.newsletter.id + "@newsletter",
                newsletterName: config.newsletter.name
            },
            externalAdReply: {
                title: config.settings.title,
                body: config.settings.description,
                thumbnailUrl: config.thumbUrl,
                sourceUrl: "https://whatsapp.com/channel/" + config.newsletter.id,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        };

        return Buffer.isBuffer(text)
            ? sock.sendMessage(chatId, { document: text, contextInfo }, { quoted: m, ...options })
            : sock.sendMessage(chatId, { text, contextInfo }, { quoted: m, ...options });
    };

    // 🔁 COPY
    m.copy = () => smsg(sock, M.fromObject(M.toObject(m)), store);

    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) =>
        sock.copyNForward(jid, m, forceForward, options);

    } catch (err) {
        console.log('❌ Serialize Error:', err);
    }

    return m;
};

module.exports = { smsg };