// © 2026 Alpha - SETTINGS COMMANDS (FULL WORKING)

const fs = require('fs');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Database path
const settingsPath = './database/settings.json';
if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, JSON.stringify({ global: {} }, null, 2));

// Load settings
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return { global: {} };
    }
};

// Save settings
const saveSettings = (data) => {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
        return true;
    } catch {
        return false;
    }
};

// Get global settings
const getGlobalSettings = () => {
    const settings = loadSettings();
    return settings.global || {};
};

// Save global settings
const setGlobalSettings = (data) => {
    const settings = loadSettings();
    settings.global = { ...getGlobalSettings(), ...data };
    return saveSettings(settings);
};

module.exports = [

    // ==================== AUTOREAD ====================
    {
        command: "autoread",
        aliases: ["read"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autoread: true });
                reply("✅ Auto-read enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autoread: false });
                reply("❌ Auto-read disabled!");
            } else {
                const status = settings.autoread ? "ON ✅" : "OFF ❌";
                reply(`📊 *Auto-Read:* ${status}\n\nCommands:\n.autoread on/off`);
            }
        }
    },

    // ==================== AUTOTYPING ====================
    {
        command: "autotyping",
        aliases: ["typing"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autotyping: true });
                reply("⌨️ Auto-typing enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autotyping: false });
                reply("❌ Auto-typing disabled!");
            } else {
                const status = settings.autotyping ? "ON ✅" : "OFF ❌";
                reply(`📊 *Auto-Typing:* ${status}\n\nCommands:\n.autotyping on/off`);
            }
        }
    },

    // ==================== AUTORECORDING ====================
    {
        command: "autorecording",
        aliases: ["recording"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autorecording: true });
                reply("🎤 Auto-recording enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autorecording: false });
                reply("❌ Auto-recording disabled!");
            } else {
                const status = settings.autorecording ? "ON ✅" : "OFF ❌";
                reply(`📊 *Auto-Recording:* ${status}\n\nCommands:\n.autorecording on/off`);
            }
        }
    },

    // ==================== AUTOREACT ====================
    {
        command: "autoreact",
        aliases: ["react"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autoreact: true });
                reply("😍 Auto-react enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autoreact: false });
                reply("❌ Auto-react disabled!");
            } else {
                const status = settings.autoreact ? "ON ✅" : "OFF ❌";
                reply(`📊 *Auto-React:* ${status}\n\nCommands:\n.autoreact on/off`);
            }
        }
    },

    // ==================== ANTIDELETE ====================
    {
        command: "antidelete",
        aliases: ["antidel"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ antidelete: true });
                reply("🛡️ Anti-delete enabled!");
            } else if (action === "off") {
                setGlobalSettings({ antidelete: false });
                reply("❌ Anti-delete disabled!");
            } else {
                const status = settings.antidelete ? "ON ✅" : "OFF ❌";
                reply(`🛡️ *Anti-Delete:* ${status}\n\nCommands:\n.antidelete on/off`);
            }
        }
    },

    // ==================== ANTIEDIT ====================
    {
        command: "antiedit",
        aliases: ["antieditmsg"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ antiedit: true });
                reply("✏️ Anti-edit enabled!");
            } else if (action === "off") {
                setGlobalSettings({ antiedit: false });
                reply("❌ Anti-edit disabled!");
            } else {
                const status = settings.antiedit ? "ON ✅" : "OFF ❌";
                reply(`✏️ *Anti-Edit:* ${status}\n\nCommands:\n.antiedit on/off`);
            }
        }
    },

    // ==================== AUTO VIEW STATUS ====================
    {
        command: "autoviewstatus",
        aliases: ["viewstatus"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autoviewstatus: true });
                reply("👁️ Auto-view status enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autoviewstatus: false });
                reply("❌ Auto-view status disabled!");
            } else {
                const status = settings.autoviewstatus ? "ON ✅" : "OFF ❌";
                reply(`👁️ *Auto-View Status:* ${status}\n\nCommands:\n.autoviewstatus on/off`);
            }
        }
    },

    // ==================== AUTO REACT STATUS ====================
    {
        command: "autoreactstatus",
        aliases: ["reactstatus"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autoreactstatus: true });
                reply("💫 Auto-react status enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autoreactstatus: false });
                reply("❌ Auto-react status disabled!");
            } else if (action === "set" && args[1]) {
                setGlobalSettings({ statusEmoji: args[1] });
                reply(`✅ Status reaction set to: ${args[1]}`);
            } else {
                const status = settings.autoreactstatus ? "ON ✅" : "OFF ❌";
                const emoji = settings.statusEmoji || "🔥";
                reply(`💫 *Auto-React Status:* ${status}\n😍 Emoji: ${emoji}\n\nCommands:\n.autoreactstatus on/off\n.autoreactstatus set [emoji]`);
            }
        }
    },

    // ==================== AUTO STATUS (COMBINED) ====================
    {
        command: "autostatus",
        aliases: ["statusauto"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (!action) {
                const viewStatus = settings.autoviewstatus ? "ON ✅" : "OFF ❌";
                const reactStatus = settings.autoreactstatus ? "ON ✅" : "OFF ❌";
                const emoji = settings.statusEmoji || "🔥";
                reply(`📱 *Auto Status Settings*\n\n👁️ View: ${viewStatus}\n💫 React: ${reactStatus}\n😍 Emoji: ${emoji}\n\nCommands:\n.autostatus on/off\n.autostatus react on/off\n.autostatus emoji [emoji]`);
                return;
            }
            
            if (action === "on") {
                setGlobalSettings({ autoviewstatus: true });
                reply("✅ Auto status view enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autoviewstatus: false });
                reply("❌ Auto status view disabled!");
            } else if (action === "react") {
                const subAction = args[1]?.toLowerCase();
                if (subAction === "on") {
                    setGlobalSettings({ autoreactstatus: true });
                    reply("💫 Status reactions enabled!");
                } else if (subAction === "off") {
                    setGlobalSettings({ autoreactstatus: false });
                    reply("❌ Status reactions disabled!");
                } else {
                    reply("❌ Use: .autostatus react on/off");
                }
            } else if (action === "emoji") {
                if (!args[1]) return reply("❌ Provide an emoji!\n\n📌 Example: .autostatus emoji 🔥");
                setGlobalSettings({ statusEmoji: args[1] });
                reply(`✅ Status reaction emoji set to: ${args[1]}`);
            } else {
                reply("❌ Use: .autostatus on/off, .autostatus react on/off, .autostatus emoji [emoji]");
            }
        }
    },

    // ==================== SET PREFIX ====================
    {
        command: "setprefix",
        aliases: ["prefix"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a prefix!\n\n📌 Example: .setprefix !");
            
            const newPrefix = args[0];
            setGlobalSettings({ prefix: newPrefix });
            
            reply(`✅ Prefix set to: *${newPrefix}*`);
        }
    },

    // ==================== RESET PREFIX ====================
    {
        command: "resetprefix",
        aliases: ["defaultprefix"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { reply }) => {
            setGlobalSettings({ prefix: '.' });
            reply("✅ Prefix reset to default: *.*");
        }
    },

    // ==================== SET BOT NAME ====================
    {
        command: "setname",
        aliases: ["botname"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a name!\n\n📌 Example: .setname Alpha Bot");
            
            const name = args.join(" ");
            
            try {
                await sock.updateProfileName(name);
                reply(`✅ Bot name updated to: *${name}*`);
            } catch (err) {
                reply(`❌ Failed to update name: ${err.message}`);
            }
        }
    },

    // ==================== SET BIO ====================
    {
        command: "setbio",
        aliases: ["status", "about"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a bio!\n\n📌 Example: .setbio Alpha Bot | 100+ Commands");
            
            const bio = args.join(" ");
            
            try {
                await sock.updateProfileStatus(bio);
                reply(`✅ Bio updated to: *${bio}*`);
            } catch (err) {
                reply(`❌ Failed to update bio: ${err.message}`);
            }
        }
    },

    // ==================== SET PROFILE PICTURE (SIMPLE & WORKING) ====================
    {
        command: "setpp",
        aliases: ["setprofile", "botpp"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { reply }) => {
            if (!m.quoted) return reply("❌ Reply to an image!");
            
            const msg = m.quoted;
            
            try {
                // Download the media
                const buffer = await sock.downloadMediaMessage(msg);
                
                // Update profile picture
                await sock.updateProfilePicture(sock.user.id, buffer);
                reply("✅ Profile picture updated!");
                
            } catch (err) {
                console.log("SetPP error:", err.message);
                reply("❌ Failed! Make sure you're replying to a valid image.");
            }
        }
    },

    // ==================== SETTINGS OVERVIEW ====================
    {
        command: "settings",
        aliases: ["config", "botsettings"],
        category: "settings",
        owner: true,
        execute: async (sock, m, { reply }) => {
            const settings = getGlobalSettings();
            
            let text = `⚙️ *BOT SETTINGS*\n\n`;
            text += `📖 Auto-Read: ${settings.autoread ? '✅' : '❌'}\n`;
            text += `⌨️ Auto-Typing: ${settings.autotyping ? '✅' : '❌'}\n`;
            text += `🎤 Auto-Recording: ${settings.autorecording ? '✅' : '❌'}\n`;
            text += `😍 Auto-React: ${settings.autoreact ? '✅' : '❌'}\n`;
            text += `🛡️ Anti-Delete: ${settings.antidelete ? '✅' : '❌'}\n`;
            text += `✏️ Anti-Edit: ${settings.antiedit ? '✅' : '❌'}\n`;
            text += `👁️ Auto-View Status: ${settings.autoviewstatus ? '✅' : '❌'}\n`;
            text += `💫 Auto-React Status: ${settings.autoreactstatus ? '✅' : '❌'}\n`;
            text += `🔧 Prefix: ${settings.prefix || '.'}\n`;
            text += `😍 Status Emoji: ${settings.statusEmoji || '🔥'}`;
            
            reply(text);
        }
    }

];