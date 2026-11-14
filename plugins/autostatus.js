const fs = require('fs'), path = require('path'), configPath = path.join(__dirname, '../database/autoStatus.json');
fs.existsSync(path.join(__dirname, '../database')) || fs.mkdirSync(path.join(__dirname, '../database'), { recursive: true });

const defaultEmojis = ['🔥', '❤️', '😂', '😮', '😢', '🙏', '👏', '💯', '✨', '💚', '⚡', '👀'];

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

// 🎯 THE KNIGHTBOT REACTION METHOD (With "Goated alpha" text)
async function reactToStatus(s, statusKey) {
    if (!isReactEnabled()) return;
    
    const conf = getConfig();
    let e = (conf.reactEmoji && conf.reactEmoji !== 'random') ? conf.reactEmoji : (conf.reactEmojis || defaultEmojis)[Math.floor(Math.random() * (conf.reactEmojis || defaultEmojis).length)];

    // 🎯 The exact text you want to appear with the emoji
    const finalReaction = `${e} Goated alpha`;

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
                    text: finalReaction // 🎯 Sends "🔥 Goated alpha"
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
    } catch (error) {
        // Silent fail
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

  // 🎯 1.5 SECOND DELAY BEFORE VIEWING
  // This ensures WhatsApp fully registers the status so your bot's number 
  // definitely shows up in the "Viewed by" list.
  await new Promise(r => setTimeout(r, 1500));

  // 🎯 VIEW THE STATUS
  try {
    await s.readMessages([m.key]);
  } catch (e) {
    // Ignore read errors
  }

  // 🎯 500MS DELAY BEFORE REACTING
  // Ensures the view packet is processed before the reaction is sent.
  await new Promise(r => setTimeout(r, 500));

  try {
    await reactToStatus(s, m.key);
  } catch (err) {
    // Silent fail
  }
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