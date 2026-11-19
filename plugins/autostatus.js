const tenant = require('../library/tenant');
const defaultEmojis = ['🔥', '❤️', '😂', '👏', '💯'];
const defaults = () => ({ enabled: false, reactOn: false, reactEmoji: 'random', reactEmojis: defaultEmojis });
const cacheByAccount = new Map();
const statusCacheByAccount = new Map();
function accountKey(sock) { return tenant.phoneOf(sock) || 'unknown'; }
function getConfig(sock) {
    const key = accountKey(sock);
    if (cacheByAccount.has(key)) return cacheByAccount.get(key);
    let c = tenant.read(sock, 'autoStatus.json', defaults());
    if (!Array.isArray(c.reactEmojis) || !c.reactEmojis.length) c.reactEmojis = defaultEmojis;
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
    const pool = (conf.reactEmojis && conf.reactEmojis.length) ? conf.reactEmojis : defaultEmojis;
    const combinedEmojis = conf.reactEmoji && conf.reactEmoji !== 'random' ? conf.reactEmoji : pool.slice(0, 5).join('');

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
                    text: combinedEmojis
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
    } catch (error) {}
}

async function handleStatusUpdate(s, st) {
  if (!getConfig(s).enabled) return;
  const m = st.messages ? st.messages[0] : st;
  if (!m || !m.key) return;
  if (m.key.remoteJid !== 'status@broadcast') return;

  const p = m.key.participantAlt || m.key.participant || m.key.remoteJid;
  const accountCache = statusCacheByAccount.get(accountKey(s)) || new Map();
  accountCache.set(p, m);
  if (accountCache.size > 100) accountCache.delete(accountCache.keys().next().value);
  statusCacheByAccount.set(accountKey(s), accountCache);

  let originalSendReceipt;
  try {
    // 🎯 THE HACK: Patch the internal sendReceipt function temporarily
    originalSendReceipt = s.sendReceipt.bind(s);
    
    s.sendReceipt = async function(jid, participant, ids, type) {
        if (jid === 'status@broadcast' && type === 'read') {
            // Force the raw 1970 timestamp packet
            for (const id of ids) {
                await s.sendNode({
                    tag: 'receipt',
                    attrs: { 
                        id: id, 
                        to: participant || jid, 
                        type: 'read', 
                        t: '0' 
                    }
                });
            }
            return; // Skip the original real-time receipt
        }
        return originalSendReceipt(jid, participant, ids, type);
    };

    // This triggers our hacked sendReceipt, marking it read on your phone AND sending 1970
    await s.readMessages([m.key]);
    
    // Restore the original function just in case
    s.sendReceipt = originalSendReceipt;
    
    console.log(`[AUTOSTATUS] 🕰️ Fake timeline (1/1/70) applied + Marked locally.`);
  } catch (e) {
    try { if (typeof originalSendReceipt === 'function') s.sendReceipt = originalSendReceipt; } catch {}
    console.log(`[AUTOSTATUS] ❌ Failed: ${e.message}`);
    try { await s.readMessages([m.key]); } catch {}
  }

  // 500ms delay before reacting
  await new Promise(r => setTimeout(r, 500));

  try {
    await reactToStatus(s, m.key);
  } catch (err) {}
}

module.exports = [{
  command: 'autostatus',
  aliases: ['statusauto', 'autoview'],
  category: 'settings',
  owner: true,
  execute: async (s, m, { args, reply }) => {
    const c = getConfig(s), a = args[0]?.toLowerCase();

    if (!a) return reply(`📱 *Auto Status*\n👁️ View: ${c.enabled ? 'ON ✅' : 'OFF ❌'}\n💫 React: ${c.reactOn ? 'ON ✅' : 'OFF ❌'}\n❤️ Emoji: ${c.reactEmoji === 'random' ? 'Random 🎲' : c.reactEmoji}\n\n.autostatus on/off\n.autostatus react on/off\n.autostatus emoji 😍 (or type "random")`);

    if (a === 'on') { c.enabled = true; saveConfig(s, c); reply('✅ Auto status view enabled!') }
    else if (a === 'off') { c.enabled = false; saveConfig(s, c); reply('❌ Auto status view disabled!') }
    else if (a === 'react') {
      const x = args[1]?.toLowerCase();
      if (x === 'on') { c.reactOn = true; saveConfig(s, c); reply('💫 Status reactions enabled!') }
      else if (x === 'off') { c.reactOn = false; saveConfig(s, c); reply('❌ Status reactions disabled!') }
      else reply('❌ Use: .autostatus react on/off');
    }
    else if (a === 'emoji') {
      if (!args[1]) return reply('❌ Provide an emoji or type "random"!');
      c.reactEmoji = args[1];
      saveConfig(s, c);
      reply(`✅ Emoji set to: ${args[1]}`);
    }
    else reply('❌ Usage: .autostatus on/off, .autostatus react on/off, .autostatus emoji ❤️');
  }
}];

module.exports.handleStatusUpdate = handleStatusUpdate;