// © 2026 Alpha - GROUP COMMANDS (MENTION FIX)
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
            
            // Extract mentions from raw message
            let target = null;
            
            // Try to get from contextInfo
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // Try m.mentionedJid
            else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            }
            
            if (!target) {
                return reply("❌ Tag someone to kick!\nExample: .kick @user");
            }
            
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
            
            // Extract mentions from raw message - FIXED
            let target = null;
            
            // Try multiple ways to get the mentioned user
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            } else if (m.quoted && m.quoted.sender) {
                target = m.quoted.sender;
            }
            
            // Debug log
            console.log("[PROMOTE] Target found:", target);
            
            if (!target || !target.includes('@')) {
                return reply("❌ Tag someone or reply to their message!\nExample: .promote @user");
            }
            
            try {
                await sock.groupParticipantsUpdate(m.chat, [target], "promote");
                reply("✅ Promoted to admin");
            } catch (err) {
                console.log("[PROMOTE] Error:", err.message);
                reply("❌ Failed to promote user");
            }
        }
    },
    {
        command: "demote",
        execute: async (sock, m, { reply }) => {
            if (!m.isGroup) return reply("❌ Group only");
            if (!m.isAdmin) return reply("❌ Admin only");
            
            // Extract mentions from raw message - FIXED
            let target = null;
            
            // Try multiple ways to get the mentioned user
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            } else if (m.quoted && m.quoted.sender) {
                target = m.quoted.sender;
            }
            
            if (!target || !target.includes('@')) {
                return reply("❌ Tag someone or reply to their message!\nExample: .demote @user");
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
    }
];