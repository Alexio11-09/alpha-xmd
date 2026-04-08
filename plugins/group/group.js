// © 2026 Alpha - FULL GROUP COMMANDS (WITH ANTILINK MODE)
const fs = require("fs");

// Try multiple database paths (same as index.js)
let dbPath = './database/groupSettings.json';
try {
    if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
    fs.writeFileSync(dbPath, '{}', { flag: 'a' });
} catch {
    dbPath = '/tmp/groupSettings.json';
}

const loadSettings = () => { 
    try { 
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
        return JSON.parse(fs.readFileSync(dbPath)); 
    } catch { 
        return {}; 
    } 
};

const saveSettings = (data) => { 
    try { 
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); 
        return true;
    } catch {
        return false;
    }
};

const getSettings = (groupId) => {
    const settings = loadSettings();
    return settings[groupId] || { 
        welcome: false, welcomeMsg: "Welcome @user! 🎉", 
        goodbye: false, goodbyeMsg: "Goodbye @user! 👋", 
        antilink: false, antilinkAction: "delete", antilinkMode: "admins" 
    };
};

const setSettings = (groupId, data) => {
    const settings = loadSettings();
    settings[groupId] = { ...getSettings(groupId), ...data };
    return saveSettings(settings);
};

module.exports = [
    {
        command: "tagall",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const members = metadata.participants;
                let text = "📢 *Tagging everyone:*\n\n";
                for (let mem of members) text += `@${mem.id.split("@")[0]}\n`;
                await sock.sendMessage(m.chat, { text, mentions: members.map(a => a.id) }, { quoted: m });
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "kick",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            let target = m.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!target) return reply("❌ Tag someone");
            try {
                await sock.groupParticipantsUpdate(m.chat, [target], "remove");
                reply("✅ User kicked");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "add",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            if (!args[0]) return reply("❌ Use: .add 123456789");
            let number = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            try {
                await sock.groupParticipantsUpdate(m.chat, [number], "add");
                reply("✅ User added");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "promote",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            let target = m.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!target) return reply("❌ Tag someone");
            try {
                await sock.groupParticipantsUpdate(m.chat, [target], "promote");
                reply("✅ Promoted");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "demote",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            let target = m.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!target) return reply("❌ Tag someone");
            try {
                await sock.groupParticipantsUpdate(m.chat, [target], "demote");
                reply("✅ Demoted");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "mute",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                await sock.groupSettingUpdate(m.chat, "announcement");
                reply("🔇 Group muted");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "unmute",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                await sock.groupSettingUpdate(m.chat, "not_announcement");
                reply("🔊 Group unmuted");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "hidetag",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const msg = args.join(" ") || "👀";
                await sock.sendMessage(m.chat, { text: msg, mentions: metadata.participants.map(p => p.id) });
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "groupinfo",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            try {
                const meta = await sock.groupMetadata(m.chat);
                let text = `📊 *${meta.subject}*\n👥 ${meta.participants.length} members\n👮 ${meta.participants.filter(p => p.admin).length} admins`;
                reply(text);
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "grouplink",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                const code = await sock.groupInviteCode(m.chat);
                reply(`🔗 https://chat.whatsapp.com/${code}`);
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "revokelink",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                await sock.groupRevokeInvite(m.chat);
                reply("✅ Link reset");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "listadmin",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            try {
                const meta = await sock.groupMetadata(m.chat);
                const admins = meta.participants.filter(p => p.admin);
                let text = `👑 *Admins (${admins.length})*\n`;
                for (let a of admins) text += `• @${a.id.split("@")[0]}\n`;
                await sock.sendMessage(m.chat, { text, mentions: admins.map(a => a.id) });
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "tagadmin",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                const meta = await sock.groupMetadata(m.chat);
                const admins = meta.participants.filter(p => p.admin);
                const msg = args.join(" ") || "Attention admins!";
                let text = `👑 *${msg}*\n`;
                for (let a of admins) text += `@${a.id.split("@")[0]} `;
                await sock.sendMessage(m.chat, { text, mentions: admins.map(a => a.id) });
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "vcf",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            try {
                const meta = await sock.groupMetadata(m.chat);
                let vcf = "";
                for (let p of meta.participants) {
                    let num = p.id.split("@")[0];
                    vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:${num}\nTEL:${num}\nEND:VCARD\n`;
                }
                await sock.sendMessage(m.chat, { document: Buffer.from(vcf), fileName: "contacts.vcf", mimetype: "text/vcard" });
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "promoteall",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                const meta = await sock.groupMetadata(m.chat);
                const nonAdmins = meta.participants.filter(p => !p.admin);
                if (nonAdmins.length === 0) return reply("❌ No members");
                reply(`⏳ Promoting ${nonAdmins.length} members...`);
                for (let p of nonAdmins) {
                    await sock.groupParticipantsUpdate(m.chat, [p.id], "promote");
                    await new Promise(r => setTimeout(r, 1000));
                }
                reply("✅ Done");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "demoteall",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            try {
                const meta = await sock.groupMetadata(m.chat);
                const botId = sock.user.id;
                const admins = meta.participants.filter(p => p.admin && p.id !== botId);
                if (admins.length === 0) return reply("❌ No admins");
                reply(`⏳ Demoting ${admins.length} admins...`);
                for (let a of admins) {
                    await sock.groupParticipantsUpdate(m.chat, [a.id], "demote");
                    await new Promise(r => setTimeout(r, 1000));
                }
                reply("✅ Done");
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "poll",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            let text = args.join(" ");
            if (!text.includes("|")) return reply("❌ Format: .poll Question | Option1 | Option2");
            let [q, ...opts] = text.split("|").map(s => s.trim());
            if (opts.length < 2) return reply("❌ Need 2+ options");
            try {
                await sock.sendMessage(m.chat, { poll: { name: q, values: opts, selectableCount: 1 } });
            } catch { reply("❌ Failed"); }
        }
    },
    {
        command: "welcome",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            const action = args[0]?.toLowerCase();
            const settings = getSettings(m.chat);
            
            if (action === "on") {
                const saved = setSettings(m.chat, { welcome: true });
                reply(saved ? "✅ Welcome enabled!" : "❌ Failed to save");
            } else if (action === "off") {
                const saved = setSettings(m.chat, { welcome: false });
                reply(saved ? "❌ Welcome disabled!" : "❌ Failed to save");
            } else {
                reply(`📊 Welcome: ${settings.welcome ? "ON ✅" : "OFF ❌"}\n\n.welcome on/off`);
            }
        }
    },
    {
        command: "goodbye",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            const action = args[0]?.toLowerCase();
            const settings = getSettings(m.chat);
            
            if (action === "on") {
                const saved = setSettings(m.chat, { goodbye: true });
                reply(saved ? "✅ Goodbye enabled!" : "❌ Failed to save");
            } else if (action === "off") {
                const saved = setSettings(m.chat, { goodbye: false });
                reply(saved ? "❌ Goodbye disabled!" : "❌ Failed to save");
            } else {
                reply(`📊 Goodbye: ${settings.goodbye ? "ON ✅" : "OFF ❌"}\n\n.goodbye on/off`);
            }
        }
    },
    {
        command: "antilink",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            const action = args[0]?.toLowerCase();
            const settings = getSettings(m.chat);
            
            if (action === "on") {
                const saved = setSettings(m.chat, { antilink: true });
                reply(saved ? "🛡️ Anti-link enabled!" : "❌ Failed to save");
            } else if (action === "off") {
                const saved = setSettings(m.chat, { antilink: false });
                reply(saved ? "❌ Anti-link disabled!" : "❌ Failed to save");
            } else if (action === "delete" || action === "warn" || action === "kick") {
                const saved = setSettings(m.chat, { antilink: true, antilinkAction: action });
                reply(saved ? `🛡️ Anti-link set to ${action.toUpperCase()} mode` : "❌ Failed to save");
            } else if (action === "mode") {
                const mode = args[1]?.toLowerCase();
                if (mode === "owner") {
                    const saved = setSettings(m.chat, { antilinkMode: "owner" });
                    reply(saved ? "👑 Anti-link mode: OWNER ONLY" : "❌ Failed to save");
                } else if (mode === "admins") {
                    const saved = setSettings(m.chat, { antilinkMode: "admins" });
                    reply(saved ? "👥 Anti-link mode: ADMINS + OWNER" : "❌ Failed to save");
                } else {
                    reply(`❌ Usage: .antilink mode owner/admins`);
                }
            } else {
                reply(`🛡️ *Anti-Link Settings*\n\nStatus: ${settings.antilink ? "ON ✅" : "OFF ❌"}\nAction: ${settings.antilinkAction}\nMode: ${settings.antilinkMode || "admins"}\n\nCommands:\n.antilink on/off\n.antilink delete/warn/kick\n.antilink mode owner/admins`);
            }
        }
    },
    {
        command: "listonline",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            reply("📱 WhatsApp API doesn't expose online status.");
        }
    }
];