// © 2026 Alpha - OWNER COMMANDS (UPDATE REMOVED)

const fs = require('fs');
const { exec } = require('child_process');

// Database for banned users
const banPath = './database/banned.json';
if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
if (!fs.existsSync(banPath)) fs.writeFileSync(banPath, '{}');

// Database for owners
const ownerPath = './database/owners.json';
if (!fs.existsSync(ownerPath)) fs.writeFileSync(ownerPath, JSON.stringify({ tempOwners: [] }));

// Helper functions
const loadBanned = () => { try { return JSON.parse(fs.readFileSync(banPath)); } catch { return {}; } };
const saveBanned = (data) => fs.writeFileSync(banPath, JSON.stringify(data, null, 2));
const loadOwners = () => { try { return JSON.parse(fs.readFileSync(ownerPath)); } catch { return { tempOwners: [] }; } };
const saveOwners = (data) => fs.writeFileSync(ownerPath, JSON.stringify(data, null, 2));

const clean = (jid) => jid ? jid.toString().replace(/[^0-9]/g, '') : '';

module.exports = [

    // ==================== GET BOT IP ====================
    {
        command: "botip",
        aliases: ["serverip", "myip", "getip"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { reply }) => {
            reply("🌐 *Fetching server IP...*");
            
            exec('curl -s ifconfig.me', (err, stdout) => {
                if (err) {
                    // Try alternative method
                    exec('curl -s ipinfo.io/ip', (err2, stdout2) => {
                        if (err2) {
                            return reply("❌ Could not get IP address.\n\nCheck your panel for the server address.");
                        }
                        reply(`🌐 *Bot Server IP:*\n\n\`${stdout2.trim()}\`\n\n📌 Use this in your website:\n\`http://${stdout2.trim()}:3000\``);
                    });
                    return;
                }
                reply(`🌐 *Bot Server IP:*\n\n\`${stdout.trim()}\`\n\n📌 Use this in your website:\n\`http://${stdout.trim()}:3000\``);
            });
        }
    },

    // ==================== RESTART ====================
    {
        command: "restart",
        aliases: ["reboot", "reload"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { reply }) => {
            await reply("🔄 *Restarting bot...*\n\n⏳ Bot will be back in a few seconds!");
            setTimeout(() => process.exit(0), 2000);
        }
    },

    // ==================== SHUTDOWN ====================
    {
        command: "shutdown",
        aliases: ["stop", "kill"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { reply }) => {
            await reply("🔴 *Shutting down bot...*\n\n👋 Goodbye!");
            setTimeout(() => process.exit(0), 1500);
        }
    },

    // ==================== EVAL ====================
    {
        command: "eval",
        aliases: [">", "exec"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide code to evaluate!");
            const code = args.join(" ");
            try {
                let result = eval(code);
                if (typeof result === 'object') result = JSON.stringify(result, null, 2);
                reply(`✅ *Eval Result:*\n\n\`\`\`\n${String(result).substring(0, 1000)}\n\`\`\``);
            } catch (err) {
                reply(`❌ *Error:*\n\n\`\`\`\n${err.message}\n\`\`\``);
            }
        }
    },

    // ==================== BROADCAST ====================
    {
        command: "bc",
        aliases: ["broadcast", "announce"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a message to broadcast!");
            const message = args.join(" ");
            const chats = Object.keys(await sock.groupFetchAllParticipating());
            if (chats.length === 0) return reply("❌ Bot is not in any groups!");
            reply(`📢 *Broadcasting to ${chats.length} groups...*`);
            let success = 0, failed = 0;
            for (let chat of chats) {
                try {
                    await sock.sendMessage(chat, { text: `📢 *BROADCAST*\n\n${message}\n\n👑 *Owner Announcement*` });
                    success++;
                    await new Promise(r => setTimeout(r, 500));
                } catch { failed++; }
            }
            reply(`✅ *Broadcast Complete!*\n\n📊 Sent: ${success}\n❌ Failed: ${failed}`);
        }
    },

    // ==================== BROADCAST GROUP ====================
    {
        command: "bcgc",
        aliases: ["bcgroup", "broadcastgc"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a message to broadcast!");
            const message = args.join(" ");
            const chats = Object.keys(await sock.groupFetchAllParticipating());
            if (chats.length === 0) return reply("❌ Bot is not in any groups!");
            reply(`📢 *Broadcasting to ${chats.length} groups...*`);
            let success = 0, failed = 0;
            for (let chat of chats) {
                try {
                    await sock.sendMessage(chat, { text: message });
                    success++;
                    await new Promise(r => setTimeout(r, 500));
                } catch { failed++; }
            }
            reply(`✅ *Broadcast Complete!*\n\n📊 Sent: ${success}\n❌ Failed: ${failed}`);
        }
    },

    // ==================== JOIN GROUP ====================
    {
        command: "join",
        aliases: ["joingroup", "enter"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a group invite link!");
            const link = args[0];
            const inviteCode = link.split('/').pop().replace(/\?.*/, '');
            if (!inviteCode) return reply("❌ Invalid invite link!");
            try {
                const res = await sock.groupAcceptInvite(inviteCode);
                reply(`✅ *Joined Group!*\n\n📱 Group ID: ${res}`);
            } catch (err) {
                reply(`❌ Failed to join group:\n${err.message}`);
            }
        }
    },

    // ==================== LEAVE GROUP ====================
    {
        command: "leave",
        aliases: ["exit", "leavegroup"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!m.isGroup) return reply("❌ This command only works in groups!");
            const groupId = m.chat;
            if (args[0] && args[0].toLowerCase() === "all") {
                reply("⚠️ *Leaving all groups...*");
                const chats = Object.keys(await sock.groupFetchAllParticipating());
                let success = 0;
                for (let chat of chats) {
                    try {
                        await sock.groupLeave(chat);
                        success++;
                        await new Promise(r => setTimeout(r, 500));
                    } catch {}
                }
                reply(`✅ Left ${success} groups!`);
            } else {
                try {
                    await sock.sendMessage(groupId, { text: "👋 *Bot leaving group...*" });
                    setTimeout(async () => { await sock.groupLeave(groupId); }, 1500);
                    reply("✅ Leaving group...");
                } catch (err) {
                    reply(`❌ Failed to leave group:\n${err.message}`);
                }
            }
        }
    },

    // ==================== BLOCK USER ====================
    {
        command: "block",
        aliases: ["blockuser"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            let target;
            if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
            else if (args[0] && args[0].includes('@')) target = args[0];
            else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            else if (m.quoted) target = m.quoted.sender;
            else return reply("❌ Tag someone or provide a number!");
            try {
                await sock.updateBlockStatus(target, 'block');
                reply(`✅ *User Blocked!*\n\n📱 @${target.split('@')[0]}`, { mentions: [target] });
            } catch (err) {
                reply(`❌ Failed to block user:\n${err.message}`);
            }
        }
    },

    // ==================== UNBLOCK USER ====================
    {
        command: "unblock",
        aliases: ["unblockuser"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            let target;
            if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
            else if (args[0] && args[0].includes('@')) target = args[0];
            else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            else if (m.quoted) target = m.quoted.sender;
            else return reply("❌ Tag someone or provide a number!");
            try {
                await sock.updateBlockStatus(target, 'unblock');
                reply(`✅ *User Unblocked!*\n\n📱 @${target.split('@')[0]}`, { mentions: [target] });
            } catch (err) {
                reply(`❌ Failed to unblock user:\n${err.message}`);
            }
        }
    },

    // ==================== BLOCKLIST ====================
    {
        command: "blocklist",
        aliases: ["listblock", "blocks"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { reply }) => {
            try {
                const blocked = await sock.fetchBlocklist();
                if (blocked.length === 0) return reply("📋 *No blocked users!*");
                let text = `🚫 *BLOCKED USERS (${blocked.length})*\n\n`;
                for (let user of blocked) {
                    text += `• @${user.split('@')[0]}\n`;
                }
                await sock.sendMessage(m.chat, { text, mentions: blocked }, { quoted: m });
            } catch (err) {
                reply(`❌ Failed to fetch blocklist:\n${err.message}`);
            }
        }
    },

    // ==================== PM (Private Message) ====================
    {
        command: "pm",
        aliases: ["msg", "send"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a number and message!\n\n📌 Example: .pm 123456789 Hello");
            const number = args[0].replace(/[^0-9]/g, '');
            const message = args.slice(1).join(" ");
            if (!message) return reply("❌ Provide a message to send!");
            const jid = number + '@s.whatsapp.net';
            try {
                await sock.sendMessage(jid, { text: `📨 *Message from Owner:*\n\n${message}` });
                reply(`✅ *Message sent to ${number}!*`);
            } catch (err) {
                reply(`❌ Failed to send message:\n${err.message}`);
            }
        }
    },

    // ==================== BAN USER ====================
    {
        command: "banuser",
        aliases: ["ban"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            let target;
            if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
            else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            else if (m.quoted) target = m.quoted.sender;
            else return reply("❌ Tag someone or provide a number!");
            const banned = loadBanned();
            const targetNum = clean(target);
            banned[targetNum] = { jid: target, date: new Date().toISOString() };
            saveBanned(banned);
            reply(`🚫 *User Banned!*\n\n📱 @${target.split('@')[0]}\n\nThey can no longer use bot commands.`, { mentions: [target] });
        }
    },

    // ==================== UNBAN USER ====================
    {
        command: "unbanuser",
        aliases: ["unban"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            let target;
            if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
            else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            else if (m.quoted) target = m.quoted.sender;
            else return reply("❌ Tag someone or provide a number!");
            const banned = loadBanned();
            const targetNum = clean(target);
            if (banned[targetNum]) {
                delete banned[targetNum];
                saveBanned(banned);
                reply(`✅ *User Unbanned!*\n\n📱 @${target.split('@')[0]}`, { mentions: [target] });
            } else {
                reply("❌ User is not banned!");
            }
        }
    },

    // ==================== BANLIST ====================
    {
        command: "banlist",
        aliases: ["banned", "listban"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { reply }) => {
            const banned = loadBanned();
            const bannedUsers = Object.values(banned);
            if (bannedUsers.length === 0) return reply("📋 *No banned users!*");
            let text = `🚫 *BANNED USERS (${bannedUsers.length})*\n\n`;
            const mentions = [];
            for (let user of bannedUsers) {
                text += `• @${user.jid.split('@')[0]}\n`;
                mentions.push(user.jid);
            }
            await sock.sendMessage(m.chat, { text, mentions }, { quoted: m });
        }
    },

    // ==================== ADD OWNER ====================
    {
        command: "addowner",
        aliases: ["addown"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            let target;
            if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
            else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            else if (m.quoted) target = m.quoted.sender;
            else return reply("❌ Tag someone or provide a number!");
            const owners = loadOwners();
            const targetNum = clean(target);
            if (!owners.tempOwners.includes(targetNum)) {
                owners.tempOwners.push(targetNum);
                saveOwners(owners);
                reply(`👑 *Owner Added!*\n\n📱 @${target.split('@')[0]} now has owner access.`, { mentions: [target] });
            } else {
                reply("❌ User is already an owner!");
            }
        }
    },

    // ==================== DELETE OWNER ====================
    {
        command: "delowner",
        aliases: ["removeowner", "delown"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            let target;
            if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
            else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            else if (m.quoted) target = m.quoted.sender;
            else return reply("❌ Tag someone or provide a number!");
            const owners = loadOwners();
            const targetNum = clean(target);
            const index = owners.tempOwners.indexOf(targetNum);
            if (index > -1) {
                owners.tempOwners.splice(index, 1);
                saveOwners(owners);
                reply(`✅ *Owner Removed!*\n\n📱 @${target.split('@')[0]}`, { mentions: [target] });
            } else {
                reply("❌ User is not an owner!");
            }
        }
    },

    // ==================== OWNERS LIST ====================
    {
        command: "owners",
        aliases: ["listowner", "ownerlist"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { reply, config }) => {
            const owners = loadOwners();
            let text = `👑 *BOT OWNERS*\n\n`;
            text += `🔷 *Main Owner:* ${config.owner.join(', ')}\n`;
            if (owners.tempOwners.length > 0) {
                text += `\n🔶 *Temp Owners:*\n`;
                for (let owner of owners.tempOwners) {
                    text += `• ${owner}\n`;
                }
            }
            reply(text);
        }
    },

    // ==================== GET CHANNEL JID ====================
    {
        command: "getchannel",
        aliases: ["channeljid", "cjid"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a channel link!\n\n📌 Example: .getchannel https://whatsapp.com/channel/xxx");
            const link = args[0];
            const match = link.match(/channel\/([^\/\?]+)/);
            if (!match) return reply("❌ Invalid channel link!");
            const channelId = match[1];
            const jid = channelId + '@newsletter';
            reply(`✅ *Channel JID:*\n\n\`${jid}\`\n\n📌 Add this to your config.js!\n\n🔗 *ID:* ${channelId}`);
        }
    },

    // ==================== MY CHANNELS ====================
    {
        command: "mychannels",
        aliases: ["channels", "listchannels"],
        category: "owner",
        owner: true,
        execute: async (sock, m, { reply }) => {
            reply("📰 *Channel Info*\n\nTo get a channel JID, use:\n.getchannel [channel_link]\n\nExample:\n.getchannel https://whatsapp.com/channel/0029Vb7nHdBFnSzBDbvL6y1X\n\n📌 *Your Channel JID will be:*\n`0029Vb7nHdBFnSzBDbvL6y1X@newsletter`");
        }
    }

];