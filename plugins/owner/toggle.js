const fs = require('fs');
const settingsPath = './database/settings.json';

module.exports = {
    command: ['autoread', 'typing', 'antidelete', 'autoreact'],
    category: 'owner',
    owner: true,

    execute: async (sock, m, { command, args, reply }) => {
        let settings = JSON.parse(fs.readFileSync(settingsPath));

        if (!args[0]) {
            return reply(`⚙️ Usage:\n.${command} on\n.${command} off`);
        }

        const value = args[0].toLowerCase();

        if (!['on', 'off'].includes(value)) {
            return reply("❌ Use on/off");
        }

        settings[command] = value === 'on';

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

        reply(`✅ ${command} is now ${value.toUpperCase()}`);
    }
};