// © 2026 Alpha - GROUP FIX (NO SERIALIZER DEPENDENCE 💯)

module.exports = {
    command: "group",
    category: "group",

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!m.isGroup) return reply("❌ Group only");

            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;

            // 🔥 CLEAN FUNCTION
            const clean = (jid) => jid?.split("@")[0];

            // 🔥 FIND REAL SENDER FROM PARTICIPANTS
            const senderObj = participants.find(p =>
                clean(p.id) === clean(m.sender)
            );

            const botObj = participants.find(p =>
                clean(p.id) === clean(sock.user.id)
            );

            // 🔥 ADMIN CHECK
            const isAdmin =
                senderObj?.admin === "admin" ||
                senderObj?.admin === "superadmin";

            const isBotAdmin =
                botObj?.admin === "admin" ||
                botObj?.admin === "superadmin";

            console.log("isAdmin:", isAdmin);
            console.log("isBotAdmin:", isBotAdmin);

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
`);
            }

            const mentioned =
                (m.mentionedJid && m.mentionedJid[0]) ||
                (m.quoted && m.quoted.sender);

            switch (action) {

                case "kick": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");
                    if (!mentioned) return reply("⚠️ Tag user");

                    await sock.groupParticipantsUpdate(m.chat, [mentioned], "remove");
                    reply("✅ User kicked");
                }
                break;

                case "promote": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");
                    if (!mentioned) return reply("⚠️ Tag user");

                    await sock.groupParticipantsUpdate(m.chat, [mentioned], "promote");
                    reply("✅ Promoted");
                }
                break;

                case "demote": {
                    if (!isAdmin) return reply("❌ You must be admin");
                    if (!isBotAdmin) return reply("❌ Bot must be admin");
                    if (!mentioned) return reply("⚠️ Tag user");

                    await sock.groupParticipantsUpdate(m.chat, [mentioned], "demote");
                    reply("✅ Demoted");
                }
                break;

                case "tagall": {
                    let text = "📢 Tagging everyone:\n\n";

                    for (let p of participants) {
                        text += `@${clean(p.id)}\n`;
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

                default:
                    reply("❌ Unknown command");
            }

        } catch (err) {
            console.log("GROUP ERROR:", err);
            reply("❌ Error occurred");
        }
    }
};