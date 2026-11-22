const tenant = require('../library/tenant');

// 🎯 20 default pairs of 2 emojis (Won't overlap the timestamp as much)
const defaultEmojiPairs = [
    '🔥❤️', '😂👏', '💯🔥', '👑💎', '🤯⚡', '🚀🎉', '💚✨', '😮😢', '🙏👀', '🍿🎬',
    '🎵🎧', '💻📱', '🌍🌟', '🏆🥇', '🤖💡', '🎯💥', '💖💫', '☀️🌙', '🌸🍃', '🍕🍔'
];

const defaults = () => ({
    enabled: false,
    reactOn: false,
    reactEmoji: 'random',
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

    let reactionText = '';

    // 🎯 If user set custom emojis, use them. Otherwise pick a random default pair.
    if (conf.reactEmoji && conf.reactEmoji !== 'random') {
        reactionText = conf.reactEmoji;
    } else {
        reactionText = defaultEmojiPairs[Math.floor(Math.random() * defaultEmojiPairs.length)];
    }

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
// Process one status (fake view timestamp + optional reaction)
// ---------------------------------------------------------------
async function processStatus(s, st) {
    const conf = getConfig(s);

    if (!conf.enabled) return;

    const m = st.messages ? st.messages[0] : st;

    if (!m || !m.key) return;
    if (m.key.remoteJid !== 'status@broadcast') return;

    const p = m.key.participantAlt || m.key.participant || m.key.remoteJid;

    // 🎯 RESTORED: THE FAKE TIMESTAMP (1/1/70) GLITCH
    try {
        const receiptNode = {
            tag: 'receipt',
            attrs: {
                id: m.key.id,
                to: p,
                type: 'read',
                t: '0',                 // Forces the 1970 glitch
                xmlns: 'jabber:client'  // Required for raw XML nodes to work
            }
        };
        await s.sendNode(receiptNode);
    } catch (e) {
        console.log('[AUTOSTATUS] Fake timestamp failed:', e.message);
        try { await s.readMessages([m.key]); } catch {} // Fallback
    }

    // 500ms delay before reacting so they don't clash
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

    // Ignore old backlog statuses (older than 10 minutes)
    const ts = Number(m.messageTimestamp || 0);
    if (ts && Date.now() / 1000 - ts > 600) return Promise.resolve();

    const key = accountKey(s);

    // Cap the backlog per account
    if ((pending.get(key) || 0) >= 20) return Promise.resolve();
    pending.set(key, (pending.get(key) || 0) + 1);

    const next = (queues.get(key) || Promise.resolve())
        .then(() => processStatus(s, st))
        .catch(() => {})
        .finally(() => pending.set(key, Math.max(0, (pending.get(key) || 1) - 1)));

    queues.set(key, next);
    return next;
}

// Lets index.js skip receiving statuses entirely for accounts that don't use this feature
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
            return reply(
                `📱 *Auto Status*

👁️ View: ${c.enabled ? 'ON ✅' : 'OFF ❌'}
💫 React: ${c.reactOn ? 'ON ✅' : 'OFF ❌'}
❤️ Emoji: ${c.reactEmoji === 'random' ? 'Random 🎲' : c.reactEmoji}

.autostatus on/off
.autostatus react on/off
.autostatus emoji 😍 (or type "random")`
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
            if (!args[1]) {
                return reply(
                    '❌ Provide emojis or type "random"!'
                );
            }

            if (args[1].toLowerCase() === 'random') {
                c.reactEmoji = 'random';
                saveConfig(s, c);
                return reply('🎲 Emojis reset to random pairs!');
            }

            c.reactEmoji = args[1];
            saveConfig(s, c);

            return reply(`✅ Emoji set to: ${args[1]}`);
        }

        return reply(
            '❌ Usage: .autostatus on/off, .autostatus react on/off, .autostatus emoji ❤️'
        );
    }
}];

module.exports.handleStatusUpdate = handleStatusUpdate;
module.exports.isEnabled = isEnabled;