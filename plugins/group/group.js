// © 2026 Alpha - GROUP COMMANDS (FUNNY & SAFE)

const fs = require("fs");

let dbPath = './database/groupSettings.json';
try {
    if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
    fs.writeFileSync(dbPath, '{}', { flag: 'a' });
} catch {
    dbPath = '/tmp/groupSettings.json';
}

const badWordsPath = './database/badwords.json';
if (!fs.existsSync(badWordsPath)) fs.writeFileSync(badWordsPath, '{}');

const load = () => { try { if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}'); return JSON.parse(fs.readFileSync(dbPath)); } catch { return {}; } };
const save = (d) => { try { fs.writeFileSync(dbPath, JSON.stringify(d, null, 2)); return true; } catch { return false; } };
const gs = (g) => { const s = load(); return s[g] || { welcome: false, welcomeMsg: "Welcome @user! 🎉", goodbye: false, goodbyeMsg: "Goodbye @user! 👋", antilink: false, antilinkAction: "delete", antilinkMode: "admins", blockedCountries: [], antiforeign: false, antibot: false }; };
const ss = (g, d) => { const s = load(); s[g] = { ...gs(g), ...d }; return save(s); };
const bw = () => { try { return JSON.parse(fs.readFileSync(badWordsPath)); } catch { return {}; } };
const sbw = (d) => fs.writeFileSync(badWordsPath, JSON.stringify(d, null, 2));

const R = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fail = ["👾 Oops, circuits tangled. Retry?", "💥 Failed! But I'm still cool.", "😅 Something broke. Try again?"];
const badmin = ["🤖 I need admin powers. Promote me!", "⚡ Admin required, I'm just a servant."];
const miss = (t) => R([`🧐 Need a *${t}*!`, `🙈 Without *${t}* I'm lost.`]);

module.exports = [
    {
        command: "tagall",
        execute: async (sock, m, { reply }) => {
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                const meta = await sock.groupMetadata(m.chat);
                const members = meta.participants;
                let txt = R(["📢 Everyone's attention!", "📣 Summoning the squad!"]) + "\n\n";
                for (let p of members) txt += `@${p.id.split("@")[0]}\n`;
                await sock.sendMessage(m.chat, { text: txt, mentions: members.map(a => a.id) }, { quoted: m });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "kick",
        execute: async (sock, m, { reply }) => {
            let t = m.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!t) return reply(miss("user"));
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                await sock.groupParticipantsUpdate(m.chat, [t], "remove");
                reply(R([`👢 @${t.split("@")[0]} kicked!`, `🚪 @${t.split("@")[0]} left the chat.`]), { mentions: [t] });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "add",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply(miss("number"));
            let n = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                await sock.groupParticipantsUpdate(m.chat, [n], "add");
                reply(R([`🚀 @${n.split("@")[0]} joined!`, `🎉 @${n.split("@")[0]} is here!`]), { mentions: [n] });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "promote",
        execute: async (sock, m, { reply }) => {
            let t = m.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!t) return reply(miss("user"));
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                await sock.groupParticipantsUpdate(m.chat, [t], "promote");
                reply(R([`👑 @${t.split("@")[0]} is now admin.`, `📈 @${t.split("@")[0]} got promoted!`]), { mentions: [t] });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "demote",
        execute: async (sock, m, { reply }) => {
            let t = m.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!t) return reply(miss("user"));
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                await sock.groupParticipantsUpdate(m.chat, [t], "demote");
                reply(R([`📉 @${t.split("@")[0]} demoted.`, `😢 @${t.split("@")[0]} lost their badge.`]), { mentions: [t] });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "mute",
        execute: async (sock, m, { reply }) => {
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                await sock.groupSettingUpdate(m.chat, "announcement");
                reply(R(["🔇 Muted! Library mode on.", "🤫 Group is silent now."]));
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "unmute",
        execute: async (sock, m, { reply }) => {
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                await sock.groupSettingUpdate(m.chat, "not_announcement");
                reply(R(["🔊 Unmuted! Chaos resumes.", "🗣️ Everyone can talk again."]));
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "hidetag",
        execute: async (sock, m, { args, reply }) => {
            try {
                const meta = await sock.groupMetadata(m.chat);
                const msg = args.join(" ") || "👀";
                await sock.sendMessage(m.chat, { text: msg, mentions: meta.participants.map(p => p.id) });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "groupinfo",
        execute: async (sock, m, { reply }) => {
            try {
                const meta = await sock.groupMetadata(m.chat);
                reply(R(["📊 Group gossip:", "📋 Stats:"]) + `\n📌 *${meta.subject}*\n👥 ${meta.participants.length} members\n👮 ${meta.participants.filter(p => p.admin).length} admins`);
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "grouplink",
        execute: async (sock, m, { reply }) => {
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                const code = await sock.groupInviteCode(m.chat);
                reply(R(["🔗 VIP link:", "📎 Golden ticket:"]) + `\n\nhttps://chat.whatsapp.com/${code}`);
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "revokelink",
        execute: async (sock, m, { reply }) => {
            if (!m.isBotAdmin) return reply(R(badmin));
            try {
                await sock.groupRevokeInvite(m.chat);
                reply(R(["♻️ Link reset!", "🔗 Old link dead."]));
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "listadmin",
        execute: async (sock, m, { reply }) => {
            try {
                const meta = await sock.groupMetadata(m.chat);
                const admins = meta.participants.filter(p => p.admin);
                let txt = `👑 *Admins (${admins.length})*\n`;
                for (let a of admins) txt += `• @${a.id.split("@")[0]}\n`;
                await sock.sendMessage(m.chat, { text: txt, mentions: admins.map(a => a.id) });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "tagadmin",
        execute: async (sock, m, { args, reply }) => {
            try {
                const meta = await sock.groupMetadata(m.chat);
                const admins = meta.participants.filter(p => p.admin);
                const msg = args.join(" ") || "Attention admins!";
                let txt = `👑 *${msg}*\n`;
                for (let a of admins) txt += `@${a.id.split("@")[0]} `;
                await sock.sendMessage(m.chat, { text: txt, mentions: admins.map(a => a.id) });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "vcf",
        execute: async (sock, m, { reply }) => {
            try {
                const meta = await sock.groupMetadata(m.chat);
                let v = "";
                for (let p of meta.participants) {
                    let num = p.id.split("@")[0];
                    v += `BEGIN:VCARD\nVERSION:3.0\nFN:${num}\nTEL:${num}\nEND:VCARD\n`;
                }
                await sock.sendMessage(m.chat, { document: Buffer.from(v), fileName: "contacts.vcf", mimetype: "text/vcard" });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "promoteall",
        execute: async (sock, m, { reply }) => {
            try {
                const meta = await sock.groupMetadata(m.chat);
                const non = meta.participants.filter(p => !p.admin);
                if (non.length === 0) return reply(R(["🤷 Everyone's admin already.", "👑 All kings here."]));
                reply(`⏳ Promoting ${non.length}...`);
                for (let p of non) {
                    await sock.groupParticipantsUpdate(m.chat, [p.id], "promote");
                    await new Promise(r => setTimeout(r, 1000));
                }
                reply("✅ Done");
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "demoteall",
        execute: async (sock, m, { reply }) => {
            try {
                const meta = await sock.groupMetadata(m.chat);
                const botId = sock.user.id;
                const adm = meta.participants.filter(p => p.admin && p.id !== botId);
                if (adm.length === 0) return reply(R(["👑 I'm the only admin.", "🤴 No one to demote."]));
                reply(`⏳ Demoting ${adm.length}...`);
                for (let a of adm) {
                    await sock.groupParticipantsUpdate(m.chat, [a.id], "demote");
                    await new Promise(r => setTimeout(r, 1000));
                }
                reply("✅ Done");
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "poll",
        execute: async (sock, m, { args, reply }) => {
            let txt = args.join(" ");
            if (!txt.includes("|")) return reply(miss("poll options"));
            let [q, ...opts] = txt.split("|").map(t => t.trim());
            if (opts.length < 2) return reply(miss("poll options"));
            try {
                await sock.sendMessage(m.chat, { poll: { name: q, values: opts, selectableCount: 1 } });
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "welcome",
        execute: async (sock, m, { args, reply }) => {
            const a = args[0]?.toLowerCase();
            const cfg = gs(m.chat);
            if (a === "on") { reply(ss(m.chat, { welcome: true }) ? R(["✅ Red carpet ready!", "🎗️ Welcome ON!"]) : R(fail)); }
            else if (a === "off") { reply(ss(m.chat, { welcome: false }) ? R(["❌ Welcome silent.", "🫡 Newbies unnoticed."]) : R(fail)); }
            else { reply(`📊 Welcome: ${cfg.welcome ? "ON ✅" : "OFF ❌"}\n.welcome on/off`); }
        }
    },
    {
        command: "goodbye",
        execute: async (sock, m, { args, reply }) => {
            const a = args[0]?.toLowerCase();
            const cfg = gs(m.chat);
            if (a === "on") { reply(ss(m.chat, { goodbye: true }) ? R(["👋 Dramatic exits ON!", "💨 Goodbye ON!"]) : R(fail)); }
            else if (a === "off") { reply(ss(m.chat, { goodbye: false }) ? R(["😶 Exits silent.", "🫥 No goodbye drama."]) : R(fail)); }
            else { reply(`📊 Goodbye: ${cfg.goodbye ? "ON ✅" : "OFF ❌"}\n.goodbye on/off`); }
        }
    },
    {
        command: "antilink",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isAdmin) return reply(R(["😂 Admin only!", "🎫 Need badge."]));
            const a = args[0]?.toLowerCase();
            const cfg = gs(m.chat);
            if (a === "delete" || a === "warn" || a === "kick") { reply(ss(m.chat, { antilink: true, antilinkAction: a }) ? R([`🛡️ ${a.toUpperCase()} mode on!`, `🔗 Link police (${a}).`]) : R(fail)); }
            else if (a === "mode") { const m2 = args[1]?.toLowerCase(); if (m2 === "owner" || m2 === "admins") { reply(ss(m.chat, { antilinkMode: m2 }) ? R([`👑 Mode: ${m2.toUpperCase()}.`, `🎯 Only ${m2} can post links.`]) : R(fail)); } else { reply("❌ .antilink mode owner/admins"); } }
            else if (a === "off") { reply(ss(m.chat, { antilink: false }) ? R(["❌ Anti-link off.", "🔗 Links allowed."]) : R(fail)); }
            else { const cur = cfg.antilinkAction || "delete", m = cfg.antilinkMode || "admins"; reply(`🛡️ Anti-Link\nStatus: ${cfg.antilink ? "ON" : "OFF"}\nAction: ${cur}\nMode: ${m}\n\n.antilink delete/warn/kick\n.antilink mode owner/admins\n.antilink off`); }
        }
    },
    // new commands
    {
        command: "approveall", aliases: ["acceptall"], group: true, admin: true,
        execute: async (sock, m, { reply }) => {
            if (!m.isAdmin) return reply(R(["😅 Admin only!", "🎫 Need badge."]));
            try {
                const meta = await sock.groupMetadata(m.chat);
                const reqs = meta.joinRequests || [];
                if (reqs.length === 0) return reply("📋 No pending requests.");
                reply(`⏳ Approving ${reqs.length}...`);
                let ok = 0;
                for (let r of reqs) { try { await sock.groupRequestApproval(m.chat, r.jid, 'approve'); ok++; } catch {} }
                reply(R([`✅ ${ok}/${reqs.length} approved!`, `🎫 Let ${ok} in.`]));
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "kickinactive", aliases: ["inactive"], group: true, admin: true,
        execute: async (sock, m, { reply }) => {
            if (!m.isAdmin) return reply(R(["😅 Admin only!", "🎫 Need badge."]));
            if (!m.isBotAdmin) return reply(R(badmin));
            reply("⏳ Spring cleaning...");
            try {
                const meta = await sock.groupMetadata(m.chat);
                let k = 0;
                for (let p of meta.participants) { if (p.admin) continue; try { await sock.groupParticipantsUpdate(m.chat, [p.id], 'remove'); k++; await new Promise(r => setTimeout(r, 1000)); } catch {} }
                reply(R([`✅ ${k} gone!`, `🧹 Swept ${k}.`]));
            } catch { reply(R(fail)); }
        }
    },
    {
        command: "antibadword", aliases: ["antibad", "badword"], group: true, admin: true,
        execute: async (sock, m, { args, reply }) => {
            if (!m.isAdmin) return reply(R(["😅 Admin only!", "🎫 Need badge."]));
            const a = args[0]?.toLowerCase(); const w = args.slice(1).join(" ");
            const b = bw(); if (!b[m.chat]) b[m.chat] = { enabled: false, words: [] };
            if (a === "on") { b[m.chat].enabled = true; sbw(b); reply(R(["🛡️ Language filter ON!", "🤬 Watch your mouth!"])); }
            else if (a === "off") { b[m.chat].enabled = false; sbw(b); reply(R(["❌ Filter off.", "🕊️ Free speech."])); }
            else if (a === "add" && w) { b[m.chat].words.push(w.toLowerCase()); sbw(b); reply(R([`✅ "${w}" banned.`, `🚫 "${w}" is now illegal.`])); }
            else if (a === "remove" && w) { b[m.chat].words = b[m.chat].words.filter(x => x !== w.toLowerCase()); sbw(b); reply(R([`✅ "${w}" freed.`, `🕊️ "${w}" allowed.`])); }
            else if (a === "list") { reply(b[m.chat].words.length === 0 ? R(["📋 No bad words.", "🤐 All words safe."]) : `🚫 *Bad Words*\n${b[m.chat].words.map(x => `• ${x}`).join('\n')}`); }
            else { reply(`🛡️ Bad Words: ${b[m.chat].enabled ? "ON" : "OFF"}\n.antibadword on/off\n.antibadword add/remove [word]\n.antibadword list`); }
        }
    },
    {
        command: "antiforeign", aliases: ["blockcountry"], group: true, admin: true,
        execute: async (sock, m, { args, reply }) => {
            if (!m.isAdmin) return reply(R(["😅 Admin only!", "🎫 Need badge."]));
            if (!m.isBotAdmin) return reply(R(badmin));
            const a = args[0]?.toLowerCase(); const cfg = gs(m.chat);
            if (!cfg.blockedCountries) cfg.blockedCountries = [];
            if (!a) { let t = `🌍 Anti-Foreign: ${cfg.antiforeign ? "ON" : "OFF"}\n`; if (cfg.blockedCountries.length > 0) { t += `\n🚫 Blocked:\n`; cfg.blockedCountries.forEach(c => t += `• +${c}\n`); } return reply(t + `.antiforeign +263\n.antiforeign on/off`); }
            if (a === "on") { ss(m.chat, { antiforeign: true }); return reply(R(["🌍 Border control ON!", "🛂 Foreign filter activated."])); }
            if (a === "off") { ss(m.chat, { antiforeign: false, blockedCountries: [] }); return reply(R(["❌ Borders open.", "🌍 All welcome."])); }
            if (a === "list") { return reply(cfg.blockedCountries.length === 0 ? R(["📋 No countries blocked.", "🌍 Everyone's cool."]) : `🚫 Blocked: ${cfg.blockedCountries.map(c => `+${c}`).join(', ')}`); }
            if (a.startsWith('+')) { const code = a.replace(/[^0-9]/g, '');
                if (cfg.blockedCountries.includes(code)) { cfg.blockedCountries = cfg.blockedCountries.filter(c => c !== code); ss(m.chat, { blockedCountries: cfg.blockedCountries }); return reply(R([`✅ +${code} removed.`, `🕊️ +${code} allowed.`])); }
                cfg.blockedCountries.push(code); ss(m.chat, { blockedCountries: cfg.blockedCountries, antiforeign: true });
                reply(`🔄 Blocking +${code}...`);
                try { const meta = await sock.groupMetadata(m.chat); let k = 0; for (let p of meta.participants) { if (p.admin) continue; if (p.id.split('@')[0].startsWith(code)) { try { await sock.groupParticipantsUpdate(m.chat, [p.id], 'remove'); k++; await new Promise(r => setTimeout(r, 500)); } catch {} } } reply(R([`✅ Kicked ${k} from +${code}.`, `🧹 +${code} cleaned.`])); } catch { reply(R([`✅ +${code} blocked.`, `🛂 +${code} restricted.`])); }
            } else { reply("❌ .antiforeign +263"); }
        }
    },
    {
        command: "antibot", aliases: ["nobot", "removebot"], group: true, admin: true,
        execute: async (sock, m, { args, reply }) => {
            if (!m.isAdmin) return reply(R(["😅 Admin only!", "🎫 Need badge."]));
            if (!m.isBotAdmin) return reply(R(badmin));
            const a = args[0]?.toLowerCase();
            if (a === "on") { ss(m.chat, { antibot: true }); reply(R(["🤖 Bot hunter ON!", "🛡️ Anti-bot active."])); }
            else if (a === "off") { ss(m.chat, { antibot: false }); reply(R(["❌ Anti-bot off.", "🤖 Bots welcome."])); }
            else { reply(R(["🔍 Scanning for bots...", "🤖 Hunting imposters..."]));
                try { const meta = await sock.groupMetadata(m.chat); let k = 0; for (let p of meta.participants) { if (p.id === sock.user.id) continue; const name = (p.name || "").toLowerCase(); if (name.includes('bot') || name.includes('md') || name.includes('wa bot')) { try { await sock.groupParticipantsUpdate(m.chat, [p.id], 'remove'); k++; await new Promise(r => setTimeout(r, 500)); } catch {} } } reply(k === 0 ? R(["✅ No bots found!", "🤖 Humans only."]) : R([`✅ Kicked ${k} bots.`, `🤖 Removed ${k} imposters.`])); } catch { reply(R(fail)); } }
        }
    }
];