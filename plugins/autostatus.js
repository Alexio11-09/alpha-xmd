// © 2026 Alpha - AUTO STATUS (RELIABLE)

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../database/autoStatus.json');
if (!fs.existsSync(path.join(__dirname, '../database'))) fs.mkdirSync(path.join(__dirname, '../database'), { recursive: true });
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({ enabled: false, reactOn: false, reactEmoji: '🔥' }));

function getConfig() {
    try { return JSON.parse(fs.readFileSync(configPath)); } catch { return { enabled: false, reactOn: false, reactEmoji: '🔥' }; }
}
function saveConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function isAutoStatusEnabled() { return getConfig().enabled; }
function isReactEnabled() { return getConfig().reactOn; }
function getReactEmoji() { return getConfig().reactEmoji || '🔥'; }

async function reactToStatus(sock, statusKey) {
    if (!isReactEnabled()) return;
    const emoji = getReactEmoji();
    try {
        await sock.sendMessage('status@broadcast', {
            react: {
                text: emoji,
                key: {
                    remoteJid: 'status@broadcast',
                    id: statusKey.id,
                    participant: statusKey.participant || statusKey.remoteJid,
                    fromMe: false
                }
            }
        });
    } catch {}
}

async function handleStatusUpdate(sock, status) {
    if (!isAutoStatusEnabled()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Handle status from messages.upsert
    if (status.messages && status.messages.length > 0) {
        const msg = status.messages[0];
        if (msg.key && msg.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([msg.key]);
                await reactToStatus(sock, msg.key);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([msg.key]);
                }
            }
            return;
        }
    }

    // Handle direct status updates
    if (status.key && status.key.remoteJid === 'status@broadcast') {
        try {
            await sock.readMessages([status.key]);
            await reactToStatus(sock, status.key);
        } catch (err) {
            if (err.message?.includes('rate-overlimit')) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await sock.readMessages([status.key]);
            }
        }
        return;
    }

    // Handle status in reactions
    if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
        try {
            await sock.readMessages([status.reaction.key]);
            await reactToStatus(sock, status.reaction.key);
        } catch (err) {
            if (err.message?.includes('rate-overlimit')) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await sock.readMessages([status.reaction.key]);
            }
        }
    }
}

// Owner command to toggle settings
module.exports = [
    {
        command: "autostatus",
        aliases: ["statusauto", "autoview"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const config = getConfig();
            const action = args[0]?.toLowerCase();

            if (!action) {
                const view = config.enabled ? 'ON ✅' : 'OFF ❌';
                const react = config.reactOn ? 'ON ✅' : 'OFF ❌';
                const emoji = config.reactEmoji || '🔥';
                return reply(`📱 *Auto Status*\n👁️ View: ${view}\n💫 React: ${react}\n❤️ Emoji: ${emoji}\n\n.autostatus on/off\n.autostatus react on/off\n.autostatus emoji 😍`);
            }

            if (action === 'on') {
                config.enabled = true; saveConfig(config);
                reply("✅ Auto status view enabled!");
            } else if (action === 'off') {
                config.enabled = false; saveConfig(config);
                reply("❌ Auto status view disabled!");
            } else if (action === 'react') {
                const sub = args[1]?.toLowerCase();
                if (sub === 'on') { config.reactOn = true; saveConfig(config); reply("💫 Status reactions enabled!"); }
                else if (sub === 'off') { config.reactOn = false; saveConfig(config); reply("❌ Status reactions disabled!"); }
                else reply("❌ Use: .autostatus react on/off");
            } else if (action === 'emoji') {
                if (!args[1]) return reply("❌ Provide an emoji!");
                config.reactEmoji = args[1]; saveConfig(config);
                reply(`✅ Reaction emoji set to: ${args[1]}`);
            } else {
                reply("❌ Usage: .autostatus on/off, .autostatus react on/off, .autostatus emoji ❤️");
            }
        }
    }
];

// export the handler for index.js
module.exports.handleStatusUpdate = handleStatusUpdate;