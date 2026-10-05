const fs = require('fs'), path = require('path'), configPath = path.join(__dirname, '../database/autoStatus.json');
fs.existsSync(path.join(__dirname, '../database')) || fs.mkdirSync(path.join(__dirname, '../database'), { recursive: true });
fs.existsSync(configPath) || fs.writeFileSync(configPath, JSON.stringify({ enabled: false, reactOn: false, reactEmoji: '🔥' }));
global.statusCache || (global.statusCache = new Map());

function getConfig() { try { return JSON.parse(fs.readFileSync(configPath)) } catch { return { enabled: false, reactOn: false, reactEmoji: '🔥' } } }
function saveConfig(d) { fs.writeFileSync(configPath, JSON.stringify(d, null, 2)) }
function isAutoStatusEnabled() { return getConfig().enabled }
function isReactEnabled() { return getConfig().reactOn }
function getReactEmoji() { return getConfig().reactEmoji || '🔥' }

// ✅ FIX: Detect addressing mode from JID (lid vs pn)
function getAddressingMode(jid) {
  if (!jid) return 'pn';
  return jid.endsWith('@lid') ? 'lid' : 'pn';
}

// ✅ FIX: Build proper reaction key with addressing mode
function buildStatusReactionKey(msg, participantJid) {
  return {
    remoteJid: 'status@broadcast',
    id: msg.key.id,
    participant: participantJid,
    fromMe: false,
    addressingMode: getAddressingMode(participantJid)
  };
}

// ✅ FIX: Try multiple candidate JIDs with proper addressing mode
async function reactToStatus(s, m) {
  if (!isReactEnabled()) { console.log('⏸️ Status react: disabled'); return; }
  const e = getReactEmoji();

  // Collect all possible JIDs (prefer participantAlt — that's the phone number for LID contacts)
  const candidates = [
    m.key.participantAlt,
    m.key.remoteJidAlt,
    m.key.participant,
    m.key.remoteJid
  ].filter(Boolean).filter(j => j !== 'status@broadcast');

  if (!candidates.length) {
    console.log('❌ Status react: no valid participant JID');
    return;
  }

  console.log(`💫 Status react: emoji=${e}, candidates=${candidates.map(c => c + ' (' + getAddressingMode(c) + ')').join(' | ')}`);

  for (const p of candidates) {
    const mode = getAddressingMode(p);
    try {
      await Promise.race([
        s.sendMessage('status@broadcast', {
          react: {
            text: e,
            key: buildStatusReactionKey(m, p)
          }
        }, { statusJidList: [p] }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
      ]);
      console.log(`✅ Reacted via ${p} (mode: ${mode})`);
      return;
    } catch (err) {
      console.log(`❌ ${p} (mode: ${mode}) failed: ${err.message}`);
    }
  }
  console.log('❌ All reaction methods failed');
}

async function handleStatusUpdate(s, st) {
  if (!isAutoStatusEnabled()) return;
  const m = st.messages ? st.messages[0] : st;
  if (!m || !m.key) return;
  if (m.key.remoteJid !== 'status@broadcast') return;

  // Cache using the phone-number version if available
  const cacheKey = m.key.participantAlt || m.key.participant || m.key.remoteJid;
  global.statusCache.set(cacheKey, m);
  if (global.statusCache.size > 100) {
    const f = global.statusCache.keys().next().value;
    global.statusCache.delete(f);
  }

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