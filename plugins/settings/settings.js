const fs = require('fs');
const path = require('path');
const tenant = require('../../library/tenant');

// 🎯 FIXED: Save directly to session folder, AND create it if missing
const saveSessionSetting = (sock, key, value) => {
    try {
        const botNum = sock.user.id.split('@')[0].split(':')[0];
        const dir = path.join(process.cwd(), 'sessions', botNum);
        
        // 🎯 THIS IS THE CRITICAL LINE
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[SETTINGS] Created folder: ${dir}`);
        }

        const p = path.join(dir, 'settings.json');
        let s = {};
        try { 
            if (fs.existsSync(p)) s = JSON.parse(fs.readFileSync(p, 'utf8')); 
        } catch(e){}
        
        s[key] = value;
        fs.writeFileSync(p, JSON.stringify(s, null, 2));
        console.log(`[SETTINGS] Saved ${key}=${value} to ${p}`);
        return true;
    } catch (e) {
        console.error("Save Error:", e.message);
        return false;
    }
};

const getSessionSettings = (sock) => {
    try {
        const botNum = sock.user.id.split('@')[0].split(':')[0];
        const p = path.join(process.cwd(), 'sessions', botNum, 'settings.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch(e) {}
    return {};
};

const getGlobalSettings = (sock) => tenant.read(sock, 'settings.json', {});
const setGlobalSettings = (sock, value) => tenant.write(sock, 'settings.json', value);

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
            const ok = saveSessionSetting(sock, t.cmd, true);
            if (!ok) return reply("❌ Failed to save setting.");
            return reply(`✅ *${t.name}* is now ON`);
        } else if (val === 'off') {
            const ok = saveSessionSetting(sock, t.cmd, false);
            if (!ok) return reply("❌ Failed to save setting.");
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
        const g = getGlobalSettings(sock);
        if (mode === 'public') { g.mode = 'public'; setGlobalSettings(sock, g); return reply("✅ Bot is now in *public mode*."); } 
        else if (mode === 'private') { g.mode = 'private'; setGlobalSettings(sock, g); return reply("🔒 Bot is now in *private mode*."); } 
        else { return reply(`📱 Current mode: *${g.mode || 'public'}*`); }
    }
});

commands.push({
    command: "antideleteconfig", aliases: ["adconfig", "antidelete"], category: "settings", owner: true,
    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();
        const g = getGlobalSettings(sock);
        const cfg = g.antidelete || { enabled: false, mode: 'chat', style: 'fancy', react: true };

        if (!sub) { return reply(`🛡️ *Antidelete:* ${cfg.enabled ? 'ON' : 'OFF'}\nMode: ${cfg.mode}`); }
        if (sub === 'on' || sub === 'off') { cfg.enabled = sub === 'on'; } 
        else if (sub === 'mode') { const mode = args[1]?.toLowerCase(); if (['chat', 'owner', 'both'].includes(mode)) cfg.mode = mode; else return reply("❌ Invalid mode."); } 
        else if (sub === 'style') { const style = args[1]?.toLowerCase(); if (['fancy', 'simple'].includes(style)) cfg.style = style; else return reply("❌ Invalid style."); } 
        else if (sub === 'react') { const react = args[1]?.toLowerCase(); if (react === 'on') cfg.react = true; else if (react === 'off') cfg.react = false; else return reply("❌ Use: react on/off"); } 
        else { return reply("❌ Unknown option."); }

        g.antidelete = cfg;
        setGlobalSettings(sock, g);
        reply(`✅ Antidelete updated!`);
    }
});

module.exports = commands;