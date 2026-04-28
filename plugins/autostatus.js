// © 2026 Alpha - AUTO STATUS (FIXED — PARTICIPANT IN KEY)

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

async function reactToStatus(sock, msg) {
    if (!isReactEnabled()) return;
    const emoji = getReactEmoji();
    try {
        const participant = msg.key.participant || msg.key.remoteJid;
        // Use the standard sock.sendMessage with react payload
        await sock.sendMessage('status@broadcast', {
            react: {
                text: emoji,
                key: {
                    remoteJid: 'status@broadcast',
                    id: msg.key.id,
                    participant: participant,
                    fromMe: false
                }
            }
        });
        console.log(`💚 Reacted to status from ${participant}`);
    } catch (err) {
        console.log('❌ Status reaction error:', err.message);
    }
}

async function handleStatusUpdate(sock, status) {
    if (!isAutoStatusEnabled()) return;

    // Determine the status message to read
    const msg = status.messages ? status.messages[0] : status;

    if (!msg || !msg.key) return;
    if (msg.key.remoteJid !== 'status@broadcast') return;

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // Build the key WITH participant — required for status read receipts
        const keyToRead = {
            remoteJid: 'status@broadcast',
            id: msg.key.id,
            participant: msg.key.participant || msg.key.remoteJid,
            fromMe: false
        };

        await sock.readMessages([keyToRead]);
        console.log(`👁️ Viewed status from ${msg.key.participant || msg.key.remoteJid}`);

        // React to the status if enabled
        await reactToStatus(sock, msg);

    } catch (err) {
        if (err.message?.includes('rate-overlimit')) {
            console.log('⚠️ Rate limit, retrying...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.readMessages([{
                    remoteJid: 'status@broadcast',
                    id: msg.key.id,
                    participant: msg.key.participant || msg.key.remoteJid,
                    fromMe: false
                }]);
            } catch (retryErr) {
                console.log('❌ Retry failed:', retryErr.message);
            }
        } else {
            console.log('❌ Status view error:', err.message);
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

// Export the handler for index.js
module.exports.handleStatusUpdate = handleStatusUpdate;