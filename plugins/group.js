// © 2026 Alpha - FINAL GROUP SYSTEM (STABLE 💯)

module.exports = {
    command: "group",
    description: "Group management commands",
    category: "group",

    execute: async (sock, m, { args, reply }) => {
        try {

            if (!m.isGroup) return reply("❌ Group only command");

            const action = args[0]?.toLowerCase();

            // 📜 MENU (VERTICAL STYLE 🔥)
            if (!action) {
                return reply(`👥 GROUP COMMANDS

Add
Kick
Promote
Demote
Tagall
Hidetag
Open
Close
Lock
Unlock
Ginfo
Glink
`);
            }

            // 🔥 GET METADATA
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;

            // ✅ FIXED ADMIN DETECTION
            const groupAdmins = participants
                .filter(p => p.admin === "admin" || p.admin === "superadmin")
                .map(p => p.id);

            // 🔥 BOT ID FIX
            const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

            const isAdmin = groupAdmins.includes(m.sender);
            const isBotAdmin = groupAdmins.includes(botId);

            // 🧠 DEBUG (KEEP THIS)
            console.log("====== DEBUG START ======");
            console.log("BOT:", botId);
            console.log("SENDER:", m.sender);
            participants.forEach(p => {
                console.log(p.id, "|", p.admin);
            });
            console.log("isAdmin:", isAdmin);
            console.log("isBotAdmin:", isBotAdmin);
            console.log("====== DEBUG END ======");

            // ✅ SAFE MENTION
            const mentioned =
                (m.mentionedJid && m.mentionedJid[0]) ||
                (m.quoted && m.quoted.sender) ||
                null;

            const getUser = () => {
                if (!mentioned) return null;
                return mentioned;
            };

            // 🔥 COMMAND HANDLER
            switch (action) {

                case "add": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    const number = args[1];
                    if (!number) return reply("⚠️ Enter number");

                    const jid = number.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [jid], "add");
                        reply("✅ User added");
                    } catch (e) {
                        console.log("Add error:", e);
                        reply("❌ Failed to add");
                    }
                }
                break;

                case "kick": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    const user = getUser();
                    if (!user) return reply("⚠️ Tag or reply to user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [user], "remove");
                        reply("✅ User kicked");
                    } catch (e) {
                        console.log("Kick error:", e);
                        reply("❌ Failed to kick");
                    }
                }
                break;

                case "promote": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    const user = getUser();
                    if (!user) return reply("⚠️ Tag user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [user], "promote");
                        reply("✅ Promoted");
                    } catch (e) {
                        console.log("Promote error:", e);
                        reply("❌ Failed");
                    }
                }
                break;

                case "demote": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    const user = getUser();
                    if (!user) return reply("⚠️ Tag user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [user], "demote");
                        reply("✅ Demoted");
                    } catch (e) {
                        console.log("Demote error:", e);
                        reply("❌ Failed");
                    }
                }
                break;

                case "tagall": {
                    let text = "📢 Tagging everyone:\n\n";

                    for (let p of participants) {
                        text += `@${p.id.split("@")[0]}\n`;
                    }

                    await sock.sendMessage(m.chat, {
                        text,
                        mentions: participants.map(p => p.id)
                    });
                }
                break;

                case "hidetag": {
                    await sock.sendMessage(m.chat, {
                        text: "👻 Hidden tag",
                        mentions: participants.map(p => p.id)
                    });
                }
                break;

                case "open": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    await sock.groupSettingUpdate(m.chat, "not_announcement");
                    reply("✅ Group opened");
                }
                break;

                case "close": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    await sock.groupSettingUpdate(m.chat, "announcement");
                    reply("✅ Group closed");
                }
                break;

                case "lock": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    await sock.groupSettingUpdate(m.chat, "locked");
                    reply("🔒 Locked");
                }
                break;

                case "unlock": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    await sock.groupSettingUpdate(m.chat, "unlocked");
                    reply("🔓 Unlocked");
                }
                break;

                case "ginfo": {
                    let text = `📊 GROUP INFO

Name: ${metadata.subject}
Members: ${participants.length}
Admins: ${groupAdmins.length}
`;
                    reply(text);
                }
                break;

                case "glink": {
                    if (!isBotAdmin) return reply("❌ Bot must be admin");

                    const code = await sock.groupInviteCode(m.chat);
                    reply(`🔗 https://chat.whatsapp.com/${code}`);
                }
                break;

                default:
                    reply("❌ Unknown command");
            }

        } catch (err) {
            console.log("🔥 GROUP CRASH:", err);
            reply("❌ Error occurred");
        }
    }
};