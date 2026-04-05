// © 2026 Alpha - GROUP COMMANDS (STABLE 😈)

module.exports = {
    command: "group",
    description: "Group management commands",
    category: "group",

    execute: async (sock, m, { args, reply }) => {
        try {

            if (!m.isGroup) return reply("❌ Group only command");

            const action = args[0]?.toLowerCase();

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

            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;

            // ✅ SAFE MENTION FIX
            const mentioned =
                (m.mentionedJid && m.mentionedJid[0]) ||
                (m.quoted && m.quoted.sender) ||
                null;

            const getUser = () => {
                if (!mentioned) return null;
                return mentioned;
            };

            switch (action) {

                case "kick": {
                    const user = getUser();
                    if (!user) return reply("⚠️ Tag or reply to user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [user], "remove");
                        reply("✅ User kicked");
                    } catch (e) {
                        console.log("Kick error:", e);
                        reply("❌ Failed. Bot may not be admin");
                    }
                }
                break;

                case "promote": {
                    const user = getUser();
                    if (!user) return reply("⚠️ Tag or reply to user");

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
                    const user = getUser();
                    if (!user) return reply("⚠️ Tag or reply to user");

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
                    try {
                        await sock.groupSettingUpdate(m.chat, "not_announcement");
                        reply("✅ Group opened");
                    } catch (e) {
                        console.log("Open error:", e);
                        reply("❌ Failed");
                    }
                }
                break;

                case "close": {
                    try {
                        await sock.groupSettingUpdate(m.chat, "announcement");
                        reply("✅ Group closed");
                    } catch (e) {
                        console.log("Close error:", e);
                        reply("❌ Failed");
                    }
                }
                break;

                case "lock": {
                    try {
                        await sock.groupSettingUpdate(m.chat, "locked");
                        reply("🔒 Locked");
                    } catch (e) {
                        console.log("Lock error:", e);
                        reply("❌ Failed");
                    }
                }
                break;

                case "unlock": {
                    try {
                        await sock.groupSettingUpdate(m.chat, "unlocked");
                        reply("🔓 Unlocked");
                    } catch (e) {
                        console.log("Unlock error:", e);
                        reply("❌ Failed");
                    }
                }
                break;

                case "ginfo": {
                    let text = `📊 GROUP INFO

Name: ${metadata.subject}
Members: ${participants.length}
Admins: ${participants.filter(p => p.admin).length}
`;
                    reply(text);
                }
                break;

                case "glink": {
                    try {
                        const code = await sock.groupInviteCode(m.chat);
                        reply(`🔗 https://chat.whatsapp.com/${code}`);
                    } catch (e) {
                        console.log("Link error:", e);
                        reply("❌ Failed");
                    }
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