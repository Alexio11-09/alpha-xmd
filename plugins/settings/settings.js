// © 2026 Alpha - SETTINGS COMMANDS

const fs = require("fs");

// Database path
let settingsPath = './database/settings.json';
try {
    if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
    if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}');
} catch {
    settingsPath = '/tmp/settings.json';
}

// Load settings
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return {};
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
    return settings["global"] || {
        autoread: true,
        autotyping: false,
        autorecording: false,
        autoreact: false,
        antidelete: false,
        antiedit: false,
        autoviewstatus: false,
        autoreactstatus: false,
        antideletestatus: false,
        statusEmoji: "🔥"
    };
};

// Save global settings
const setGlobalSettings = (data) => {
    const settings = loadSettings();
    settings["global"] = { ...getGlobalSettings(), ...data };
    return saveSettings(settings);
};

module.exports = [
    // ==================== AUTOREAD ====================
    {
        command: "autoread",
        aliases: ["read"],
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
                reply(`📊 *Auto-Read*\n\nStatus: ${status}\n\nCommands:\n.autoread on/off`);
            }
        }
    },
    
    // ==================== AUTOTYPING ====================
    {
        command: "autotyping",
        aliases: ["typing"],
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autotyping: true });
                reply("✅ Auto-typing enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autotyping: false });
                reply("❌ Auto-typing disabled!");
            } else {
                const status = settings.autotyping ? "ON ✅" : "OFF ❌";
                reply(`📊 *Auto-Typing*\n\nStatus: ${status}\n\nCommands:\n.autotyping on/off`);
            }
        }
    },
    
    // ==================== AUTORECORDING ====================
    {
        command: "autorecording",
        aliases: ["recording"],
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autorecording: true });
                reply("✅ Auto-recording enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autorecording: false });
                reply("❌ Auto-recording disabled!");
            } else {
                const status = settings.autorecording ? "ON ✅" : "OFF ❌";
                reply(`📊 *Auto-Recording*\n\nStatus: ${status}\n\nCommands:\n.autorecording on/off`);
            }
        }
    },
    
    // ==================== AUTOREACT ====================
    {
        command: "autoreact",
        aliases: ["react"],
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autoreact: true });
                reply("✅ Auto-react enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autoreact: false });
                reply("❌ Auto-react disabled!");
            } else {
                const status = settings.autoreact ? "ON ✅" : "OFF ❌";
                reply(`📊 *Auto-React*\n\nStatus: ${status}\n\nCommands:\n.autoreact on/off`);
            }
        }
    },
    
    // ==================== ANTIDELETE ====================
    {
        command: "antidelete",
        aliases: ["antidel"],
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
                reply(`🛡️ *Anti-Delete*\n\nStatus: ${status}\n\nCommands:\n.antidelete on/off`);
            }
        }
    },
    
    // ==================== ANTIDELETESTATUS ====================
    {
        command: "antideletestatus",
        aliases: ["antidelstatus"],
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ antideletestatus: true });
                reply("🛡️ Anti-delete status enabled!");
            } else if (action === "off") {
                setGlobalSettings({ antideletestatus: false });
                reply("❌ Anti-delete status disabled!");
            } else {
                const status = settings.antideletestatus ? "ON ✅" : "OFF ❌";
                reply(`🛡️ *Anti-Delete Status*\n\nStatus: ${status}\n\nCommands:\n.antideletestatus on/off`);
            }
        }
    },
    
    // ==================== ANTIVIEWSTATUS ====================
    {
        command: "autoviewstatus",
        aliases: ["viewstatus"],
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autoviewstatus: true });
                reply("✅ Auto-view status enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autoviewstatus: false });
                reply("❌ Auto-view status disabled!");
            } else {
                const status = settings.autoviewstatus ? "ON ✅" : "OFF ❌";
                reply(`📊 *Auto-View Status*\n\nStatus: ${status}\n\nCommands:\n.autoviewstatus on/off`);
            }
        }
    },
    
    // ==================== AUTOREACTSTATUS ====================
    {
        command: "autoreactstatus",
        aliases: ["reactstatus"],
        execute: async (sock, m, { args, reply }) => {
            const action = args[0]?.toLowerCase();
            const settings = getGlobalSettings();
            
            if (action === "on") {
                setGlobalSettings({ autoreactstatus: true });
                reply("✅ Auto-react status enabled!");
            } else if (action === "off") {
                setGlobalSettings({ autoreactstatus: false });
                reply("❌ Auto-react status disabled!");
            } else if (action === "set" && args[1]) {
                setGlobalSettings({ autoreactstatus: true, statusEmoji: args[1] });
                reply(`✅ Status reaction set to: ${args[1]}`);
            } else {
                const status = settings.autoreactstatus ? "ON ✅" : "OFF ❌";
                const emoji = settings.statusEmoji || "🔥";
                reply(`📊 *Auto-React Status*\n\nStatus: ${status}\nEmoji: ${emoji}\n\nCommands:\n.autoreactstatus on/off\n.autoreactstatus set [emoji]`);
            }
        }
    },
    
    // ==================== ANTIEDIT ====================
    {
        command: "antiedit",
        aliases: ["antieditmsg"],
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
                reply(`✏️ *Anti-Edit*\n\nStatus: ${status}\n\nCommands:\n.antiedit on/off`);
            }
        }
    }
];