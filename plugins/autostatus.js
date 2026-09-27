const fs = require('fs'), path = require('path'), configPath = path.join(__dirname, '../database/autoStatus.json');
fs.existsSync(path.join(__dirname, '../database')) || fs.mkdirSync(path.join(__dirname, '../database'), { recursive: true });
fs.existsSync(configPath) || fs.writeFileSync(configPath, JSON.stringify({ enabled: false, reactOn: false, reactEmoji: '🔥' }));
global.statusCache || (global.statusCache = new Map());
function getConfig() { try { return JSON.parse(fs.readFileSync(configPath)) } catch { return { enabled: false, reactOn: false, reactEmoji: '🔥' } } }
function saveConfig(d) { fs.writeFileSync(configPath, JSON.stringify(d, null, 2)) }
function isAutoStatusEnabled() { return getConfig().enabled }
function isReactEnabled() { return getConfig().reactOn }
function getReactEmoji() { return getConfig().reactEmoji || '🔥' }

async function reactToStatus(s, m) {
  if (!isReactEnabled()) { console.log('⏸️ Status react: disabled'); return }
  let e = getReactEmoji(), p = m.key.participantAlt || m.key.participant || m.key.remoteJid;
  console.log(`💫 Status react: emoji=${e}, to=${p}, msgId=${m.key.id}`);

  const timeout = (promise, ms) => Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  // Method 1: relayMessage (most reliable on 6.7.24 with LID)
  try {
    await timeout(s.relayMessage('status@broadcast', {
      reactionMessage: {
        key: { remoteJid: 'status@broadcast', id: m.key.id, participant: p, fromMe: false },
        text: e
      }
    }, { messageId: m.key.id, statusJidList: [p] }), 5000);
    console.log(`✅ Reacted with ${e}`);
    return;
  } catch (err) { console.log('❌ relayMessage:', err.message) }

  // Method 2: sendMessage fallback
  try {
    await timeout(s.sendMessage('status@broadcast', {
      react: { text: e, key: m.key }
    }, { statusJidList: [p] }), 5000);
    console.log(`✅ Reacted with ${e} (via sendMessage)`);
  } catch (err) { console.log('❌ sendMessage:', err.message) }
}

async function handleStatusUpdate(s, st) {
  if (!isAutoStatusEnabled()) return;
  let m = st.messages ? st.messages[0] : st;
  if (!m || !m.key) return;
  if (m.key.remoteJid !== 'status@broadcast') return;
  let p = m.key.participantAlt || m.key.participant || m.key.remoteJid;
  global.statusCache.set(p, m);
  if (global.statusCache.size > 100) { let f = global.statusCache.keys().next().value; global.statusCache.delete(f) }
  await new Promise(r => setTimeout(r, 1000));
  try {
    await s.readMessages([m.key]);
    await reactToStatus(s, m);
  } catch (err) {
    if (err.message?.includes('rate-overlimit')) {
      await new Promise(r => setTimeout(r, 2000));
      try { await s.readMessages([m.key]) } catch {}
    }
  }
}

module.exports = [{
  command: 'autostatus', aliases: ['statusauto', 'autoview'], category: 'settings', owner: !0, execute: async (s, m, { args, reply }) => {
    let c = getConfig(), a = args[0]?.toLowerCase();
    if (!a) return reply(`📱 *Auto Status*\n👁️ View: ${c.enabled ? 'ON ✅' : 'OFF ❌'}\n💫 React: ${c.reactOn ? 'ON ✅' : 'OFF ❌'}\n❤️ Emoji: ${c.reactEmoji || '🔥'}\n\n.autostatus on/off\n.autostatus react on/off\n.autostatus emoji 😍`);
    if (a === 'on') { c.enabled = !0; saveConfig(c); reply('✅ Auto status view enabled!') }
    else if (a === 'off') { c.enabled = !1; saveConfig(c); reply('❌ Auto status view disabled!') }
    else if (a === 'react') { let x = args[1]?.toLowerCase(); if (x === 'on') { c.reactOn = !0; saveConfig(c); reply('💫 Status reactions enabled!') } else if (x === 'off') { c.reactOn = !1; saveConfig(c); reply('❌ Status reactions disabled!') } else reply('❌ Use: .autostatus react on/off') }
    else if (a === 'emoji') { if (!args[1]) return reply('❌ Provide an emoji!'); c.reactEmoji = args[1]; saveConfig(c); reply(`✅ Emoji set to: ${args[1]}`) }
    else reply('❌ Usage: .autostatus on/off, .autostatus react on/off, .autostatus emoji ❤️')
  }
}];
module.exports.handleStatusUpdate = handleStatusUpdate;