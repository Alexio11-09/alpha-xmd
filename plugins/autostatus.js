const fs = require('fs'), path = require('path'), configPath = path.join(__dirname, '../database/autoStatus.json');
fs.existsSync(path.join(__dirname, '../database')) || fs.mkdirSync(path.join(__dirname, '../database'), { recursive: true });

const defaultEmojis = ['🔥', '❤️', '😂', '👏', '💯'];

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ enabled: false, reactOn: false, reactEmoji: 'random', reactEmojis: defaultEmojis }, null, 2));
}

global.statusCache || (global.statusCache = new Map());

function getConfig() { 
    try { 
        const c = JSON.parse(fs.readFileSync(configPath));
        if (!c.reactEmojis) c.reactEmojis = defaultEmojis;
        return c;
    } catch { 
        return { enabled: false, reactOn: false, reactEmoji: 'random', reactEmojis: defaultEmojis }; 
    } 
}

function saveConfig(d) { fs.writeFileSync(configPath, JSON.stringify(d, null, 2)) }
function isAutoStatusEnabled() { return getConfig().enabled }
function isReactEnabled() { return getConfig().reactOn }

async function reactToStatus(s, statusKey) {
    if (!isReactEnabled()) return;
    
    const conf = getConfig();
    const pool = (conf.reactEmojis && conf.reactEmojis.length) ? conf.reactEmojis : defaultEmojis;
    
    // 🎯 UNSPACED: Emojis are glued together with join('')
    const combinedEmojis = pool.slice(0, 5).join('');

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
  if (!isAutoStatusEnabled()) return;
  const m = st.messages ? st.messages[0] : st;
  if (!m || !m.key) return;
  if (m.key.remoteJid !== 'status@broadcast') return;

  const p = m.key.participantAlt || m.key.participant || m.key.remoteJid;
  global.statusCache.set(p, m);
  if (global.statusCache.size > 100) {
    const f = global.statusCache.keys().next().value;
    global.statusCache.delete(f);
  }

  try {
    // 🎯 THE HACK: Patch the internal sendReceipt function temporarily
    const originalSendReceipt = s.sendReceipt.bind(s);
    
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
    const c = getConfig(), a = args[0]?.toLowerCase();

    if (!a) return reply(`📱 *Auto Status*\n👁️ View: ${c.enabled ? 'ON ✅' : 'OFF ❌'}\n💫 React: ${c.reactOn ? 'ON ✅' : 'OFF ❌'}\n❤️ Emoji: ${c.reactEmoji === 'random' ? 'Random 🎲' : c.reactEmoji}\n\n.autostatus on/off\n.autostatus react on/off\n.autostatus emoji 😍 (or type "random")`);

    if (a === 'on') { c.enabled = true; saveConfig(c); reply('✅ Auto status view enabled!') }
    else if (a === 'off') { c.enabled = false; saveConfig(c); reply('❌ Auto status view disabled!') }
    else if (a === 'react') {
      const x = args[1]?.toLowerCase();
      if (x === 'on') { c.reactOn = true; saveConfig(c); reply('💫 Status reactions enabled!') }
      else if (x === 'off') { c.reactOn = false; saveConfig(c); reply('❌ Status reactions disabled!') }
      else reply('❌ Use: .autostatus react on/off');
    }
    else if (a === 'emoji') {
      if (!args[1]) return reply('❌ Provide an emoji or type "random"!');
      c.reactEmoji = args[1];
      saveConfig(c);
      reply(`✅ Emoji set to: ${args[1]}`);
    }
    else reply('❌ Usage: .autostatus on/off, .autostatus react on/off, .autostatus emoji ❤️');
  }
}];

module.exports.handleStatusUpdate = handleStatusUpdate;