const tenant = require('../library/tenant');

const defaultEmojis = ['🔥', '❤️', '😂', '👏', '💯'];

const defaults = () => ({
    enabled: false,
    reactOn: false,
    reactEmoji: 'random',
    reactEmojis: defaultEmojis
});

const cacheByAccount = new Map();
const statusCacheByAccount = new Map();

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
        c.reactEmojis = defaultEmojis;
    }

    const merged = { ...defaults(), ...c };

    cacheByAccount.set(key, merged);
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

    const pool = conf.reactEmojis?.length
        ? conf.reactEmojis
        : defaultEmojis;

    const combinedEmojis =
        conf.reactEmoji && conf.reactEmoji !== 'random'
            ? conf.reactEmoji
            : pool.slice(0, 5).join('');

    try {
        await s.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant:
                            statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: combinedEmojis
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

async function handleStatusUpdate(s, st) {
    const conf = getConfig(s);

    if (!conf.enabled) return;

    const m = st.messages ? st.messages[0] : st;

    if (!m || !m.key) return;
    if (m.key.remoteJid !== 'status@broadcast') return;

    const p =
        m.key.participantAlt ||
        m.key.participant ||
        m.key.remoteJid;

    const key = accountKey(s);

    let accountCache =
        statusCacheByAccount.get(key) || new Map();

    accountCache.set(p, m);

    if (accountCache.size > 100) {
        accountCache.delete(accountCache.keys().next().value);
    }

    statusCacheByAccount.set(key, accountCache);

    let originalSendReceipt;
    let patched = false;
    let fakeReceiptSent = false;

    try {
        if (typeof s.sendReceipt !== 'function') {
            throw new Error('sendReceipt is unavailable');
        }

        originalSendReceipt = s.sendReceipt;

        // Temporarily intercept status read receipts.
        s.sendReceipt = async function (jid, participant, ids, type) {
            if (jid === 'status@broadcast' && type === 'read') {
                for (const id of ids) {
                    await s.sendNode({
                        tag: 'receipt',
                        attrs: {
                            id,
                            to: participant || jid,
                            type: 'read',
                            t: '0'
                        }
                    });

                    fakeReceiptSent = true;
                }

                return;
            }

            return originalSendReceipt.call(
                this,
                jid,
                participant,
                ids,
                type
            );
        };

        patched = true;

        // Trigger the intercepted receipt.
        await s.readMessages([m.key]);

        if (fakeReceiptSent) {
            console.log(
                '[AUTOSTATUS] Modified status receipt sent (t=0).'
            );
        } else {
            console.log(
                '[AUTOSTATUS] No modified receipt was confirmed.'
            );
        }

    } catch (e) {
        console.log(
            '[AUTOSTATUS] Fake timestamp attempt failed:',
            e.message
        );

        // IMPORTANT:
        // Do not send a normal read receipt as a fallback.
        // That could send the actual viewing time.
    } finally {
        // Always restore the original function.
        if (patched) {
            s.sendReceipt = originalSendReceipt;
        }
    }

    // Keep the existing reaction delay.
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        await reactToStatus(s, m.key);
    } catch (err) {
        console.log('[AUTOSTATUS] Reaction error:', err.message);
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
.autostatus emoji 😍
.autostatus emoji random`
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
                    '❌ Provide an emoji or type "random"!'
                );
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