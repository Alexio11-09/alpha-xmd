const fs = require('fs');
const settingsPath = './database/settings.json';

module.exports = {
    command: "mode",
    category: "owner",
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        let settings = JSON.parse(fs.readFileSync(settingsPath));

        if (!args[0]) {
            return reply("⚙️ Usage:\n.mode public\n.mode self");
        }

        const mode = args[0].toLowerCase();

        if (!['public', 'self'].includes(mode)) {
            return reply("❌ Choose public or self");
        }

        settings.mode = mode;

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

        reply(`✅ Mode set to ${mode.toUpperCase()}`);
    }
};