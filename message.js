// © 2026 Alpha - MESSAGE HANDLER (MULTI-SESSION SAFE)
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("./settings/config");
const tenant = require("./library/tenant");
const viewonce = require("./library/viewonce");

const clean = (jid) => { if (!jid) return ""; try { return jid.toString().replace(/[^0-9]/g, ""); } catch { return ""; } };

// ======================================================
// GROUP ADMIN LOOKUP
// ======================================================
const adminCache = new Map();

async function getAdmins(sock, chatId) {
    const botKey = String(sock.user?.id || "").split(/[:@]/)[0];
    const key = botKey + ":" + chatId;
    const hit = adminCache.get(key);
    if (hit && Date.now() - hit.t < 60000) return hit.data;

    const md = await sock.groupMetadata(chatId);
    const data = (md.participants || []).filter(p => p.admin === "admin" || p.admin === "superadmin");

    adminCache.set(key, { t: Date.now(), data });
    if (adminCache.size > 100) adminCache.delete(adminCache.keys().next().value);
    return data;
}

async function checkAdmin(sock, chatId, senderId, botId) {
    try {
        const participants = await getAdmins(sock, chatId);
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

const isUserBanned = (sender, sock) => {
    try { const b = tenant.read(sock, 'banned.json', {}); return !!b[clean(sender)]; } catch { return false; }
};
function isTempOwnerBase(sender, sock) {
    try {
        const o = tenant.read(sock, 'owners.json', { tempOwners: [] });
        const senderBase = clean(sender.split('@')[0].split(':')[0]);
        return (o.tempOwners || []).includes(senderBase);
    } catch { return false; }
}
const loadGlobalBadWords = (sock) => { try { return tenant.read(sock, 'badwords_global.json', []); } catch { return []; } };
const getGroupBW = (chatId, sock) => { try { const d = tenant.read(sock, 'badwords.json', {}); return d[chatId] || { enabled: false, words: [] }; } catch { return { enabled: false, words: [] }; } };
const containsBadWord = (text, chatId, sock) => {
    const cfg = getGroupBW(chatId, sock); if (!cfg.enabled) return false;
    const all = [...loadGlobalBadWords(sock), ...(cfg.words || [])];
    return all.some(w => text.toLowerCase().includes(w.toLowerCase()));
};

const containsLink = (text) => /https?:\/\/[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+/gi.test(text);

const getGroupSettings = (chatId, sock) => { try { return tenant.read(sock, 'groupSettings.json', {})[chatId] || {}; } catch { return {}; } };
const getGlobalSettings = (sock) => { try { return tenant.read(sock, 'settings.json', {}); } catch { return {}; } };
const setGlobalSettings = (sock, newGlobal) => { try { tenant.write(sock, 'settings.json', newGlobal); } catch {} };
const getGlobalMode = (sock) => getGlobalSettings(sock).mode || 'public';

// ======================================================
// SESSION SETTINGS - FIXED FOR MULTI-SESSION
// ======================================================
// Cache per bot number to avoid reading disk every message
const sessCache = new Map();

function readSessionSettings(botNum) {
    const hit = sessCache.get(botNum);
    if (hit && Date.now() - hit.t < 5000) return hit.v;

    let v = {};
    try {
        // 🎯 FIX: Try both possible paths for the session settings
        const paths = [
            path.join(process.cwd(), 'sessions', botNum, 'settings.json'),
            path.join(__dirname, 'sessions', botNum, 'settings.json')
        ];
        
        for (const p of paths) {
            if (fs.existsSync(p)) {
                v = JSON.parse(fs.readFileSync(p, 'utf8'));
                break;
            }
        }
    } catch (e) {
        console.log(`[SETTINGS READ ERROR] ${botNum}:`, e.message);
    }

    sessCache.set(botNum, { t: Date.now(), v });
    return v;
}

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
        sessCache.delete(botNum);
        return true;
    } catch(e) {
        console.log("Save error:", e);
        return false;
    }
};

// ======================================================
// COMMAND LOADING
// ======================================================
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
loadCommands(path.join(__dirname, "plugins"));

const hooks = commands.filter(c => typeof c.onMessage === 'function');
const listReplyHooks = commands.filter(c => typeof c.onMenuReply === 'function');

const games = { tictactoe:{}, guess:{}, quiz:{}, riddle:{} };

const MAIN_ONLY = new Set([
    "eval", "restart", "shutdown", "update",
    "clearsession", "cleartmp", "deljunk", "disk",
    "sudo", "addowner", "delowner"
]);

const HEAVY = new Set([
    "play", "video", "tiktok", "fb", "ig", "pin", "shazam", "apk"
]);

let heavyPending = 0;
let heavyActive = 0;
const heavyWaiters = [];
const HEAVY_LIMIT = 2;
const HEAVY_TIMEOUT = 120000;

async function runHeavy(job) {
    if (heavyActive >= HEAVY_LIMIT) {
        await new Promise(resolve => heavyWaiters.push(resolve));
    } else {
        heavyActive++;
    }

    let timer;

    try {
        return await Promise.race([
            job(),
            new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("Task timed out")), HEAVY_TIMEOUT); })
        ]);
    } finally {
        clearTimeout(timer);
        const next = heavyWaiters.shift();
        if (next) next();
        else heavyActive--;
    }
}

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

        if (!m.fromMe && m.text && !isUserBanned(m.sender, sock)) {
            for (const hook of listReplyHooks) {
                try { if (await hook.onMenuReply(sock, m, { reply, send })) return; } catch (e) { console.log('[MENU REPLY]', e.message); }
            }
        }

        if (m.viewOnce && m.id) viewonce.remember(m.id, m.message);

        const botNum = sock.user.id.split('@')[0].split(':')[0];
        const senderNum = clean(m.sender.split('@')[0].split(':')[0]);
        m.isOwner = tenant.isAccountOwner(m.sender, sock) || isTempOwnerBase(m.sender, sock);

        // 🎯 FIX: Read session settings from disk (works for every session)
        const gs = { 
            autoread: false, 
            autotyping: false, 
            autorecording: false, 
            autoreact: false, 
            prefix: ".", 
            ...readSessionSettings(botNum) 
        };

        if (gs.autoread && !sock._ghostMode && !m.viewOnce) { try { await sock.readMessages([m.key]); } catch {} }

        if (gs.autotyping && !sock._ghostMode) {
            try {
                await sock.presenceSubscribe(m.chat);
                await sock.sendPresenceUpdate("composing", m.chat);
                await new Promise(r => setTimeout(r, 1000));
            } catch(e){}
        }
        if (gs.autorecording && !sock._ghostMode) {
            try {
                await sock.presenceSubscribe(m.chat);
                await sock.sendPresenceUpdate("recording", m.chat);
                await new Promise(r => setTimeout(r, 1000));
            } catch(e){}
        }

        const prefix = m.prefix || config.prefix || ".";
        const rawTxt = m.text || "";

        if (gs.autoreact && !rawTxt.startsWith(prefix)) {
            const emojis = ["🔥", "😂", "😍", "😎", "🤖", "⚡", "💯", "👀", "🥶", "😈"];
            try { await sock.sendMessage(m.chat, { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: m.key } }); } catch {}
        }

        if (m.isGroup && hooks.length && !m.fromMe) {
            for (const h of hooks) {
                try { await h.onMessage(sock, m, { checkAdmin }); }
                catch (e) { console.log(`[HOOK ${h.command}]`, e.message); }
            }
        }

        if (!m.text) return;

        // ======================================================
        // 🤖 CHATBOT HANDLER (per-session)
        // ======================================================
        if (m.text && !m.text.startsWith(prefix) && !m.key.fromMe) {
            const chatbotEnabled = gs.chatbot === true || gs.chatbot === 1 || gs.chatbot === 'true';
            
            console.log(`[CHATBOT] [${botNum}] "${m.text}" | chatbot = ${gs.chatbot} | enabled = ${chatbotEnabled}`);

            if (chatbotEnabled) {
                try {
                    await sock.presenceSubscribe(m.chat);
                    await sock.sendPresenceUpdate("composing", m.chat);

                    const prompt = encodeURIComponent(m.text);
                    const aiRes = await axios.get(`https://text.pollinations.ai/${prompt}`, { timeout: 20000 });

                    if (aiRes.data) {
                        await sock.sendMessage(m.chat, { text: String(aiRes.data).trim() }, { quoted: m });
                        return;
                    }
                } catch (e) {
                    console.log(`[CHATBOT] [${botNum}] API error:`, e.message);
                }
            }
        }

        if (!m.text.startsWith(prefix)) {
            if (m.isGroup && m.text) {
                const gsets = getGroupSettings(m.chat, sock);

                if (containsBadWord(m.text, m.chat, sock)) {
                    const st = await checkAdmin(sock, m.chat, m.sender, sock.user.id);
                    m.isAdmin = st.isSenderAdmin;
                    m.isBotAdmin = st.isBotAdmin;

                    if (m.isBotAdmin) try { await sock.sendMessage(m.chat, { delete: m.key }); } catch {}
                    await sock.sendMessage(m.chat, { text: `🤬 Watch your language, @${m.sender.split('@')[0]}!`, mentions:[m.sender] }, { quoted: m });
                    return;
                }

                if (gsets.antilink && containsLink(m.text)) {
                    const mode = gsets.antilinkMode || 'admins';
                    const action = gsets.antilinkAction || 'delete';

                    const st = await checkAdmin(sock, m.chat, m.sender, sock.user.id);
                    m.isAdmin = st.isSenderAdmin;
                    m.isBotAdmin = st.isBotAdmin;

                    let allowed = (mode === 'admins' && m.isAdmin) || (mode === 'owner' && m.isOwner);

                    if (!allowed) {
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

        if (MAIN_ONLY.has(command.command) && !tenant.isMainOwner(m.sender)) return reply(deny.owner);

        const isOwner = m.isOwner;

        if (cmdName !== 'mode' && getGlobalMode(sock) === 'private' && !isOwner) return;

        await reactRandom(sock, m);

        if (cmdName !== 'unbanuser' && cmdName !== 'unban' && isUserBanned(m.sender, sock) && !isOwner)
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

        const isHeavy = HEAVY.has(command.command) || (command.aliases || []).some(a => HEAVY.has(a));

        if (isHeavy) {
            if (heavyPending >= 15) return reply("⏳ I'm a bit busy right now, please try again in a moment.");
            if (heavyPending >= HEAVY_LIMIT) reply(`⏳ Queued, ${heavyPending - HEAVY_LIMIT + 1} download(s) ahead of you...`);
            heavyPending++;
            try {
                await runHeavy(() => command.execute(sock, m, ctx));
            } finally {
                heavyPending--;
            }
        } else {
            await command.execute(sock, m, ctx);
        }
    } catch (err) {
        console.log("🔥 HANDLER ERROR:", err);
        try { await sock.sendMessage(m.chat, { text: `🤖 Error: ${err.message}` }, { quoted: m }); } catch {}
    }
};

module.exports.games = games;
module.exports.commands = commands;