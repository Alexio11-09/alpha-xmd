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
  if (!isReactEnabled()) return;
  const e = getReactEmoji();
  const p = m.key.participantAlt || m.key.participant || m.key.remoteJid;
  if (!p) return;

  try {
    await Promise.race([
      s.sendMessage('status@broadcast', {
        react: { text: e, key: { remoteJid: 'status@broadcast', id: m.key.id, participant: p, fromMe: false } }
      }, { statusJidList: [p] }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
    ]);
    console.log(`✅ Status reacted with ${e}`);
  } catch (err) {
    console.log(`❌ Status react failed: ${err.message}`);
  }
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

  await new Promise(r => setTimeout(r, 1000));
  try {
    await s.readMessages([m.key]);
    console.log(`👁️ Status viewed from ${p}`);
    await reactToStatus(s, m);
  } catch (err) {
    if (err.message?.includes('rate-overlimit')) {
      await new Promise(r => setTimeout(r, 2000));
      try { await s.readMessages([m.key]) } catch {}
    }
  }
}

module.exports = [{
  command: 'autostatus',
  aliases: ['statusauto', 'autoview'],
  category: 'settings',
  owner: true,
  execute: async (s, m, { args, reply }) => {
    const c = getConfig(), a = args[0]?.toLowerCase();
    if (!a) return reply(`📱 *Auto Status*\n👁️ View: ${c.enabled ? 'ON ✅' : 'OFF ❌'}\n💫 React: ${c.reactOn ? 'ON ✅' : 'OFF ❌'}\n❤️ Emoji: ${c.reactEmoji || '🔥'}\n\n.autostatus on/off\n.autostatus react on/off\n.autostatus emoji 😍`);
    if (a === 'on') { c.enabled = true; saveConfig(c); reply('✅ Auto status view enabled!') }
    else if (a === 'off') { c.enabled = false; saveConfig(c); reply('❌ Auto status view disabled!') }
    else if (a === 'react') {
      const x = args[1]?.toLowerCase();
      if (x === 'on') { c.reactOn = true; saveConfig(c); reply('💫 Status reactions enabled!') }
      else if (x === 'off') { c.reactOn = false; saveConfig(c); reply('❌ Status reactions disabled!') }
      else reply('❌ Use: .autostatus react on/off');
    }
    else if (a === 'emoji') {
      if (!args[1]) return reply('❌ Provide an emoji!');
      c.reactEmoji = args[1];
      saveConfig(c);
      reply(`✅ Emoji set to: ${args[1]}`);
    }
    else reply('❌ Usage: .autostatus on/off, .autostatus react on/off, .autostatus emoji ❤️');
  }
}];

module.exports.handleStatusUpdate = handleStatusUpdate;