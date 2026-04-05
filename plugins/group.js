// © 2026 Alpha - GROUP SYSTEM (FINAL ADMIN FIX 🔥😈)

module.exports = {
    command: [
        "add","kick","promote","demote",
        "tagall","tagadmins","hidetag",
        "ginfo","glink",
        "lock","unlock","open","close",
        "gname","gdesc","del","join","left"
    ],
    category: "group",

    execute: async (sock, m, { reply }) => {
        try {

            // ✅ SAFE BODY
            const body =
                m.body ||
                m.message?.conversation ||
                m.message?.extendedTextMessage?.text ||
                "";

            const cmd = body.startsWith(".")
                ? body.slice(1).trim().split(/ +/).shift().toLowerCase()
                : "";

            const args = body.trim().split(/ +/).slice(1);

            // 🌐 JOIN (works anywhere)
            if (cmd === "join") {
                const link = args[0];
                if (!link) return reply("❌ Provide group link");

                const code = link.split("https://chat.whatsapp.com/")[1];
                await sock.groupAcceptInvite(code);

                return reply("✅ Joined group");
            }

            // ❌ GROUP ONLY
            if (!m.chat.endsWith("@g.us")) {
                return reply("❌ Group only command");
            }

            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;

            const sender = m.key.participant || m.key.remoteJid;

            // ✅ FIXED ADMIN DETECTION
            const senderNumber = sender.split("@")[0];
            const botNumber = sock.user.id.split(":")[0];

            const isAdmin = participants.some(p =>
                p.id.includes(senderNumber) && p.admin
            );

            const isBotAdmin = participants.some(p =>
                p.id.includes(botNumber) && p.admin
            );

            // 🔒 ADMIN CHECK
            if (!isAdmin && cmd !== "left") {
                return reply("❌ Admin only");
            }

            // 🤖 BOT ADMIN CHECK
            const needBotAdmin = [
                "add","kick","promote","demote",
                "lock","unlock","open","close",
                "gname","gdesc"
            ];

            if (needBotAdmin.includes(cmd) && !isBotAdmin) {
                return reply("❌ Bot must be admin");
            }

            // ➕ ADD
            if (cmd === "add") {
                const num = args[0];
                if (!num) return reply("❌ Provide number");

                const jid = num.replace(/\D/g, "") + "@s.whatsapp.net";
                await sock.groupParticipantsUpdate(m.chat, [jid], "add");

                return reply("✅ User added");
            }

            // 👞 KICK
            if (cmd === "kick") {
                const user = m.mentionedJid?.[0];
                if (!user) return reply("❌ Tag user");

                await sock.groupParticipantsUpdate(m.chat, [user], "remove");
                return reply("👞 User kicked");
            }

            // ⬆️ PROMOTE
            if (cmd === "promote") {
                const user = m.mentionedJid?.[0];
                if (!user) return reply("❌ Tag user");

                await sock.groupParticipantsUpdate(m.chat, [user], "promote");
                return reply("⬆️ Promoted");
            }

            // ⬇️ DEMOTE
            if (cmd === "demote") {
                const user = m.mentionedJid?.[0];
                if (!user) return reply("❌ Tag user");

                await sock.groupParticipantsUpdate(m.chat, [user], "demote");
                return reply("⬇️ Demoted");
            }

            // 📢 TAG ALL
            if (cmd === "tagall") {
                let text = "📢 Tagging all:\n\n";
                let mentions = [];

                for (let p of participants) {
                    text += `• @${p.id.split("@")[0]}\n`;
                    mentions.push(p.id);
                }

                return sock.sendMessage(m.chat, { text, mentions }, { quoted: m });
            }

            // 🚨 TAG ADMINS
            if (cmd === "tagadmins") {
                let admins = participants.filter(p => p.admin);
                let text = "🚨 Admins:\n\n";
                let mentions = [];

                for (let p of admins) {
                    text += `• @${p.id.split("@")[0]}\n`;
                    mentions.push(p.id);
                }

                return sock.sendMessage(m.chat, { text, mentions }, { quoted: m });
            }

            // 👻 HIDETAG
            if (cmd === "hidetag") {
                let mentions = participants.map(p => p.id);

                return sock.sendMessage(
                    m.chat,
                    { text: args.join(" ") || "👻 Hidden tag", mentions },
                    { quoted: m }
                );
            }

            // ℹ️ GROUP INFO
            if (cmd === "ginfo") {
                return reply(
`📊 Group Info

📛 Name: ${metadata.subject}
👥 Members: ${participants.length}
📝 Desc: ${metadata.desc || "No description"}`
                );
            }

            // 🔗 GROUP LINK
            if (cmd === "glink") {
                const code = await sock.groupInviteCode(m.chat);
                return reply(`🔗 https://chat.whatsapp.com/${code}`);
            }

            // 🔒 LOCK
            if (cmd === "lock") {
                await sock.groupSettingUpdate(m.chat, "locked");
                return reply("🔒 Group locked");
            }

            // 🔓 UNLOCK
            if (cmd === "unlock") {
                await sock.groupSettingUpdate(m.chat, "unlocked");
                return reply("🔓 Group unlocked");
            }

            // 🔇 CLOSE
            if (cmd === "close") {
                await sock.groupSettingUpdate(m.chat, "announcement");
                return reply("🔇 Group closed");
            }

            // 🔊 OPEN
            if (cmd === "open") {
                await sock.groupSettingUpdate(m.chat, "not_announcement");
                return reply("🔊 Group opened");
            }

            // ✏️ NAME
            if (cmd === "gname") {
                const name = args.join(" ");
                if (!name) return reply("❌ Provide name");

                await sock.groupUpdateSubject(m.chat, name);
                return reply("✏️ Name updated");
            }

            // 📝 DESC
            if (cmd === "gdesc") {
                const desc = args.join(" ");
                if (!desc) return reply("❌ Provide description");

                await sock.groupUpdateDescription(m.chat, desc);
                return reply("📝 Description updated");
            }

            // 🗑️ DELETE MESSAGE
            if (cmd === "del") {
                if (!m.quoted) return reply("❌ Reply to message");

                await sock.sendMessage(m.chat, {
                    delete: m.quoted.key
                });

                return;
            }

            // 👋 LEAVE
            if (cmd === "left") {
                await sock.groupLeave(m.chat);
            }

        } catch (err) {
            console.log("Group error:", err);
            reply("❌ Group command failed");
        }
    }
};