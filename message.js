// © 2026 Alpha - MESSAGE HANDLER (STABLE FULL FEATURES)
const fs = require("fs");
const path = require("path");
const config = require("./settings/config");

const clean = (jid) => { if (!jid) return ""; try { return jid.toString().replace(/[^0-9]/g, ""); } catch { return ""; } };

async function checkAdmin(sock, chatId, senderId, botId) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];
        const senderBase = senderId.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        const botBase = botId.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        let isSenderAdmin = false;
        let isBotAdmin = false;

        for (const p of participants) {
            const pIds = [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean); 
            let isSenderMatch = false;
            let isBotMatch = false;
            for (const pId of pIds) {
                const pBase = pId.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                if (pId === senderId || pBase === senderBase) isSenderMatch = true;
                if (pId === botId || pBase === botBase) isBotMatch = true;
            }
            const isAdmin = (p.admin === 'admin' || p.admin === 'superadmin');
            if (isSenderMatch && isAdmin) isSenderAdmin = true;
            if (isBotMatch && isAdmin) isBotAdmin = true;
        }
        return { isSenderAdmin, isBotAdmin };
    } catch (e) {
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

const isUserBanned = (sender) => {
    try {
        const bp = './database/banned.json';
        if (!fs.existsSync(bp)) { if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true }); fs.writeFileSync(bp, '{}'); }
        const b = JSON.parse(fs.readFileSync(bp)); return b[clean(sender)] ? true : false;
    } catch { return false; }
};

function isTempOwnerBase(sender) {
    try {
        const op = './database/owners.json';
        if (!fs.existsSync(op)) return false;
        const o = JSON.parse(fs.readFileSync(op));
        const senderBase = clean(sender.split('@')[0].split(':')[0]);
        return o.tempOwners?.includes(senderBase);
    } catch { return false; }
}

const bwPath = './database/badwords.json', gbwPath = './database/badwords_global.json';
try { if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true }); if (!fs.existsSync(bwPath)) fs.writeFileSync(bwPath, '{}'); if (!fs.existsSync(gbwPath)) fs.writeFileSync(gbwPath, '[]'); } catch {}
const loadGlobalBadWords = () => { try { return JSON.parse(fs.readFileSync(gbwPath, 'utf-8')); } catch { return []; } };
const getGroupBW = (chatId) => { try { const d = JSON.parse(fs.readFileSync(bwPath)); return d[chatId] || { enabled: false, words: [] }; } catch { return { enabled: false, words: [] }; } };
const containsBadWord = (text, chatId) => {
    const cfg = getGroupBW(chatId); if (!cfg.enabled) return false;
    const all = [...loadGlobalBadWords(), ...(cfg.words||[])];
    return all.some(w => text.toLowerCase().includes(w.toLowerCase()));
};

const containsLink = (text) => /https?:\/\/[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+/gi.test(text);

const dbPath = './database/groupSettings.json';
try { if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true }); fs.writeFileSync(dbPath, '{}', { flag: 'a' }); } catch {}
const getGroupSettings = (chatId) => { try { return JSON.parse(fs.readFileSync(dbPath))[chatId] || {}; } catch { return {}; } };

// 🎯 FIXED PATHS FOR GLOBAL SETTINGS
const settingsPath = path.join(process.cwd(), 'database', 'settings.json');
try { if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true }); if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}'); } catch {}
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
const getGlobalMode = () => getGlobalSettings().mode || 'public';

// 🎯 FIXED: Uses process.cwd() to guarantee it saves to the ROOT sessions folder
const saveSessionSetting = (sock, key, value) => {
    try {
        const botNum = sock.user.id.split('@')[0].split(':')[0];
        const dir = path.join(process.cwd(), 'sessions', botNum); 
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const p = path.join(dir, 'settings.json');
        let s = {};
        try { if(fs.existsSync(p)) s = JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e){}
        s[key] = value;
        fs.writeFileSync(p, JSON.stringify(s, null, 2));
        return true;
    } catch(e) { 
        console.log("Save error:", e); 
        return false; 
    }
};

const commands = [];
const loadCommands = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (let f of files) {
        const fp = path.join(dir, f);
        if (fs.lstatSync(fp).isDirectory()) loadCommands(fp);
        else if (f.endsWith(".js")) {
            try { delete require.cache[require.resolve(fp)]; const c = require(fp); if (Array.isArray(c)) commands.push(...c); else if (c.command) commands.push(c); } catch (e) { console.log(`❌ Load fail ${f}:`, e.message); }
        }
    }
};
// This loads plugins/settings.js which handles the toggles!
loadCommands(path.join(__dirname, "plugins"));

// 🎯 REMOVED DUPLICATE TOGGLES FROM HERE SO THEY DON'T CLASH WITH settings.js

const games = { tictactoe:{}, guess:{}, quiz:{}, riddle:{} };

const deny = {
    owner: "😂 Only the bot owner can do that.",
    admin: "🚫 Only admins can use this.",
    group: "👥 This only works in groups.",
    botAdmin: "🤖 I need admin powers.",
    banned: "🚫 You're banned from using the bot.",
    private: "🔒 This command only works in private chat.",
    ownerPrivateReminder: "⚠️ For security, owner commands are best used in private chat."
};

const reacts = ["😂","❤️","🔥","👍","🎉","🤔","😮","💯","👀","🥳","⚡","😎"];
async function reactRandom(sock, msg) { try { const e = reacts[Math.floor(Math.random()*reacts.length)]; await sock.sendMessage(msg.key.remoteJid, { react:{ text:e, key:msg.key } }); } catch {} }

module.exports = async (sock, m) => {
    try {
        const contextInfo = { forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid: config.newsletter.id + "@newsletter", newsletterName: config.newsletter.name } };
        
        const reply = async (text, extra={}) => { 
            try { return await sock.sendMessage(m.chat, { text, contextInfo, ...extra }, { quoted: m }); } 
            catch (e) { 
                try { return await sock.sendMessage(m.chat, { text, ...extra }, { quoted: m }); } catch (e2) { console.log("Reply error:", e2.message); } 
            } 
        };
        
        const send = async (data) => { 
            try { return await sock.sendMessage(m.chat, { ...data, contextInfo }, { quoted: m }); } 
            catch (e) { 
                try { return await sock.sendMessage(m.chat, data, { quoted: m }); } catch(e2) { console.log("Send error:", e2.message); } 
            } 
        };

        // 🎯 FIXED: Using process.cwd() to find the correct settings file for reading
        const botNum = sock.user.id.split('@')[0].split(':')[0];
        const sessionSettingsPath = path.join(process.cwd(), 'sessions', botNum, 'settings.json');
        let gs = { autoread: false, autotyping: false, autorecording: false, autoreact: false, prefix: "." };
        try { if(fs.existsSync(sessionSettingsPath)) gs = { ...gs, ...JSON.parse(fs.readFileSync(sessionSettingsPath, "utf8")) }; } catch {}

        if (gs.autoread) { try { await sock.readMessages([m.key]); } catch {} }
        
        if (gs.autotyping) { 
            try { 
                await sock.presenceSubscribe(m.chat);
                await sock.sendPresenceUpdate("composing", m.chat); 
                await new Promise(r => setTimeout(r, 3000)); 
            } catch(e){} 
        }
        if (gs.autorecording) { 
            try { 
                await sock.presenceSubscribe(m.chat);
                await sock.sendPresenceUpdate("recording", m.chat); 
                await new Promise(r => setTimeout(r, 3000)); 
            } catch(e){} 
        }

        const prefix = m.prefix || config.prefix || ".";
        const rawTxt = m.text || "";

        if (gs.autoreact && !rawTxt.startsWith(prefix)) {
            const emojis = ["🔥", "😂", "😍", "😎", "🤖", "⚡", "💯", "👀", "🥶", "😈"];
            try { await sock.sendMessage(m.chat, { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: m.key } }); } catch {}
        }

        if (!m.text) return;

        if (!m.text.startsWith(prefix)) {
            if (m.isGroup && m.text) {
                const gsets = getGroupSettings(m.chat);
                
                if (containsBadWord(m.text, m.chat)) {
                    if (m.isBotAdmin) try { await sock.sendMessage(m.chat, { delete: m.key }); } catch {}
                    await sock.sendMessage(m.chat, { text: `🤬 Watch your language, @${m.sender.split('@')[0]}!`, mentions:[m.sender] }, { quoted: m });
                    return;
                }
                
                if (gsets.antilink) {
                    const mode = gsets.antilinkMode || 'admins';
                    const action = gsets.antilinkAction || 'delete';
                    let allowed = (mode === 'admins' && m.isAdmin) || (mode === 'owner' && m.isOwner);
                    
                    if (!allowed && containsLink(m.text)) {
                        if (action === 'delete') {
                            if (m.isBotAdmin) try { await sock.sendMessage(m.chat, { delete: m.key }); } catch {}
                            await sock.sendMessage(m.chat, { text: `🔗 Links not allowed, @${m.sender.split('@')[0]}.`, mentions:[m.sender] }, { quoted: m });
                        } else if (action === 'warn') {
                            await sock.sendMessage(m.chat, { text: `⚠️ @${m.sender.split('@')[0]}, no links please.`, mentions:[m.sender] }, { quoted: m });
                        } else if (action === 'kick') {
                            if (m.isBotAdmin) try { await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove'); } catch {}
                        }
                        return;
                    }
                }
            }
            return;
        }

        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const command = commands.find(c => c.command === cmdName || (c.aliases && c.aliases.includes(cmdName)));
        if (!command) return;

        const senderNum = clean(m.sender.split('@')[0].split(':')[0]);
        const isOwner = senderNum === botNum || config.owner.includes(senderNum) || isTempOwnerBase(m.sender);

        if (cmdName !== 'mode' && getGlobalMode() === 'private' && !isOwner) return;

        await reactRandom(sock, m);

        if (cmdName !== 'unbanuser' && cmdName !== 'unban' && isUserBanned(m.sender) && !isOwner)
            return reply(deny.banned);

        let isSenderAdmin = false;
        let isBotAdmin = false;
        
        if (m.isGroup) {
            const adminStatus = await checkAdmin(sock, m.chat, m.sender, sock.user.id);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;
            m.isAdmin = isSenderAdmin;
            m.isBotAdmin = isBotAdmin;
        }

        if (command.admin) {
            if (!isBotAdmin) return reply(deny.botAdmin); 
            if (!isSenderAdmin && !isOwner) return reply(deny.admin); 
        }

        const ctx = { args, reply, send, isOwner, isGroup: m.isGroup, isAdmin: isSenderAdmin, isBotAdmin: isBotAdmin, config, prefix };

        if (command.owner && !isOwner) return reply(deny.owner);
        if (command.owner && isOwner && m.isGroup) await reply(deny.ownerPrivateReminder);
        if (command.group === false && m.isGroup) return reply(deny.private);
        if (command.group && !m.isGroup) return reply(deny.group);

        await command.execute(sock, m, ctx);
    } catch (err) {
        console.log("🔥 HANDLER ERROR:", err);
        try { await sock.sendMessage(m.chat, { text: `🤖 Error: ${err.message}` }, { quoted: m }); } catch {}
    }
};

module.exports.games = games;