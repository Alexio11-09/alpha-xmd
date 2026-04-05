// © 2026 Alpha - GROUP COMMANDS (FORCE MODE 😈)

module.exports = {
    command: "group",
    description: "Group management commands",
    category: "group",

    execute: async (sock, m, { args, reply }) => {
        try {

            if (!m.isGroup) return reply("❌ Group only command");

            // 😈 FORCE BYPASS
            const FORCE_MODE = true;

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

            const mentioned = m.mentionedJid[0] || m.quoted?.sender;

            // 🔥 HELPER
            const getUser = () => {
                if (!mentioned) return null;
                return mentioned;
            };

            // ================= COMMANDS ================= //

            switch (action) {

                case "add": {
                    if (!args[1]) return reply("⚠️ Use: .group add 263xxx");
                    try {
                        await sock.groupParticipantsUpdate(m.chat, [`${args[1]}@s.whatsapp.net`], "add");
                        reply("✅ User added");
                    } catch {
                        reply("❌ Failed to add user");
                    }
                }
                break;

                case "kick": {
                    const user = getUser();
                    if (!user) return reply("⚠️ Tag user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [user], "remove");
                        reply("✅ User kicked");
                    } catch {
                        reply("❌ Failed. Bot might not be admin");
                    }
                }
                break;

                case "promote": {
                    const user = getUser();
                    if (!user) return reply("⚠️ Tag user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [user], "promote");
                        reply("✅ Promoted");
                    } catch {
                        reply("❌ Failed. Bot might not be admin");
                    }
                }
                break;

                case "demote": {
                    const user = getUser();
                    if (!user) return reply("⚠️ Tag user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [user], "demote");
                        reply("✅ Demoted");
                    } catch {
                        reply("❌ Failed. Bot might not be admin");
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
                    } catch {
                        reply("❌ Failed");
                    }
                }
                break;

                case "close": {
                    try {
                        await sock.groupSettingUpdate(m.chat, "announcement");
                        reply("✅ Group closed");
                    } catch {
                        reply("❌ Failed");
                    }
                }
                break;

                case "lock": {
                    try {
                        await sock.groupSettingUpdate(m.chat, "locked");
                        reply("🔒 Locked");
                    } catch {
                        reply("❌ Failed");
                    }
                }
                break;

                case "unlock": {
                    try {
                        await sock.groupSettingUpdate(m.chat, "unlocked");
                        reply("🔓 Unlocked");
                    } catch {
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
                    } catch {
                        reply("❌ Failed");
                    }
                }
                break;

                default:
                    reply("❌ Unknown group command");

            }

        } catch (err) {
            console.log("Group error:", err);
            reply("❌ Error occurred");
        }
    }
};