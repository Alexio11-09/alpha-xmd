const tenant = require('../library/tenant');

// 🎯 20 default pairs of 2 emojis (Won't overlap the timestamp)
const defaultEmojiPairs = [
    '🔥❤️', '😂👏', '💯🔥', '👑💎', '🤯⚡', '🚀🎉', '💚✨', '😮😢', '🙏👀', '🍿🎬',
    '🎵🎧', '💻📱', '🌍🌟', '🏆🥇', '🤖💡', '🎯💥', '💖💫', '☀️🌙', '🌸🍃', '🍕🍔'
];

const defaults = () => ({
    enabled: false,
    reactOn: false,
    reactEmoji: 'random', // ALWAYS RANDOM
    reactEmojis: defaultEmojiPairs
});

const cacheByAccount = new Map();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function accountKey(sock) {
    return tenant.phoneOf(sock) || 'unknown';
}

function getConfig(sock) {
    const key = accountKey(sock);

    if (cacheByAccount.has(key)) {
        return cacheByAccount.get(key);
    }

    let c = tenant.read(sock, 'autoStatus.json', defaults());

    if (!Array.isArray(c.reactEmojis) || !c.reactEmojis.length) {
        c.reactEmojis = defaultEmojiPairs;
    }

    const merged = { ...defaults(), ...c };

    if (key !== 'unknown') cacheByAccount.set(key, merged);
    return merged;
}

function saveConfig(sock, data) {
    const key = accountKey(sock);
    tenant.write(sock, 'autoStatus.json', data);
    cacheByAccount.set(key, data);
}

async function reactToStatus(s, statusKey) {
    const conf = getConfig(s);

    if (!conf.reactOn) return;

    // 🎯 Always pick from the array (which holds either your 20 pairs or your custom ones)
    const pool = (conf.reactEmojis && conf.reactEmojis.length) ? conf.reactEmojis : defaultEmojiPairs;
    const reactionText = pool[Math.floor(Math.random() * pool.length)];

    try {
        await s.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: reactionText
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [
                    statusKey.remoteJid,
                    statusKey.participant || statusKey.remoteJid
                ]
            }
        );
    } catch (error) {
        console.log('[AUTOSTATUS] Reaction failed:', error.message);
    }
}

// ---------------------------------------------------------------
// Process one status (local read + fake timestamp + reaction)
// ---------------------------------------------------------------
async function processStatus(s, st) {
    const conf = getConfig(s);

    if (!conf.enabled) return;

    const m = st.messages ? st.messages[0] : st;

    if (!m || !m.key) return;
    if (m.key.remoteJid !== 'status@broadcast') return;

    const p = m.key.participantAlt || m.key.participant || m.key.remoteJid;

    // 🎯 STEP 1: Mark as read locally on the bot's device (clears green circle)
    try {
        await s.chatModify(
            { 
                markRead: true, 
                lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }] 
            }, 
            'status@broadcast'
        );
    } catch (e) {
        console.log('[AUTOSTATUS] Local mark-read failed:', e.message);
    }

    // 🎯 STEP 2: Send the FAKE TIMESTAMP (1/1/70) to the server
    try {
        const receiptNode = {
            tag: 'receipt',
            attrs: {
                id: m.key.id,
                to: p,
                type: 'read',
                t: '0',                 // Forces the 1970 glitch
                xmlns: 'jabber:client'  // Required for raw XML nodes
            }
        };
        await s.sendNode(receiptNode);
    } catch (e) {
        console.log('[AUTOSTATUS] Fake timestamp failed:', e.message);
        try { await s.readMessages([m.key]); } catch {} // Fallback
    }

    // 500ms delay before reacting
    await delay(500);

    try {
        await reactToStatus(s, m.key);
    } catch (err) {
        console.log('[AUTOSTATUS] Reaction error:', err.message);
    }
}

// ---------------------------------------------------------------
// Queue per account so a burst of statuses is handled one at a time
// ---------------------------------------------------------------
const queues = new Map();
const pending = new Map();

function handleStatusUpdate(s, st) {
    const m = st.messages ? st.messages[0] : st;
    if (!m || !m.key) return Promise.resolve();

    const ts = Number(m.messageTimestamp || 0);
    if (ts && Date.now() / 1000 - ts > 600) return Promise.resolve();

    const key = accountKey(s);

    if ((pending.get(key) || 0) >= 20) return Promise.resolve();
    pending.set(key, (pending.get(key) || 0) + 1);

    const next = (queues.get(key) || Promise.resolve())
        .then(() => processStatus(s, st))
        .catch(() => {})
        .finally(() => pending.set(key, Math.max(0, (pending.get(key) || 1) - 1)));

    queues.set(key, next);
    return next;
}

function isEnabled(s) {
    try {
        return !!getConfig(s).enabled;
    } catch {
        return false;
    }
}

module.exports = [{
    command: 'autostatus',
    aliases: ['statusauto', 'autoview'],
    category: 'settings',
    owner: true,

    execute: async (s, m, { args, reply }) => {
        const c = getConfig(s);
        const a = args[0]?.toLowerCase();

        if (!a) {
            const emojiStatus = c.reactEmojis.length === 20 ? 'Random (20 Pairs) 🎲' : `Custom (${c.reactEmojis[0]})`;
            return reply(
                `📱 *Auto Status*

👁️ View: ${c.enabled ? 'ON ✅' : 'OFF ❌'}
💫 React: ${c.reactOn ? 'ON ✅' : 'OFF ❌'}
❤️ Emoji: ${emojiStatus}

.autostatus on/off
.autostatus react on/off
.autostatus emoji 😍 (or type "random" to reset)`
            );
        }

        if (a === 'on') {
            c.enabled = true;
            saveConfig(s, c);
            return reply('✅ Auto status view enabled!');
        }

        if (a === 'off') {
            c.enabled = false;
            saveConfig(s, c);
            return reply('❌ Auto status view disabled!');
        }

        if (a === 'react') {
            const x = args[1]?.toLowerCase();

            if (x === 'on') {
                c.reactOn = true;
                saveConfig(s, c);
                return reply('💫 Status reactions enabled!');
            }

            if (x === 'off') {
                c.reactOn = false;
                saveConfig(s, c);
                return reply('❌ Status reactions disabled!');
            }

            return reply('❌ Use: .autostatus react on/off');
        }

        if (a === 'emoji') {
            const text = args.slice(1).join(' ').trim();
            if (!text) return reply('❌ Provide emojis or type "random"!');

            if (text.toLowerCase() === 'random') {
                c.reactEmoji = 'random';
                c.reactEmojis = defaultEmojiPairs;
                saveConfig(s, c);
                return reply('🎲 Emojis reset to the 20 default random pairs!');
            }

            // 🎯 LIMIT CHECK: Extract only actual emojis from the text
            const emojisFound = text.match(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*/gu) || [];

            if (emojisFound.length === 0) {
                return reply('❌ No emojis detected. Please provide 1 or 2 emojis.');
            }

            if (emojisFound.length > 2) {
                return reply(`❌ Maximum of 2 emojis allowed to protect the timestamp!\nYou sent ${emojisFound.length} emojis.`);
            }

            const customReaction = emojisFound.join(''); // Combines 1 or 2 emojis

            // 🎯 THE LOCK: Force it to stay 'random' in the JSON
            c.reactEmoji = 'random'; 
            c.reactEmojis = [customReaction];  
            saveConfig(s, c);
            
            return reply(`✅ Custom reaction set to: ${customReaction}\n_(Type .autostatus emoji random to reset to 20 pairs)_`);
        }

        return reply('❌ Usage: .autostatus on/off, .autostatus react on/off, .autostatus emoji ❤️');
    }
}];

module.exports.handleStatusUpdate = handleStatusUpdate;
module.exports.isEnabled = isEnabled;