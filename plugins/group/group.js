// © 2026 Alpha - FULL GROUP COMMANDS (FIXED)

const fs = require("fs");
const path = require("path");

// Database for settings
const dbPath = path.join(__dirname, "../database/groupSettings.json");
const loadSettings = () => { try { return JSON.parse(fs.readFileSync(dbPath)); } catch { return {}; } };
const saveSettings = (data) => { try { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); } catch {} };

// Get group settings
const getSettings = (groupId) => {
    const settings = loadSettings();
    return settings[groupId] || { welcome: false, welcomeMsg: "Welcome @user! 🎉", goodbye: false, goodbyeMsg: "Goodbye @user! 👋", antilink: false, antilinkAction: "delete" };
};

// Save group settings
const setSettings = (groupId, data) => {
    const settings = loadSettings();
    settings[groupId] = { ...getSettings(groupId), ...data };
    saveSettings(settings);
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
                setSettings(m.chat, { welcome: true });
                reply("✅ Welcome messages enabled!");
            } else if (action === "off") {
                setSettings(m.chat, { welcome: false });
                reply("❌ Welcome messages disabled!");
            } else if (action === "set" && args[1]) {
                const msg = args.slice(1).join(" ");
                setSettings(m.chat, { welcomeMsg: msg });
                reply(`✅ Welcome message set to:\n"${msg}"`);
            } else {
                const status = settings.welcome ? "ON ✅" : "OFF ❌";
                reply(`📊 *Welcome Settings*\n\nStatus: ${status}\nMessage: ${settings.welcomeMsg}\n\nCommands:\n.welcome on/off\n.welcome set [message]`);
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
                setSettings(m.chat, { goodbye: true });
                reply("✅ Goodbye messages enabled!");
            } else if (action === "off") {
                setSettings(m.chat, { goodbye: false });
                reply("❌ Goodbye messages disabled!");
            } else if (action === "set" && args[1]) {
                const msg = args.slice(1).join(" ");
                setSettings(m.chat, { goodbyeMsg: msg });
                reply(`✅ Goodbye message set to:\n"${msg}"`);
            } else {
                const status = settings.goodbye ? "ON ✅" : "OFF ❌";
                reply(`📊 *Goodbye Settings*\n\nStatus: ${status}\nMessage: ${settings.goodbyeMsg}\n\nCommands:\n.goodbye on/off\n.goodbye set [message]`);
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
                setSettings(m.chat, { antilink: true });
                reply("🛡️ Anti-link enabled! Mode: " + settings.antilinkAction);
            } else if (action === "off") {
                setSettings(m.chat, { antilink: false });
                reply("❌ Anti-link disabled!");
            } else if (action === "delete") {
                setSettings(m.chat, { antilink: true, antilinkAction: "delete" });
                reply("🛡️ Anti-link set to DELETE mode");
            } else if (action === "warn") {
                setSettings(m.chat, { antilink: true, antilinkAction: "warn" });
                reply("⚠️ Anti-link set to WARN mode");
            } else if (action === "kick") {
                setSettings(m.chat, { antilink: true, antilinkAction: "kick" });
                reply("🚫 Anti-link set to KICK mode");
            } else {
                const status = settings.antilink ? "ON ✅" : "OFF ❌";
                reply(`🛡️ *Anti-Link Settings*\n\nStatus: ${status}\nAction: ${settings.antilinkAction}\n\nCommands:\n.antilink on/off\n.antilink delete/warn/kick`);
            }
        }
    },
    {
        command: "listonline",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            reply("📱 *Online Status*\n\n⚠️ WhatsApp API no longer exposes online status for privacy reasons.\n\n💡 This is a WhatsApp limitation, not a bot issue.");
        }
    }
];