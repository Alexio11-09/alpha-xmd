// © 2026 Alpha - MESSAGE HANDLER (SLIM + PAIR + ANTIBADWORD + ANTILINK)
const fs = require("fs");
const path = require("path");
const config = require("./settings/config");

const clean = (jid) => { if (!jid) return ""; try { return jid.toString().replace(/[^0-9]/g, ""); } catch { return ""; } };

// BAN CHECK
const isUserBanned = (sender) => {
    try {
        const bp = './database/banned.json';
        if (!fs.existsSync(bp)) { if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true }); fs.writeFileSync(bp, '{}'); }
        const b = JSON.parse(fs.readFileSync(bp)); return b[clean(sender)] ? true : false;
    } catch { return false; }
};

// TEMP OWNER
const isTempOwner = (sender) => {
    try {
        const op = './database/owners.json';
        if (!fs.existsSync(op)) { if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true }); fs.writeFileSync(op, JSON.stringify({ tempOwners: [] }, null, 2)); }
        const o = JSON.parse(fs.readFileSync(op)); return o.tempOwners?.includes(clean(sender));
    } catch { return false; }
};

// BADWORDS
const bwPath = './database/badwords.json', gbwPath = './database/badwords_global.json';
try { if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true }); if (!fs.existsSync(bwPath)) fs.writeFileSync(bwPath, '{}'); if (!fs.existsSync(gbwPath)) fs.writeFileSync(gbwPath, '[]'); } catch {}
const loadGlobalBadWords = () => { try { return JSON.parse(fs.readFileSync(gbwPath, 'utf-8')); } catch { return []; } };
const getGroupBW = (chatId) => { try { const d = JSON.parse(fs.readFileSync(bwPath)); return d[chatId] || { enabled: false, words: [] }; } catch { return { enabled: false, words: [] }; } };
const containsBadWord = (text, chatId) => {
    const cfg = getGroupBW(chatId); if (!cfg.enabled) return false;
    const all = [...loadGlobalBadWords(), ...(cfg.words||[])];
    return all.some(w => text.toLowerCase().includes(w.toLowerCase()));
};

// LINK DETECTION
const containsLink = (text) => /https?:\/\/[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+/gi.test(text);

// GROUP SETTINGS
const dbPath = './database/groupSettings.json';
try { if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true }); fs.writeFileSync(dbPath, '{}', { flag: 'a' }); } catch {}
const getGroupSettings = (chatId) => { try { return JSON.parse(fs.readFileSync(dbPath))[chatId] || {}; } catch { return {}; } };

// COMMANDS
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

// GAMES
const games = { tictactoe:{}, guess:{}, quiz:{}, riddle:{} };

// SHORT DENIALS
const deny = {
    owner: "😂 Only the bot owner can do that.",
    admin: "🚫 Only admins can use this.",
    group: "👥 This only works in groups.",
    botAdmin: "🤖 I need admin powers.",
    banned: "🚫 You're banned from using the bot."
};

// REACTIONS
const reacts = ["😂","❤️","🔥","👍","🎉","🤔","😮","💯","👀","🥳","⚡","😎"];
async function reactRandom(sock, msg) { try { const e = reacts[Math.floor(Math.random()*reacts.length)]; await sock.sendMessage(msg.key.remoteJid, { react:{ text:e, key:msg.key } }); } catch {} }

// MAIN HANDLER
module.exports = async (sock, m) => {
    try {
        const contextInfo = { forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid: config.newsletter.id + "@newsletter", newsletterName: config.newsletter.name } };
        const reply = (text, extra={}) => { try { return sock.sendMessage(m.chat, { text, contextInfo, ...extra }, { quoted: m }); } catch { return sock.sendMessage(m.chat, { text, ...extra }, { quoted: m }); } };
        const send = (data) => { try { return sock.sendMessage(m.chat, { ...data, contextInfo }, { quoted: m }); } catch { return sock.sendMessage(m.chat, data, { quoted: m }); } };

        if (!m.text) return;

        // ----------- PAIR SESSION ---------------
        const pairKey = m.chat + m.sender;
        if (global.pairSessions && global.pairSessions[pairKey]) {
            const num = global.pairSessions[pairKey];
            const choice = m.text.trim();
            if (choice === '1' || choice === '2') {
                delete global.pairSessions[pairKey];
                const method = choice === '1' ? 'qr' : 'code';
                return module.exports.handlePairChoice(sock, m, num, method, reply, send);
            }
        }

        const prefix = config.prefix || ".";
        if (!m.text.startsWith(prefix)) {
            // ANTIBADWORD
            if (m.isGroup && m.text && containsBadWord(m.text, m.chat)) {
                if (m.isBotAdmin) try { await sock.sendMessage(m.chat, { delete: m.key }); } catch {}
                const w = `🤬 Watch your language, @${m.sender.split('@')[0]}! That word is banned.`;
                await sock.sendMessage(m.chat, { text: w, mentions:[m.sender] }, { quoted: m });
                return;
            }
            // ANTILINK
            if (m.isGroup && m.text) {
                const gs = getGroupSettings(m.chat);
                if (gs.antilink) {
                    const mode = gs.antilinkMode || 'admins';
                    const action = gs.antilinkAction || 'delete';
                    let allowed = false;
                    if (mode === 'owner') { try { const meta = await sock.groupMetadata(m.chat); allowed = (meta.owner === m.sender); } catch { allowed = false; } }
                    else allowed = m.isAdmin;
                    if (!allowed && containsLink(m.text)) {
                        if (action === 'delete') {
                            if (m.isBotAdmin) try { await sock.sendMessage(m.chat, { delete: m.key }); } catch {}
                            else { try { const meta = await sock.groupMetadata(m.chat); await sock.sendMessage(m.chat, { text: `🙏 @${meta.owner.split('@')[0]} make me admin to delete links.`, mentions:[meta.owner] }, { quoted: m }); } catch {} }
                            const warn = `🔗 Links not allowed, @${m.sender.split('@')[0]}. Message deleted.`;
                            await sock.sendMessage(m.chat, { text: warn, mentions:[m.sender] }, { quoted: m });
                        } else if (action === 'warn') {
                            const warn = `⚠️ @${m.sender.split('@')[0]}, no links please.`;
                            await sock.sendMessage(m.chat, { text: warn, mentions:[m.sender] }, { quoted: m });
                        } else if (action === 'kick') {
                            if (m.isBotAdmin) try { await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove'); } catch {}
                            else { try { const meta = await sock.groupMetadata(m.chat); await sock.sendMessage(m.chat, { text: `🙏 @${meta.owner.split('@')[0]} make me admin to kick link spammers.`, mentions:[meta.owner] }, { quoted: m }); } catch {} }
                        }
                        return;
                    }
                }
            }
            return;
        }

        // COMMAND
        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const command = commands.find(c => c.command === cmdName || (c.aliases && c.aliases.includes(cmdName)));
        if (!command) return;

        await reactRandom(sock, m);

        const botNum = clean(sock.user.id);
        const senderNum = clean(m.sender);
        const isOwner = config.owner.includes(senderNum) || senderNum === botNum || isTempOwner(m.sender);

        if (cmdName !== 'unbanuser' && cmdName !== 'unban' && isUserBanned(m.sender) && !isOwner)
            return reply(deny.banned);

        const ctx = { args, reply, send, isOwner, isGroup: m.isGroup, isAdmin: m.isAdmin, isBotAdmin: m.isBotAdmin, config, prefix };

        if (command.owner && !isOwner) return reply(deny.owner);
        if (command.group && !m.isGroup) return reply(deny.group);
        if (command.admin && !m.isAdmin) return reply(deny.admin);

        await command.execute(sock, m, ctx);
    } catch (err) {
        console.log("🔥 HANDLER ERROR:", err);
        try { await sock.sendMessage(m.chat, { text: "🤖 Error. Try again later." }, { quoted: m }); } catch {}
    }
};

// PAIR HANDLER
module.exports.handlePairChoice = async (sock, m, number, method, reply, send) => {
    const baileys = await import('@whiskeysockets/baileys');
    const { makeWASocket, Browsers, useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;
    const pino = require('pino'), qrcode = require('qrcode'), os = require('os'), path = require('path'), fs = require('fs');

    reply(`⏳ Generating ${method==='qr'?'QR code':'pairing code'}...`);

    const tempDir = path.join(os.tmpdir(), `p_${number}_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
        const { state } = await useMultiFileAuthState(tempDir);
        const { version } = await fetchLatestBaileysVersion();
        const tempSock = makeWASocket({ auth: state, version, browser: Browsers.macOS('Chrome'), logger: pino({ level: 'silent' }), printQRInTerminal: false });

        const result = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 60000);
            tempSock.ev.on('connection.update', async (up) => {
                const { connection, qr } = up;
                if (connection === 'open' && method === 'code') {
                    try { const code = await tempSock.requestPairingCode(number); clearTimeout(timeout); resolve({ code }); } catch (e) { clearTimeout(timeout); reject(e); }
                } else if (qr && method === 'qr') { clearTimeout(timeout); resolve({ qr }); }
                else if (connection === 'close') { clearTimeout(timeout); resolve(null); }
            });
        });

        tempSock.end();
        fs.rmSync(tempDir, { recursive: true, force: true });

        if (!result) throw new Error('Could not obtain pairing info.');
        if (result.code) {
            reply(`✅ *Pairing Code*\n📞 +${number}\n🔢 *${result.code}*\n⏱️ Expires in 60s`);
        } else if (result.qr) {
            const qrBuf = await qrcode.toBuffer(result.qr, { type:'png' });
            await sock.sendMessage(m.chat, { image: qrBuf, caption: `📷 QR for +${number}\nScan with WhatsApp Linked devices.` }, { quoted: m });
        }
    } catch (err) {
        console.error('Pair error:', err);
        reply(`❌ Failed: ${err.message || err}`);
    }
};

module.exports.games = games;