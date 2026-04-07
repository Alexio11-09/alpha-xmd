// © 2026 Alpha - GROUP COMMANDS (FULL 🔥)

module.exports = [

/* ================= TAGALL ================= */
{
command: "tagall",
category: "group",

execute: async (sock, m, { reply }) => {

if (!m.isGroup) return reply("❌ Group only");
if (!m.isAdmin) return reply("❌ Admin only");

const metadata = await sock.groupMetadata(m.chat);
const members = metadata.participants;

let text = "📢 *Tagging everyone:*\n\n";

for (let mem of members) {
text += `@${mem.id.split("@")[0]}\n`;
}

await sock.sendMessage(m.chat, {
text,
mentions: members.map(a => a.id)
}, { quoted: m });

}
},

/* ================= KICK ================= */
{
command: "kick",
category: "group",

execute: async (sock, m, { reply }) => {

if (!m.isGroup) return reply("❌ Group only");
if (!m.isAdmin) return reply("❌ Admin only");
if (!m.isBotAdmin) return reply("❌ Bot must be admin");

if (!m.mentionedJid[0]) return reply("❌ Tag user");

await sock.groupParticipantsUpdate(
m.chat,
[m.mentionedJid[0]],
"remove"
);

reply("✅ User kicked");

}
},

/* ================= ADD ================= */
{
command: "add",
category: "group",

execute: async (sock, m, { args, reply }) => {

if (!m.isGroup) return reply("❌ Group only");
if (!m.isAdmin) return reply("❌ Admin only");
if (!m.isBotAdmin) return reply("❌ Bot must be admin");

if (!args[0]) return reply("❌ Use: .add number");

let number = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

await sock.groupParticipantsUpdate(
m.chat,
[number],
"add"
);

reply("✅ User added");

}
},

/* ================= PROMOTE ================= */
{
command: "promote",
category: "group",

execute: async (sock, m, { reply }) => {

if (!m.isGroup) return reply("❌ Group only");
if (!m.isAdmin) return reply("❌ Admin only");
if (!m.isBotAdmin) return reply("❌ Bot must be admin");

if (!m.mentionedJid[0]) return reply("❌ Tag user");

await sock.groupParticipantsUpdate(
m.chat,
[m.mentionedJid[0]],
"promote"
);

reply("✅ Promoted");

}
},

/* ================= DEMOTE ================= */
{
command: "demote",
category: "group",

execute: async (sock, m, { reply }) => {

if (!m.isGroup) return reply("❌ Group only");
if (!m.isAdmin) return reply("❌ Admin only");
if (!m.isBotAdmin) return reply("❌ Bot must be admin");

if (!m.mentionedJid[0]) return reply("❌ Tag user");

await sock.groupParticipantsUpdate(
m.chat,
[m.mentionedJid[0]],
"demote"
);

reply("✅ Demoted");

}
},

/* ================= MUTE ================= */
{
command: "mute",
category: "group",

execute: async (sock, m, { reply }) => {

if (!m.isGroup) return reply("❌ Group only");
if (!m.isAdmin) return reply("❌ Admin only");
if (!m.isBotAdmin) return reply("❌ Bot must be admin");

await sock.groupSettingUpdate(m.chat, "announcement");

reply("🔇 Group muted (only admins can chat)");

}
},

/* ================= UNMUTE ================= */
{
command: "unmute",
category: "group",

execute: async (sock, m, { reply }) => {

if (!m.isGroup) return reply("❌ Group only");
if (!m.isAdmin) return reply("❌ Admin only");
if (!m.isBotAdmin) return reply("❌ Bot must be admin");

await sock.groupSettingUpdate(m.chat, "not_announcement");

reply("🔊 Group unmuted");

}
}

];