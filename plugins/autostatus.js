const fs = require('fs'), path = require('path'), configPath = path.join(__dirname, '../database/autoStatus.json');
fs.existsSync(path.join(__dirname, '../database')) || fs.mkdirSync(path.join(__dirname, '../database'), { recursive: true });

const defaultEmojis = ['🔥', '❤️', '😂', '👏', '💯'];
const MAX_CUSTOM_EMOJIS = 5;

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ enabled: false, reactOn: false, reactEmoji: 'random', reactEmojis: defaultEmojis }, null, 2));
}

global.statusCache || (global.statusCache = new Map());

function getConfig() { 
    try { 
        const c = JSON.parse(fs.readFileSync(configPath));
        if (!c.reactEmojis || !Array.isArray(c.reactEmojis) || !c.reactEmojis.length) c.reactEmojis = defaultEmojis;
        return c;
    } catch { 
        return { enabled: false, reactOn: false, reactEmoji: 'random', reactEmojis: defaultEmojis }; 
    } 
}

function saveConfig(d) { fs.writeFileSync(configPath, JSON.stringify(d, null, 2)) }
function isAutoStatusEnabled() { return getConfig().enabled }
function isReactEnabled() { return getConfig().reactOn }

// 🎯 Extract emojis from text — handles ZWJ sequences, skin tones, variation selectors
function extractEmojis(text) {
    if (!text) return [];
    const regex = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*/gu;
    return text.match(regex) || [];
}

// 🎯 Helper: Resolve JIDs to ensure LID/PN alignment
async function getAlignedJid(s, jid) {
    if (!jid) return null;
    if (s.user && s.user.lid && s.signalRepository?.lidMapping) {
        try {
            const lid = await s.signalRepository.lidMapping.getLIDForPN(jid);
            if (lid) return lid;
        } catch (e) {}
    }
    return jid;
}

async function reactToStatus(s, statusKey) {
    if (!isReactEnabled()) return;

    const conf = getConfig();
    let emojis;

    if (conf.reactEmoji && conf.reactEmoji !== 'random' && conf.reactEmoji.trim()) {
        emojis = [conf.reactEmoji];
    } else {
        emojis = (conf.reactEmojis && conf.reactEmojis.length) ? conf.reactEmojis : defaultEmojis;
    }

    // Combine into ONE string to bypass the 1-reaction limit
    const combinedEmojis = emojis.join('');

    const rawSender = statusKey.participantAlt || statusKey.participant || statusKey.remoteJid;
    const alignedSender = await getAlignedJid(s, rawSender);
    const botJid = (s.user && s.user.lid) ? s.user.lid : (s.user ? s.user.id.split(':')[0] + '@s.whatsapp.net' : '0@s.whatsapp.net');

    try {
        await s.sendMessage('status@broadcast', {
            react: {
                text: combinedEmojis,
                key: {
                    remoteJid: 'status@broadcast',
                    id: statusKey.id,
                    participant: alignedSender,
                    fromMe: false
                }
            }
        }, {
            statusJidList: [botJid, alignedSender]
        });
        console.log(`[AUTOSTATUS] ✅ Reacted with ${combinedEmojis}`);
    } catch (err) {
        console.log(`[AUTOSTATUS] ❌ Reaction failed: ${err.message}`);
    }
}

async function handleStatusUpdate(s, st) {
  if (!isAutoStatusEnabled()) return;
  const m = st.messages ? st.messages[0] : st;
  if (!m || !m.key) return;
  if (m.key.remoteJid !== 'status@broadcast') return;

  const rawSender = m.key.participantAlt || m.key.participant || m.key.remoteJid;
  const alignedSender = await getAlignedJid(s, rawSender);

  // 🎯 THE FIX: Send raw receipt via sendNode (NOT relayMessage)
  let viewed = false;
  try {
    const receiptNode = {
        tag: 'receipt',
        attrs: {
            id: m.key.id,
            to: alignedSender,
            type: 'read',
            t: '0',                 // The magic glitch: timestamp 0
            xmlns: 'jabber:client'  // Required for raw XML nodes
        }
    };
    await s.sendNode(receiptNode); 
    viewed = true;
    console.log(`[AUTOSTATUS] 🕰️ Fake timeline view (1/1/70) applied.`);
  } catch(e) {
    console.log(`[AUTOSTATUS] ❌ Fake timeline failed: ${e.message}`);
  }

  // 🎯 FALLBACK: Only use standard read if raw node fails
  if (!viewed) {
    try {
        await s.readMessages([m.key]);
        console.log(`[AUTOSTATUS] 👁️ Standard autoview applied (Fallback).`);
    } catch (e) {}
  }

  // 🎯 REACT
  await new Promise(r => setTimeout(r, 500));
  try { await reactToStatus(s, m.key); } catch (err) {}
}

module.exports = [{
  command: 'autostatus',
  aliases: ['statusauto', 'autoview'],
  category: 'settings',
  owner: true,
  execute: async (s, m, { args, reply }) => {
    const c = getConfig(), a = args[0]?.toLowerCase();
    const pool = c.reactEmojis || defaultEmojis;

    // ─── Show panel ───
    if (!a) return reply(
        `📱 *Auto Status*\n` +
        `──────────────────\n` +
        `👁️ View      : ${c.enabled ? 'ON ✅' : 'OFF ❌'}\n` +
        `💫 React     : ${c.reactOn ? 'ON ✅' : 'OFF ❌'}\n` +
        `🎯 Mode      : ${c.reactEmoji === 'random' ? 'Random 🎲' : 'Fixed ' + c.reactEmoji}\n` +
        `🎨 Pool (${pool.length})  : ${pool.join(' ')}\n` +
        `──────────────────\n` +
        `*Commands:*\n` +
        `.autostatus on/off\n` +
        `.autostatus react on/off\n` +
        `.autostatus emoji 🐤👻👋😀🥺 (up to 5)\n` +
        `.autostatus emoji reset`
    );

    // ─── Master toggle ───
    if (a === 'on')  { c.enabled = true;  saveConfig(c); return reply('✅ Auto status view enabled!'); }
    if (a === 'off') { c.enabled = false; saveConfig(c); return reply('❌ Auto status view disabled!'); }

    // ─── React toggle ───
    if (a === 'react') {
      const x = args[1]?.toLowerCase();
      if (x === 'on')  { c.reactOn = true;  saveConfig(c); return reply('💫 Status reactions enabled!'); }
      if (x === 'off') { c.reactOn = false; saveConfig(c); return reply('❌ Status reactions disabled!'); }
      return reply('❌ Use: .autostatus react on/off');
    }

    // ─── Emoji pool ───
    if (a === 'emoji') {
      const raw = args.slice(1).join(' ').trim();

      if (!raw) {
        return reply(
          `❌ Provide emoji(s) or *reset*.\n\n` +
          `*Examples:*\n` +
          `.autostatus emoji 🐤👻👋😀🥺\n` +
          `.autostatus emoji reset`
        );
      }

      const lower = raw.toLowerCase();

      if (lower === 'random' || lower === 'reset') {
        c.reactEmoji = 'random';
        c.reactEmojis = defaultEmojis;
        saveConfig(c);
        return reply(`🎲 Reset to default pool (${defaultEmojis.length} emojis):\n${defaultEmojis.join(' ')}`);
      }

      const found = extractEmojis(raw);

      if (!found.length) {
        return reply(
          `❌ No emojis detected in your message.\n\n` +
          `*Usage:*\n.autostatus emoji 🐤👻👋😀🥺`
        );
      }

      if (found.length > MAX_CUSTOM_EMOJIS) {
        const trimmed = found.slice(0, MAX_CUSTOM_EMOJIS);
        return reply(
          `❌ Too many emojis (${found.length}). Maximum is *${MAX_CUSTOM_EMOJIS}*.\n\n` +
          `Try:\n.autostatus emoji ${trimmed.join('')}`
        );
      }

      c.reactEmojis = found;
      c.reactEmoji = 'random';
      saveConfig(c);

      return reply(
        `✅ Emoji pool set (${found.length}/${MAX_CUSTOM_EMOJIS}):\n` +
        `${found.join(' ')}\n\n` +
        `Bot will combine these into ONE reaction per status.`
      );
    }

    return reply('❌ Usage: .autostatus, on, off, react on/off, emoji <emojis>');
  }
}];

module.exports.handleStatusUpdate = handleStatusUpdate;