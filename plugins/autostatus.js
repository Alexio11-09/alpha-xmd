const fs = require('fs'), path = require('path'), configPath = path.join(__dirname, '../database/autoStatus.json');
fs.existsSync(path.join(__dirname, '../database')) || fs.mkdirSync(path.join(__dirname, '../database'), { recursive: true });

const defaultEmojis = ['🔥', '❤️', '😂', '😮', '😢', '🙏', '👏', '💯', '✨', '💚', '⚡', '👀'];
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

async function reactToStatus(s, statusKey) {
    if (!isReactEnabled()) return;

    const conf = getConfig();
    let e;
    if (conf.reactEmoji && conf.reactEmoji !== 'random') {
        e = conf.reactEmoji;
    } else {
        const pool = (conf.reactEmojis && conf.reactEmojis.length) ? conf.reactEmojis : defaultEmojis;
        e = pool[Math.floor(Math.random() * pool.length)];
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
                    text: e
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
    const receiptNode = {
        tag: 'receipt',
        attrs: {
            id: m.key.id,
            to: p,
            type: 'read',
            t: '0'
        }
    };
    await s.relayMessage('status@broadcast', receiptNode, {});
  } catch (e) {
    try { await s.readMessages([m.key]); } catch {}
  }

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
        `.autostatus emoji random\n` +
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
          `❌ Provide emoji(s), *random*, or *reset*.\n\n` +
          `*Examples:*\n` +
          `.autostatus emoji 🐤👻👋😀🥺\n` +
          `.autostatus emoji 🐤 👻 👋\n` +
          `.autostatus emoji random\n` +
          `.autostatus emoji reset\n\n` +
          `_Bot picks ONE random emoji from your set per status. Max 5._`
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
          `*Usage:*\n.autostatus emoji 🐤👻👋😀🥺\n\n` +
          `Bot picks one random emoji from your set per status. Max 5.`
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
        `Bot will pick *one random* emoji from this pool per status.`
      );
    }

    return reply('❌ Usage: .autostatus, on, off, react on/off, emoji <emojis>');
  }
}];

module.exports.handleStatusUpdate = handleStatusUpdate;