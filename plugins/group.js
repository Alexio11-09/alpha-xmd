// 🧪 FORCE TEST VERSION

module.exports = {
    command: "group",
    category: "group",

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!m.isGroup) return reply("❌ Group only");

            console.log("CHAT:", m.chat);
            console.log("SENDER:", m.sender);
            console.log("BOT:", sock.user.id);

            const action = args[0]?.toLowerCase();

            if (!action) {
                return reply(`GROUP COMMANDS

kick
promote
demote
tagall
lock
unlock`);
            }

            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;

            const mentioned =
                (m.mentionedJid && m.mentionedJid[0]) ||
                (m.quoted && m.quoted.sender);

            switch (action) {

                case "kick": {
                    if (!mentioned) return reply("Tag user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [mentioned], "remove");
                        reply("✅ Kick tried");
                    } catch (e) {
                        console.log("KICK ERROR:", e);
                        reply("❌ Kick failed");
                    }
                }
                break;

                case "promote": {
                    if (!mentioned) return reply("Tag user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [mentioned], "promote");
                        reply("✅ Promote tried");
                    } catch (e) {
                        console.log("PROMOTE ERROR:", e);
                        reply("❌ Promote failed");
                    }
                }
                break;

                case "demote": {
                    if (!mentioned) return reply("Tag user");

                    try {
                        await sock.groupParticipantsUpdate(m.chat, [mentioned], "demote");
                        reply("✅ Demote tried");
                    } catch (e) {
                        console.log("DEMOTE ERROR:", e);
                        reply("❌ Demote failed");
                    }
                }
                break;

                case "tagall": {
                    let text = "📢 Tagging:\n\n";

                    for (let p of participants) {
                        text += `@${p.id.split("@")[0]}\n`;
                    }

                    await sock.sendMessage(m.chat, {
                        text,
                        mentions: participants.map(p => p.id)
                    });
                }
                break;

                case "lock": {
                    try {
                        await sock.groupSettingUpdate(m.chat, "announcement");
                        reply("🔒 Tried lock");
                    } catch (e) {
                        console.log("LOCK ERROR:", e);
                        reply("❌ Lock failed");
                    }
                }
                break;

                case "unlock": {
                    try {
                        await sock.groupSettingUpdate(m.chat, "not_announcement");
                        reply("🔓 Tried unlock");
                    } catch (e) {
                        console.log("UNLOCK ERROR:", e);
                        reply("❌ Unlock failed");
                    }
                }
                break;

                default:
                    reply("❌ Unknown");
            }

        } catch (err) {
            console.log("🔥 ERROR:", err);
            reply("❌ Error occurred");
        }
    }
};