const fs = require('fs');
const path = require('path');

const saveSessionSetting = (sock, key, value) => {
    const botNum = sock.user.id.split('@')[0].split(':')[0];
    const p = path.join(__dirname, '..', 'sessions', botNum, 'settings.json');
    let s = {};
    try { if(fs.existsSync(p)) s = JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e){}
    s[key] = value;
    fs.writeFileSync(p, JSON.stringify(s, null, 2));
    return true;
};

const getSessionSettings = (sock) => {
    const botNum = sock.user.id.split('@')[0].split(':')[0];
    const p = path.join(__dirname, '..', 'sessions', botNum, 'settings.json');
    try { if(fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e){}
    return {};
};

const settingsPath = path.join(__dirname, '..', 'database', 'settings.json');
const getGlobalSettings = () => {
    try { const s = JSON.parse(fs.readFileSync(settingsPath)); return s.global || {}; } catch { return {}; }
};
const setGlobalSettings = (newGlobal) => {
    try {
        const s = JSON.parse(fs.readFileSync(settingsPath));
        s.global = newGlobal;
        fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2));
    } catch {}
};

const toggles = [
    { cmd: "autoread", name: "Auto Read" },
    { cmd: "autotyping", name: "Auto Typing" },
    { cmd: "autorecording", name: "Auto Recording" },
    { cmd: "autoreact", name: "Auto React" },
    { cmd: "antiedit", name: "Anti-Edit" },
    { cmd: "autosticker", name: "Auto Sticker" },
    { cmd: "autovoice", name: "Auto Voice" },
    { cmd: "dmblocker", name: "DM Blocker" },
    { cmd: "antispam", name: "Anti-Spam" },
    { cmd: "chatbot", name: "Chatbot" }
];

const commands = toggles.map(t => ({
    command: t.cmd, category: "settings", owner: true,
    execute: async (sock, m, { args, reply }) => {
        const val = args[0]?.toLowerCase();
        if (val === 'on') {
            saveSessionSetting(sock, t.cmd, true);
            return reply(`✅ *${t.name}* is now ON`);
        } else if (val === 'off') {
            saveSessionSetting(sock, t.cmd, false);
            return reply(`❌ *${t.name}* is now OFF`);
        } else {
            const s = getSessionSettings(sock);
            return reply(`⚙️ *${t.name}* is currently *${s[t.cmd] ? 'ON' : 'OFF'}*\n\nUsage: .${t.cmd} on / off`);
        }
    }
}));

commands.push({
    command: "mode", aliases: ["botmode"], category: "settings", owner: true,
    execute: async (sock, m, { args, reply }) => {
        const mode = args[0]?.toLowerCase();
        const g = getGlobalSettings();
        if (mode === 'public') { g.mode = 'public'; setGlobalSettings(g); return reply("✅ Bot is now in *public mode*."); } 
        else if (mode === 'private') { g.mode = 'private'; setGlobalSettings(g); return reply("🔒 Bot is now in *private mode*."); } 
        else { return reply(`📱 Current mode: *${g.mode || 'public'}*`); }
    }
});

commands.push({
    command: "antideleteconfig", aliases: ["adconfig", "antidelete"], category: "settings", owner: true,
    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();
        const g = getGlobalSettings();
        const cfg = g.antidelete || { enabled: false, mode: 'chat', style: 'fancy', react: true };

        if (!sub) { return reply(`🛡️ *Antidelete:* ${cfg.enabled ? 'ON' : 'OFF'}\nMode: ${cfg.mode}`); }
        if (sub === 'on' || sub === 'off') { cfg.enabled = sub === 'on'; } 
        else if (sub === 'mode') { const mode = args[1]?.toLowerCase(); if (['chat', 'owner', 'both'].includes(mode)) cfg.mode = mode; else return reply("❌ Invalid mode."); } 
        else if (sub === 'style') { const style = args[1]?.toLowerCase(); if (['fancy', 'simple'].includes(style)) cfg.style = style; else return reply("❌ Invalid style."); } 
        else if (sub === 'react') { const react = args[1]?.toLowerCase(); if (react === 'on') cfg.react = true; else if (react === 'off') cfg.react = false; else return reply("❌ Use: react on/off"); } 
        else { return reply("❌ Unknown option."); }

        g.antidelete = cfg;
        setGlobalSettings(g);
        reply(`✅ Antidelete updated!`);
    }
});

module.exports = commands;