// © 2026 Alpha - GROUP COMMANDS (FULL 🔥)
console.log("🔥 group.js is loading...");

const fs = require("fs");
const path = require("path");

// ==================== DATABASE FOR SETTINGS ====================
const dbPath = path.join(__dirname, "../database/groupSettings.json");

// Load settings
const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(dbPath));
    } catch {
        return {};
    }
};

// Save settings
const saveSettings = (data) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch {}
};

// Get group settings
const getGroupSettings = (groupId) => {
    const settings = loadSettings();
    return settings[groupId] || {
        welcome: false,
        welcomeMsg: "Welcome @user to the group! 🎉",
        goodbye: false,
        goodbyeMsg: "Goodbye @user! 👋",
        antilink: false,
        antilinkAction: "delete"
    };
};

// Save group settings
const setGroupSettings = (groupId, data) => {
    const settings = loadSettings();
    settings[groupId] = { ...getGroupSettings(groupId), ...data };
    saveSettings(settings);
};

const commands = [
    // ==================== EXISTING COMMANDS ====================
    {
        command: "tagall",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const members = metadata.participants;
                let text = "📢 *Tagging everyone:*\n\n";
                for (let mem of members) {
                    text += `@${mem.id.split("@")[0]}\n`;
                }
                await sock.sendMessage(m.chat, { text, mentions: members.map(a => a.id) }, { quoted: m });
            } catch {
                reply("❌ Failed to tag members");
            }
        }
    },
    {
        command: "kick",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            let target = null;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            }
            
            if (!target) return reply("❌ Tag someone to kick!");
            
            try {
                await sock.groupParticipantsUpdate(m.chat, [target], "remove");
                reply("✅ User kicked");
            } catch {
                reply("❌ Failed to kick user");
            }
        }
    },
    {
        command: "add",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            if (!args || !args[0]) return reply("❌ Use: .add 123456789");
            
            let number = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            try {
                await sock.groupParticipantsUpdate(m.chat, [number], "add");
                reply("✅ User added");
            } catch {
                reply("❌ Failed to add user");
            }
        }
    },
    {
        command: "promote",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            let target = null;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            } else if (m.quoted && m.quoted.sender) {
                target = m.quoted.sender;
            }
            
            if (!target || !target.includes('@')) {
                return reply("❌ Tag someone or reply to their message!");
            }
            
            try {
                await sock.groupParticipantsUpdate(m.chat, [target], "promote");
                reply("✅ Promoted to admin");
            } catch {
                reply("❌ Failed to promote user");
            }
        }
    },
    {
        command: "demote",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            let target = null;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            } else if (m.quoted && m.quoted.sender) {
                target = m.quoted.sender;
            }
            
            if (!target || !target.includes('@')) {
                return reply("❌ Tag someone or reply to their message!");
            }
            
            try {
                await sock.groupParticipantsUpdate(m.chat, [target], "demote");
                reply("✅ Demoted from admin");
            } catch {
                reply("❌ Failed to demote user");
            }
        }
    },
    {
        command: "mute",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            try {
                await sock.groupSettingUpdate(m.chat, "announcement");
                reply("🔇 Group muted (only admins can chat)");
            } catch {
                reply("❌ Failed to mute group");
            }
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
            } catch {
                reply("❌ Failed to unmute group");
            }
        }
    },

    // ==================== NEW COMMANDS ====================
    {
        command: "hidetag",
        aliases: ["ht"],
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            const message = args.join(" ") || "👀";
            
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const members = metadata.participants;
                
                await sock.sendMessage(m.chat, {
                    text: message,
                    mentions: members.map(p => p.id)
                });
            } catch {
                reply("❌ Failed to send hidden tag");
            }
        }
    },
    {
        command: "groupinfo",
        aliases: ["ginfo"],
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const owner = metadata.owner || "Unknown";
                const created = new Date(metadata.creation * 1000).toLocaleDateString();
                
                let text = `📊 *GROUP INFORMATION*\n\n`;
                text += `📌 *Name:* ${metadata.subject}\n`;
                text += `📝 *Description:* ${metadata.desc || "No description"}\n`;
                text += `👑 *Owner:* @${owner.split("@")[0]}\n`;
                text += `📅 *Created:* ${created}\n`;
                text += `👥 *Members:* ${metadata.participants.length}\n`;
                text += `👮 *Admins:* ${metadata.participants.filter(p => p.admin).length}\n`;
                
                await sock.sendMessage(m.chat, { text, mentions: [owner] }, { quoted: m });
            } catch {
                reply("❌ Failed to get group info");
            }
        }
    },
    {
        command: "grouplink",
        aliases: ["link"],
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            try {
                const code = await sock.groupInviteCode(m.chat);
                const link = `https://chat.whatsapp.com/${code}`;
                reply(`🔗 *Group Invite Link*\n\n${link}`);
            } catch {
                reply("❌ Failed to get group link");
            }
        }
    },
    {
        command: "revokelink",
        aliases: ["resetlink"],
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            try {
                await sock.groupRevokeInvite(m.chat);
                reply("✅ Group invite link has been reset!");
            } catch {
                reply("❌ Failed to reset group link");
            }
        }
    },
    {
        command: "listadmin",
        aliases: ["admins"],
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const admins = metadata.participants.filter(p => p.admin);
                
                let text = `👑 *GROUP ADMINS (${admins.length})*\n\n`;
                const mentions = [];
                
                for (let admin of admins) {
                    text += `• @${admin.id.split("@")[0]}\n`;
                    mentions.push(admin.id);
                }
                
                await sock.sendMessage(m.chat, { text, mentions }, { quoted: m });
            } catch {
                reply("❌ Failed to get admin list");
            }
        }
    },
    {
        command: "tagadmin",
        aliases: ["tadmin"],
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            const message = args.join(" ") || "Attention admins!";
            
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const admins = metadata.participants.filter(p => p.admin);
                
                let text = `👑 *${message}*\n\n`;
                const mentions = [];
                
                for (let admin of admins) {
                    text += `@${admin.id.split("@")[0]} `;
                    mentions.push(admin.id);
                }
                
                await sock.sendMessage(m.chat, { text, mentions }, { quoted: m });
            } catch {
                reply("❌ Failed to tag admins");
            }
        }
    },
    {
        command: "vcf",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            
            let target = null;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            }
            
            try {
                if (!target) {
                    const metadata = await sock.groupMetadata(m.chat);
                    const members = metadata.participants;
                    
                    let vcf = "";
                    for (let mem of members) {
                        const num = mem.id.split("@")[0];
                        vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:${num}\nTEL;TYPE=CELL:${num}\nEND:VCARD\n`;
                    }
                    
                    await sock.sendMessage(m.chat, {
                        document: Buffer.from(vcf),
                        fileName: `group_contacts.vcf`,
                        mimetype: "text/vcard"
                    }, { quoted: m });
                } else {
                    const num = target.split("@")[0];
                    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:${num}\nTEL;TYPE=CELL:${num}\nEND:VCARD`;
                    
                    await sock.sendMessage(m.chat, {
                        document: Buffer.from(vcf),
                        fileName: `contact_${num}.vcf`,
                        mimetype: "text/vcard"
                    }, { quoted: m });
                }
            } catch {
                reply("❌ Failed to create VCF");
            }
        }
    },
    {
        command: "promoteall",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const nonAdmins = metadata.participants.filter(p => !p.admin);
                
                if (nonAdmins.length === 0) {
                    return reply("❌ No members to promote!");
                }
                
                reply(`⏳ Promoting ${nonAdmins.length} members to admin...`);
                
                for (let member of nonAdmins) {
                    try {
                        await sock.groupParticipantsUpdate(m.chat, [member.id], "promote");
                        await new Promise(r => setTimeout(r, 1000));
                    } catch {}
                }
                
                reply(`✅ Promoted ${nonAdmins.length} members to admin!`);
            } catch {
                reply("❌ Failed to promote members");
            }
        }
    },
    {
        command: "demoteall",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            try {
                const metadata = await sock.groupMetadata(m.chat);
                const botId = sock.user.id;
                const admins = metadata.participants.filter(p => p.admin && p.id !== botId);
                
                if (admins.length === 0) {
                    return reply("❌ No admins to demote (bot stays admin)!");
                }
                
                reply(`⏳ Demoting ${admins.length} admins...`);
                
                for (let admin of admins) {
                    try {
                        await sock.groupParticipantsUpdate(m.chat, [admin.id], "demote");
                        await new Promise(r => setTimeout(r, 1000));
                    } catch {}
                }
                
                reply(`✅ Demoted ${admins.length} admins!`);
            } catch {
                reply("❌ Failed to demote admins");
            }
        }
    },

    // ==================== WELCOME & GOODBYE ====================
    {
        command: "welcome",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            const action = args[0]?.toLowerCase();
            const settings = getGroupSettings(m.chat);
            
            if (action === "on") {
                setGroupSettings(m.chat, { welcome: true });
                reply("✅ Welcome messages enabled!");
            } else if (action === "off") {
                setGroupSettings(m.chat, { welcome: false });
                reply("❌ Welcome messages disabled!");
            } else if (action === "set" && args[1]) {
                const msg = args.slice(1).join(" ");
                setGroupSettings(m.chat, { welcomeMsg: msg });
                reply(`✅ Welcome message set to:\n"${msg}"\n\nUse @user to mention the new member.`);
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
            const settings = getGroupSettings(m.chat);
            
            if (action === "on") {
                setGroupSettings(m.chat, { goodbye: true });
                reply("✅ Goodbye messages enabled!");
            } else if (action === "off") {
                setGroupSettings(m.chat, { goodbye: false });
                reply("❌ Goodbye messages disabled!");
            } else if (action === "set" && args[1]) {
                const msg = args.slice(1).join(" ");
                setGroupSettings(m.chat, { goodbyeMsg: msg });
                reply(`✅ Goodbye message set to:\n"${msg}"\n\nUse @user to mention the leaving member.`);
            } else {
                const status = settings.goodbye ? "ON ✅" : "OFF ❌";
                reply(`📊 *Goodbye Settings*\n\nStatus: ${status}\nMessage: ${settings.goodbyeMsg}\n\nCommands:\n.goodbye on/off\n.goodbye set [message]`);
            }
        }
    },

    // ==================== ANTILINK ====================
    {
        command: "antilink",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            const action = args[0]?.toLowerCase();
            const settings = getGroupSettings(m.chat);
            
            if (action === "on") {
                setGroupSettings(m.chat, { antilink: true });
                reply("🛡️ Anti-link protection enabled!");
            } else if (action === "off") {
                setGroupSettings(m.chat, { antilink: false });
                reply("❌ Anti-link protection disabled!");
            } else if (action === "delete") {
                setGroupSettings(m.chat, { antilink: true, antilinkAction: "delete" });
                reply("🛡️ Anti-link set to DELETE mode (messages will be deleted)");
            } else if (action === "warn") {
                setGroupSettings(m.chat, { antilink: true, antilinkAction: "warn" });
                reply("⚠️ Anti-link set to WARN mode (users will be warned)");
            } else if (action === "kick") {
                setGroupSettings(m.chat, { antilink: true, antilinkAction: "kick" });
                reply("🚫 Anti-link set to KICK mode (users will be kicked)");
            } else {
                const status = settings.antilink ? "ON ✅" : "OFF ❌";
                reply(`🛡️ *Anti-Link Settings*\n\nStatus: ${status}\nAction: ${settings.antilinkAction || "delete"}\n\nCommands:\n.antilink on/off\n.antilink delete/warn/kick`);
            }
        }
    },

    // ==================== POLL ====================
    {
        command: "poll",
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            
            const text = args.join(" ");
            if (!text.includes("|")) {
                return reply("❌ Format: .poll Question | Option1 | Option2 | Option3");
            }
            
            const parts = text.split("|").map(s => s.trim());
            const question = parts[0];
            const options = parts.slice(1);
            
            if (options.length < 2) {
