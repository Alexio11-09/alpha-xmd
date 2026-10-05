const fs = require('fs'), path = require('path');
const configPath = path.join(__dirname, '../database/autoStatus.json');

fs.existsSync(path.join(__dirname, '../database')) || fs.mkdirSync(path.join(__dirname, '../database'), { recursive: true });
fs.existsSync(configPath) || fs.writeFileSync(configPath, JSON.stringify({ enabled: false, reactOn: false, reactEmoji: '🔥' }));

function getConfig() { try { return JSON.parse(fs.readFileSync(configPath)) } catch { return { enabled: false, reactOn: false, reactEmoji: '🔥' } } }
function saveConfig(d) { fs.writeFileSync(configPath, JSON.stringify(d, null, 2)) }

module.exports = [{
  command: 'autostatus',
  aliases: ['statusauto', 'autoview'],
  category: 'settings',
  owner: true,
  execute: async (s, m, { args, reply }) => {
    const c = getConfig(), a = args[0]?.toLowerCase();

    if (!a) return reply(`📱 *Auto Status*\n👁️ View: ${c.enabled ? 'ON ✅' : 'OFF ❌'}\n💫 React: ${c.reactOn ? 'ON ✅' : 'OFF ❌'}\n❤️ Emoji: ${c.reactEmoji || '🔥'}\n\n.autostatus on/off\n.autostatus react on/off\n.autostatus emoji 😍`);

    if (a === 'on') {
      c.enabled = true;
      saveConfig(c);
      reply('✅ Auto status view enabled!');
    }
    else if (a === 'off') {
      c.enabled = false;
      saveConfig(c);
      reply('❌ Auto status view disabled!');
    }
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