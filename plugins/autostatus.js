// © 2026 Alpha - AUTO STATUS (WORKING VERSION FROM KNIGHTBOT)

const fs = require("fs");
const path = require("path");

// Path to store auto status configuration
const configPath = path.join(__dirname, "../database/autoStatus.json");

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    try {
        if (!fs.existsSync(path.join(__dirname, "../database"))) {
            fs.mkdirSync(path.join(__dirname, "../database"), { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify({ 
            enabled: false, 
            reactOn: false,
            reactEmoji: "🔥"
        }));
    } catch {}
}

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled || false;
    } catch {
        return false;
    }
}

// Function to check if status reactions are enabled
function isStatusReactionEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.reactOn || false;
    } catch {
        return false;
    }
}

// Function to get reaction emoji
function getReactionEmoji() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.reactEmoji || "🔥";
    } catch {
        return "🔥";
    }
}

// Function to react to status using proper relayMessage method
async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) return;

        const emoji = getReactionEmoji();
        
        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: emoji
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
    } catch (error) {}
}

// Function to handle status updates (called from index.js)
async function handleStatusUpdate(sock, status) {
    try {
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

    } catch (error) {}
}

// Command module
module.exports = [
    {
        command: "autostatus",
        aliases: ["statusview", "viewstatus"],
        category: "settings",
        owner: true,
        
        execute: async (sock, m, { args, reply, isOwner }) => {
            if (!isOwner) return reply("❌ Owner only!");
            
            try {
                let config = JSON.parse(fs.readFileSync(configPath));

                if (!args || args.length === 0) {
                    const status = config.enabled ? 'ON ✅' : 'OFF ❌';
                    const reactStatus = config.reactOn ? 'ON ✅' : 'OFF ❌';
                    const emoji = config.reactEmoji || '🔥';
                    
                    reply(`📱 *AUTO STATUS SETTINGS*\n\n` +
                          `👁️ Auto View: ${status}\n` +
                          `💫 Auto React: ${reactStatus}\n` +
                          `😍 React Emoji: ${emoji}\n\n` +
                          `*Commands:*\n` +
                          `.autostatus on - Enable auto view\n` +
                          `.autostatus off - Disable auto view\n` +
                          `.autostatus react on - Enable reactions\n` +
                          `.autostatus react off - Disable reactions\n` +
                          `.autostatus emoji [emoji] - Set reaction emoji`);
                    return;
                }

                const command = args[0].toLowerCase();

                if (command === 'on') {
                    config.enabled = true;
                    fs.writeFileSync(configPath, JSON.stringify(config));
                    reply("✅ Auto status view enabled!");
                    
                } else if (command === 'off') {
                    config.enabled = false;
                    fs.writeFileSync(configPath, JSON.stringify(config));
                    reply("❌ Auto status view disabled!");
                    
                } else if (command === 'react') {
                    if (!args[1]) {
                        return reply("❌ Use: .autostatus react on/off");
                    }
                    
                    const reactCommand = args[1].toLowerCase();
                    if (reactCommand === 'on') {
                        config.reactOn = true;
                        fs.writeFileSync(configPath, JSON.stringify(config));
                        reply("💫 Status reactions enabled!");
                    } else if (reactCommand === 'off') {
                        config.reactOn = false;
                        fs.writeFileSync(configPath, JSON.stringify(config));
                        reply("❌ Status reactions disabled!");
                    } else {
                        reply("❌ Use: .autostatus react on/off");
                    }
                    
                } else if (command === 'emoji') {
                    if (!args[1]) {
                        return reply("❌ Use: .autostatus emoji [emoji]");
                    }
                    config.reactEmoji = args[1];
                    fs.writeFileSync(configPath, JSON.stringify(config));
                    reply(`✅ Reaction emoji set to: ${args[1]}`);
                    
                } else {
                    reply("❌ Use: .autostatus on/off, .autostatus react on/off, .autostatus emoji [emoji]");
                }

            } catch (error) {
                reply("❌ Error: " + error.message);
            }
        }
    }
];

// Export functions for index.js to use
module.exports.handleStatusUpdate = handleStatusUpdate;
module.exports.isAutoStatusEnabled = isAutoStatusEnabled;