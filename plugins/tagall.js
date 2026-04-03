module.exports = {
    command: 'tagall',
    description: 'Tag everyone in group',
    category: 'group',
    group: true,
    admin: true,

    execute: async (sock, m, { reply, send }) => {
        try {
            if (!m.isGroup) {
                return reply("❌ This is for groups only");
            }

            // ⚡ reaction start
            await sock.sendMessage(m.chat, {
                react: { text: "👥", key: m.key }
            });

            // 🔥 FETCH GROUP DATA
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants || [];

            if (!participants.length) {
                await sock.sendMessage(m.chat, {
                    react: { text: "❌", key: m.key }
                });
                return reply("❌ Failed to get members");
            }

            let text = "👥 *TAG ALL MEMBERS*\n\n";
            let mentions = [];

            for (let user of participants) {
                mentions.push(user.id);
                text += `➤ @${user.id.split('@')[0]}\n`;
            }

            // 🔥 USE GLOBAL SEND (CHANNEL STYLE INCLUDED)
            await send({
                text,
                mentions
            });

            // ✅ done reaction
            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key }
            });

        } catch (err) {
            console.log("Tagall error:", err);

            await sock.sendMessage(m.chat, {
                react: { text: "❌", key: m.key }
            });

            reply("❌ Error tagging members");
        }
    }
};